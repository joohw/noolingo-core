// @/repo/NoteRepository.tsx


import { v4 as uuidv4 } from 'uuid';
import { QuizModel } from '../quiz';
import { storage, SyncDbClient } from '../storage/syncManager';
import { Note, createDefaultNote, validateNote } from '../note';
import { Deck, createDefaultDeck, validateDeck } from '../deck';



export interface QuizStats {
    totalQuizzes: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
}


export interface NoteUpdateResult {
    updatedNotes: Note[];
    affectedNoteIds: Set<string>;
    deletedNoteIds?: string[];
}


export interface NoteOperationOptions {
    deckId?: string;
    persist?: boolean;
    onProgress?: (progress: number) => void;
    checkCancellation?: () => boolean;
}


export interface DeckOperationOptions {
    persist?: boolean;
}


export class NoteRepository {
    private storage: SyncDbClient;
    constructor() {
        this.storage = storage;
    }
    async readNotes(
        limit?: number,
        offset?: number,
        validateNotes: boolean = true
    ): Promise<{
        items: Note[];
        hasMore: boolean;
        offset?: number;
        total?: number;
        invalidNoteIds?: string[]
    }> {
        const result = await this.storage.readStore<Note>('localNotes', limit, offset);
        let notes = result.items;
        let invalidNoteIds: string[] = [];
        if (validateNotes) {
            const validationResults = await Promise.all(
                notes.map(note => ({
                    original: note,
                    validated: validateNote(note)
                }))
            );
            invalidNoteIds = validationResults
                .filter(result => result.validated === null)
                .map(result => result.original.id);
            notes = validationResults
                .filter((result): result is { original: Note, validated: Note } =>
                    result.validated !== null)
                .map(result => result.validated);
        }
        return {
            items: notes,
            hasMore: result.hasMore,
            offset: offset,
            invalidNoteIds: invalidNoteIds.length > 0 ? invalidNoteIds : undefined
        };
    }


    async listDecks(): Promise<Deck[]> {
        const decks = await this.storage.readAll<Deck>('localDecks');
        return decks.map(deck => {
            const validatedDeck = validateDeck(deck);
            validatedDeck.stats = {
                notes_count: 0,
                new_count: 0,
                archived_count: 0,
                reviewable_count: 0,
                total_stability: 0,
            };
            return validatedDeck;
        });
    }


    async getNote(noteId: string): Promise<Note | undefined> {
        const notes = await this.storage.readBulk<Note>('localNotes', noteId);
        if (notes.length === 0) return undefined;
        const validatedNote = validateNote(notes[0]);
        return validatedNote || undefined;
    }


    async getDeck(deckId: string): Promise<Deck | undefined> {
        const decks = await this.storage.readBulk<Deck>('localDecks', deckId);
        if (decks.length === 0) return undefined;
        const validatedDeck = validateDeck(decks[0]);
        validatedDeck.stats = {
            notes_count: 0,
            new_count: 0,
            archived_count: 0,
            reviewable_count: 0,
            total_stability: 0,
        };
        return validatedDeck;
    }


    async updateDeck(deckId: string, deckUpdate: Partial<Deck>): Promise<Deck> {
        const { stats, ...deckWithoutStats } = deckUpdate;
        const updatedDecks = await this.storage.updateBulk<Deck>('localDecks', [{
            ...deckWithoutStats,
            id: deckId
        }]);
        const validatedDeck = validateDeck(updatedDecks[0]);
        validatedDeck.stats = {
            notes_count: 0,
            new_count: 0,
            archived_count: 0,
            reviewable_count: 0,
            total_stability: 0,
        };
        return validatedDeck;
    }


    async createDeck(deckData: Partial<Deck>): Promise<Deck> {
        if (!deckData.name) {
            throw new Error("Deck name is required");
        }
        // 排除stats字段，不保存到数据库
        const { stats, ...deckDataWithoutStats } = deckData;
        const newDeck = validateDeck({
            ...createDefaultDeck(),
            ...deckDataWithoutStats,
        });
        // 创建时排除stats字段
        const { stats: _, ...deckToSave } = newDeck;
        const [deckId] = await this.storage.createBulk<Deck>('localDecks', [deckToSave as Deck]);
        const createdDeck = { ...newDeck, id: deckId };
        // 重置stats
        createdDeck.stats = {
            notes_count: 0,
            new_count: 0,
            archived_count: 0,
            reviewable_count: 0,
            total_stability: 0,
        };
        return createdDeck;
    }

    
    async addNotes(
        notesData: Partial<Note>[],
        options: {
            deckId?: string,
            onProgress?: (progress: number) => void,
            checkCancellation?: () => boolean,
        } = {}
    ): Promise<NoteUpdateResult> {
        const { deckId, onProgress = () => { }, checkCancellation = () => false } = options;
        const validNotesData = notesData
            .map((noteData: Partial<Note>) => {
                const { id, ...rest } = noteData;
                return validateNote({
                    ...rest,
                    id: uuidv4(),
                    deck_id: deckId || null
                });
            })
            .filter((note): note is Note => note !== null);
        if (validNotesData.length === 0) {
            return {
                updatedNotes: [],
                affectedNoteIds: new Set()
            };
        }
        const affectedNoteIds = new Set<string>();
        validNotesData.forEach(note => {
            if (note) {
                affectedNoteIds.add(note.id);
                if (note.links?.to) {
                    note.links.to.forEach(targetId => {
                        affectedNoteIds.add(targetId);
                    });
                }
            }
        });
        // 批量创建笔记
        const batchSize = 100;
        const allNotes: Note[] = [];
        for (let i = 0; i < validNotesData.length; i += batchSize) {
            if (checkCancellation()) {
                break;
            }
            const batch = validNotesData.slice(i, i + batchSize);
            const createdNotes = await this.storage.putBulk<Note>('localNotes', batch);
            allNotes.push(...createdNotes);
            onProgress(((i + batch.length) / validNotesData.length) * 100);
        }
        return {
            updatedNotes: allNotes,
            affectedNoteIds
        };
    }


    async updateNotes(notes: Array<Partial<Note> & { id: string }>): Promise<NoteUpdateResult> {
        const updatedNotes = await this.storage.putBulk<Note>('localNotes', notes.map(noteUpdate => {
            const { features, ...noteWithoutFeatures } = noteUpdate;  // 解构移除 features
            const newNote = createDefaultNote();
            return {
                ...newNote,
                ...noteWithoutFeatures
            };
        }));
        const validatedNotes = (await Promise.all(updatedNotes.map(note => validateNote(note))))
            .filter((note): note is Note => note !== null);
        return {
            updatedNotes: validatedNotes,
            affectedNoteIds: new Set()
        };
    }

    async hardDeleteNotes(noteIds: string[]): Promise<void> {
        await this.storage.hardDeleteBulk('localNotes', noteIds);
    }

    async hardDeleteDeck(deckId: string): Promise<void> {
        await this.storage.hardDeleteBulk('localDecks', [deckId]);
    }

    async hardDeleteDecks(deckIds: string[]): Promise<void> {
        await this.storage.hardDeleteBulk('localDecks', deckIds);
    }

    async clearLocalNotesAndDecks(): Promise<void> {
        await Promise.all([
            this.storage.clearStore('localNotes'),
            this.storage.clearStore('localDecks'),
            this.storage.clearStore('tombStones'),
        ]);
    }


    // 查找特定笔记关联的所有测验
    async getQuizzes(noteId: string): Promise<QuizModel[]> {
        const note = await this.getNote(noteId);
        return note?.quizzes || [];
    }

    // 更新指定笔记的测验列表
    async saveQuizzes(noteId: string, quizzes: QuizModel[]): Promise<Note> {
        const updatedNotes = await this.storage.updateBulk<Note>('localNotes', [{
            id: noteId,
            quizzes: quizzes
        }]);
        return validateNote(updatedNotes[0])!;
    }


}

export const noteRepo = new NoteRepository();
export default noteRepo;