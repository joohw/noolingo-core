// @/services/note.service.ts
// 笔记服务层，提供了绝大多数的笔记和笔记本的操作的接口



import { Note, NoteAction, ColorLabel } from '../note';
import { SortState } from '../deck';
import { CardState, getStabilityFromMastery, defaultRecall } from '../fsrs';
import { useNoteStore, ContextOperation } from '../stores/noteStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useStudyStore } from '../stores/studyStore';
import noteRepo from '../repo/NoteRepository';
import { Service } from './service'
import indicesService from './indices.service';


const BATCH_SIZE = 100;


export class NoteService implements Service {


    constructor() {
        indicesService.clear();
        useNoteStore.getState().reset();
    }


    async init() {

    }


    // 导入笔记到指定deck
    public async importNotes(
        notesPartial: Partial<Note>[],
        deckId?: string,
        path?: string[] | null
    ): Promise<{ importedNotes: Note[], deckId?: string }> {
        try {
            const importedNotes = await this.addNotes(notesPartial, deckId, path);
            return { importedNotes, deckId };
        } catch (error) {
            console.error('Error importing notes:', error);
            throw error;
        }
    }


    public prepareNotes(notesData: Partial<Note>[]) {
        const notesToAdd: Partial<Note>[] = [];
        const notesToUpdate: { [noteId: string]: Partial<Note> } = {};
        const notesSkipped: Partial<Note>[] = [];
        let sameIdUpdates = 0;
        let hashDuplicates = 0;
        let newNotes = 0;
        for (const noteData of notesData) {
            // 如果有 ID，检查是否需要更新
            if (noteData.id) {
                const existingNote = indicesService.getNoteById(noteData.id);
                if (existingNote) {
                    const existingTime = existingNote.updated_at ? new Date(existingNote.updated_at).getTime() : 0;
                    const newTime = noteData.updated_at ? new Date(noteData.updated_at).getTime() : Date.now();
                    if (newTime > existingTime) {
                        const { created_at, ...noteDataWithoutCreatedAt } = noteData;
                        notesToUpdate[noteData.id] = {
                            ...existingNote,
                            ...noteDataWithoutCreatedAt,
                            created_at: existingNote.created_at,
                            updated_at: new Date().toISOString(),
                        };
                    } else {
                        notesSkipped.push(noteData); // 时间戳较旧的跳过
                    }
                    sameIdUpdates++;
                    continue;
                }
            }
            // 无 ID 或未找到对应笔记时：检查是否存在相同 Hash
            if (!indicesService.isNoteHashExists(noteData)) {
                notesToAdd.push(noteData);
                newNotes++;
            } else {
                hashDuplicates++;
                notesSkipped.push(noteData);
            }
        }
        return {
            notesToAdd,
            notesToUpdate,
            notesSkipped,
        };
    }


    // 添加或者更新笔记，使用版本号实现覆盖
    public async addNotes(notesData: Partial<Note>[], deckId?: string, path?: string[] | null): Promise<Note[]> {
        try {
            const targetDeckId = deckId;
            const targetPath = path !== undefined ? path : (() => {
                const currentQuery = useNoteStore.getState().searchQuery;
                return currentQuery?.path;
            })();
            if (targetPath && Array.isArray(targetPath) && targetPath.length > 0) {
                notesData.forEach(noteData => {
                    if (!noteData.path) {
                        noteData.path = targetPath;
                    }
                });
            } else if (targetPath === null) {
                notesData.forEach(noteData => {
                    noteData.path = null;
                });
            }
            const { notesToAdd, notesToUpdate } = this.prepareNotes(notesData);
            const allAddedNotes: Note[] = [];
            if (notesToAdd.length > 0) {
                const addResults = await noteRepo.addNotes(notesToAdd, { deckId: targetDeckId });
                addResults.updatedNotes.forEach(note => {
                    indicesService.addNoteIndex(note);
                    allAddedNotes.push(note);
                });
            }
            if (Object.keys(notesToUpdate).length > 0) {
                const updatedNotes = await this.updateNotes(notesToUpdate);
                allAddedNotes.push(...updatedNotes);
            }
            const store = useNoteStore.getState();
            const selectedDeckId = store.searchQuery.deckId ?? 'all';
            if (deckId === selectedDeckId && allAddedNotes.length > 0 || selectedDeckId == 'all' || selectedDeckId == '') {
                this.addToNoteList(allAddedNotes.map(note => note.id));
            }
            return allAddedNotes;
        } catch (error) {
            console.error('❌ 添加笔记时发生错误', error);
            throw error;
        }
    }



    // 更新笔记
    public async updateNotes(
        updates: { [noteId: string]: Partial<Note> },
    ): Promise<Note[]> {
        try {
            if (Object.keys(updates).length === 0) return [];
            const updateEntries = Object.entries(updates);
            let allUpdatedNotes: Note[] = [];
            for (let i = 0; i < updateEntries.length; i += BATCH_SIZE) {
                const batch = updateEntries.slice(i, i + BATCH_SIZE);
                const notesToUpdate = batch
                    .map(([id, update]): (Partial<Note> & { id: string }) | null => {
                        const currentNote = indicesService.getNoteById(id);
                        if (!currentNote) return null;
                        return {
                            ...currentNote,
                            ...update,
                            id,
                            updated_at: new Date().toISOString(),
                        };
                    })
                    .filter((note): note is Partial<Note> & { id: string } => note !== null);
                const results = await noteRepo.updateNotes(notesToUpdate);
                results.updatedNotes.forEach(note => {
                    indicesService.removeNoteIndex(note.id);
                    indicesService.addNoteIndex(note);
                })
                allUpdatedNotes.push(...results.updatedNotes);
            }
            return allUpdatedNotes;
        } catch (error) {
            console.error('Error updating notes', error);
            throw error;
        }
    }


    // 删除笔记并删除索引
    public deleteNotes(noteIds: string[]) {
        noteIds.forEach(noteId => {
            indicesService.removeNoteIndex(noteId);
        });
        this.removeFromNoteList(noteIds);
        noteRepo.hardDeleteNotes(noteIds);
    }



    public async handleNoteAction(
        noteId: string,
        action: NoteAction,
    ) {
        try {
            const note = indicesService.getNoteById(noteId);
            switch (action) {
                case 'info': {
                    console.log(note);
                    break;
                }
                case 'read': {
                    const noteList = useNoteStore.getState().noteList;
                    const noteIndex = noteList.indexOf(noteId);
                    const displayNoteIds = (noteIndex === -1 || noteList.length === 1)
                        ? [noteId]
                        : noteList;
                    useNoteStore.getState().setReadingNotes(
                        displayNoteIds,
                        noteIndex === -1 ? 0 : noteIndex
                    );
                    break;
                }
                case 'delete': {
                    const noteToEdit = indicesService.getNoteById(noteId);
                    if (!noteToEdit) return;
                    await this.updateNotes({
                        [noteId]: {
                            _deleted_at: Date.now(),
                            original_deck: noteToEdit.deck_id || '',
                            deck_id: undefined
                        }
                    });
                    this.removeFromNoteList(noteId);
                    break;
                }
                case 'undelete': {
                    const noteToEdit = indicesService.getNoteById(noteId);
                    if (!noteToEdit) return;
                    await this.updateNotes({
                        [noteId]: { _deleted_at: undefined, original_deck: undefined, deck_id: noteToEdit.original_deck || '' }
                    });
                    this.removeFromNoteList(noteId);
                    break;
                }
                case 'hardDelete': {
                    await this.deleteNotes([noteId]);
                    break;
                }
                case 'archive':
                case 'unarchive': {
                    const noteToToggle = indicesService.getNoteById(noteId);
                    if (!noteToToggle) return;
                    const newArchived = !noteToToggle.archived;
                    await this.updateNotes({
                        [noteId]: { archived: newArchived }
                    });
                    break
                }
                case 'favorite':
                case 'unfavorite': {
                    const noteToFavorite = indicesService.getNoteById(noteId);
                    if (!noteToFavorite) return;
                    const newStarred = !noteToFavorite.starred;
                    await this.updateNotes({
                        [noteId]: { starred: newStarred }
                    });
                    break;
                }
                case 'clearHistory': {
                    if (!note) return;
                    await this.updateNotes({
                        [noteId]: {
                            recall: defaultRecall(),
                            next_quiz_at: undefined,
                            last_quiz_at: undefined,
                            archived: false,
                        }
                    });
                    break;
                }
                case 'impressed': {
                    if (!note) return;
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.12, retentionDays)
                    await this.updateNotes({
                        [noteId]: {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        }
                    });
                    break;
                }
                case 'familiar': {
                    if (!note) return;
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.45, retentionDays)
                    await this.updateNotes({
                        [noteId]: {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        }
                    });
                    break;
                }
                case 'mastered': {
                    if (!note) return;
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.75, retentionDays)
                    await this.updateNotes({
                        [noteId]: {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        }
                    });
                    break;
                }
                case 'fullyMastered': {
                    if (!note) return;
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = retentionDays;
                    await this.updateNotes({
                        [noteId]: {
                            archived: true,
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                        } as Partial<Note>
                    });
                    break;
                }
                case 'select': {
                    const { isSelectionMode, toggleSelection, toggleSelectionMode } = useSelectionStore.getState();
                    if (!isSelectionMode) {
                        toggleSelectionMode();
                    }
                    toggleSelection(noteId);
                    break;
                }
            }
        } catch (error) {
        }
    }


    public async handleBatchNoteAction(noteIds: string[], action: NoteAction) {
        try {
            switch (action) {
                case 'delete': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    noteIds.forEach(id => {
                        updates[id] = {
                            _deleted_at: Date.now(),
                            original_deck: indicesService.getNoteById(id)?.deck_id || '',
                            deck_id: undefined
                        };
                    });
                    await this.updateNotes(updates);
                    this.removeFromNoteList(noteIds);
                    break;
                }
                case 'unarchive':
                case 'archive': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    const shouldArchive = action === 'archive';
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (note && note.archived !== shouldArchive) {
                            updates[id] = { archived: shouldArchive };
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'favorite': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (note && !note.starred) {
                            updates[id] = { starred: true };
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'unfavorite': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (note && note.starred) {
                            updates[id] = { starred: false };
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'clearHistory': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (!note) continue;
                        updates[id] = {
                            recall: defaultRecall(),
                            next_quiz_at: undefined,
                            last_quiz_at: undefined,
                            archived: false,
                        };
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'impressed': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.12, retentionDays);
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (!note) continue;
                        updates[id] = {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        };
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'familiar': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.45, retentionDays);
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (!note) continue;
                        updates[id] = {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        };
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'mastered': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = getStabilityFromMastery(0.75, retentionDays);
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (!note) continue;
                        updates[id] = {
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                            archived: false,
                        };
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
                case 'fullyMastered': {
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    const retentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                    const stability = retentionDays;
                    for (const id of noteIds) {
                        const note = indicesService.getNoteById(id);
                        if (!note) continue;
                        updates[id] = {
                            archived: true,
                            recall: {
                                ...note.recall,
                                state: CardState.REVIEW,
                                stability: stability,
                            },
                        } as Partial<Note>;
                    }
                    if (Object.keys(updates).length > 0) {
                        await this.updateNotes(updates);
                    }
                    break;
                }
            }
        } catch (error) {
        }
    }








    public async changeNoteColor(noteId: string, color: ColorLabel) {
        try {
            const note = indicesService.getNoteById(noteId);
            if (!note) return;
            await this.updateNotes({
                [noteId]: {
                    color: color
                }
            });
        } catch (error) {
            console.error('Failed to update note color:', error);
        }
    }



    public async moveNotesToDeck(noteIds: string[], targetDeckId: string, targetPath?: string[]) {
        try {
            useNoteStore.getState().setOperation(ContextOperation.UPDATING);
            const updates: { [noteId: string]: Partial<Note> } = {};
            noteIds.forEach(noteId => {
                const update: Partial<Note> = {
                    deck_id: targetDeckId === '' ? undefined : targetDeckId
                };
                if (targetPath !== undefined) {
                    update.path = targetPath;
                } else {
                    update.path = null;
                }
                updates[noteId] = update;
            });
            await this.updateNotes(updates);
        } catch (error) {
            console.error('Error moving notes:', error);
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }




    // 过滤掉已删除的笔记（回收站中的笔记）
    private filterDeletedNotes(noteIds: string[], deckId?: string): string[] {
        if (deckId === 'all' || deckId === 'unorganized') {
            return noteIds.filter(id => {
                const note = indicesService.getNoteById(id);
                return note && !note._deleted_at;
            });
        }
        return noteIds;
    }





    public getNotesByTags(tags: string[]): Note[] {
        try {
            if (!tags || tags.length === 0) return [];
            const noteIds = indicesService.getNotesByTags(tags);
            return noteIds
                .map(id => indicesService.getNoteById(id))
                .filter((note): note is Note => !!note);
        } catch (error) {
            console.error('Error getting notes by tags:', error);
            return [];
        }
    }




    public async getValidReferenceIds(noteIds: string[]): Promise<string[]> {
        if (!noteIds || noteIds.length === 0) return [];
        try {
            const uniqueIds = [...new Set(noteIds)];
            const notesPromises = uniqueIds.map(id => indicesService.getNoteById(id));
            const notes = await Promise.all(notesPromises);
            return uniqueIds.filter((id, index) => {
                const note = notes[index];
                return note !== null &&
                    note !== undefined &&
                    !note._deleted_at &&
                    note.features?.summary &&
                    note.features.summary.trim() !== '';
            });
        } catch (error) {
            console.error('Error filtering valid references:', error);
            return [];
        }
    }




    // 把笔记添加到渲染的笔记列表中
    public addToNoteList(noteIds: string | string[]) {
        const currentNoteList = useNoteStore.getState().noteList;
        const currentNoteSet = new Set(currentNoteList);
        if (Array.isArray(noteIds)) {
            if (noteIds.length === 0) return;
            const newNoteIds = noteIds.filter(id => !currentNoteSet.has(id));
            if (newNoteIds.length > 0) {
                useNoteStore.getState().setNoteList([...newNoteIds, ...currentNoteList]);
            }
        } else {
            if (!currentNoteSet.has(noteIds)) {
                useNoteStore.getState().setNoteList([noteIds, ...currentNoteList]);
            }
        }
    }


    // 从渲染的笔记列表中移除笔记
    public removeFromNoteList(noteIds: string | string[]) {
        const currentNoteList = useNoteStore.getState().noteList;
        if (Array.isArray(noteIds)) {
            if (noteIds.length === 0) return;
            const noteIdSet = new Set(noteIds);
            const updatedNoteList = currentNoteList.filter(id => !noteIdSet.has(id));
            if (updatedNoteList.length !== currentNoteList.length) {
                useNoteStore.getState().setNoteList(updatedNoteList);
            }
        } else {
            const index = currentNoteList.indexOf(noteIds);
            if (index !== -1) {
                const updatedNoteList = [...currentNoteList];
                updatedNoteList.splice(index, 1);
                useNoteStore.getState().setNoteList(updatedNoteList);
            }
        }
    }



    async updateNotesOrder(newOrder: string[]) {
        try {
            const updates: { [key: string]: Partial<Note> } = {};
            const POSITION_STEP = 10000;
            newOrder.forEach((id, index) => {
                updates[id] = {
                    position: (index + 1) * POSITION_STEP
                };
            });
            await this.updateNotes(updates);
        } catch (error) {
            console.error('Failed to update notes order:', error);
            throw error;
        }
    }


    async moveNoteUp(noteId: string): Promise<void> {
        if (!indicesService) return;
        const store = useNoteStore.getState();
        const selectedDeckId = store.searchQuery.deckId ?? 'all';
        const searchQuery = store.searchQuery;
        const path = searchQuery?.path;
        if (!selectedDeckId) return;
        const noteList = store.noteList;
        const currentIndex = noteList.findIndex(id => id === noteId);
        if (currentIndex <= 0) return;
        const prevNoteId = noteList[currentIndex - 1];
        const note = indicesService.getNoteById(noteId);
        const prevNote = indicesService.getNoteById(prevNoteId);
        if (!note || !prevNote) return;
        let currentPosition = note.position !== null && note.position !== undefined ? note.position : new Date(note.created_at).getTime();
        let prevPosition = prevNote.position !== null && prevNote.position !== undefined ? prevNote.position : new Date(prevNote.created_at).getTime();
        if (currentPosition === prevPosition) {
            prevPosition = currentPosition - 1;
        }
        await this.updateNotes({
            [noteId]: { position: prevPosition },
            [prevNoteId]: { position: currentPosition }
        });
        const sortState: SortState = { key: 'position', order: 'asc' };
        let updatedNoteIds = indicesService.getDeckNoteIds(selectedDeckId, sortState);
        // 如果指定了路径，过滤出匹配路径的笔记
        if (path !== undefined && path !== null && path.length > 0) {
            updatedNoteIds = updatedNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
        }
        updatedNoteIds = this.filterDeletedNotes(updatedNoteIds, selectedDeckId);
        useNoteStore.getState().setNoteList(updatedNoteIds);
    }


    async moveNoteDown(noteId: string): Promise<void> {
        if (!indicesService) return;
        const store = useNoteStore.getState();
        const selectedDeckId = store.searchQuery.deckId ?? 'all';
        const searchQuery = store.searchQuery;
        const path = searchQuery?.path;
        if (!selectedDeckId) return;
        const noteList = store.noteList;
        const currentIndex = noteList.findIndex(id => id === noteId);
        if (currentIndex < 0 || currentIndex >= noteList.length - 1) return;
        const nextNoteId = noteList[currentIndex + 1];
        const note = indicesService.getNoteById(noteId);
        const nextNote = indicesService.getNoteById(nextNoteId);
        if (!note || !nextNote) return;
        let currentPosition = note.position !== null && note.position !== undefined ? note.position : new Date(note.created_at).getTime();
        let nextPosition = nextNote.position !== null && nextNote.position !== undefined ? nextNote.position : new Date(nextNote.created_at).getTime();
        if (currentPosition === nextPosition) {
            nextPosition = currentPosition + 1;
        }
        await this.updateNotes({
            [noteId]: { position: nextPosition },
            [nextNoteId]: { position: currentPosition }
        });
        const sortState: SortState = { key: 'position', order: 'asc' };
        let updatedNoteIds = indicesService.getDeckNoteIds(selectedDeckId, sortState);
        // 如果指定了路径，过滤出匹配路径的笔记
        if (path !== undefined && path !== null && path.length > 0) {
            updatedNoteIds = updatedNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
        }
        updatedNoteIds = this.filterDeletedNotes(updatedNoteIds, selectedDeckId);
        useNoteStore.getState().setNoteList(updatedNoteIds);
    }


    async moveNoteToTop(noteId: string): Promise<void> {
        if (!indicesService) return;
        const store = useNoteStore.getState();
        const selectedDeckId = store.searchQuery.deckId ?? 'all';
        const searchQuery = store.searchQuery;
        const path = searchQuery?.path;
        if (!selectedDeckId) return;
        const noteList = store.noteList;
        const currentIndex = noteList.findIndex(id => id === noteId);
        if (currentIndex <= 0) return;
        const note = indicesService.getNoteById(noteId);
        if (!note) return;
        const POSITION_STEP = 10000;
        const notes = noteList.map(id => {
            const n = indicesService.getNoteById(id);
            return n ? {
                id: n.id,
                position: n.position !== null && n.position !== undefined ? n.position : new Date(n.created_at).getTime()
            } : null;
        }).filter((n): n is { id: string; position: number } => n !== null);
        if (notes.length === 0) return;
        const minPosition = Math.min(...notes.map(n => n.position));
        const newPosition = minPosition - POSITION_STEP;
        await this.updateNotes({
            [noteId]: { position: newPosition }
        });
        const sortState: SortState = { key: 'position', order: 'asc' };
        let updatedNoteIds = indicesService.getDeckNoteIds(selectedDeckId, sortState);
        // 如果指定了路径，过滤出匹配路径的笔记
        if (path !== undefined && path !== null && path.length > 0) {
            updatedNoteIds = updatedNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
        }
        updatedNoteIds = this.filterDeletedNotes(updatedNoteIds, selectedDeckId);
        useNoteStore.getState().setNoteList(updatedNoteIds);
    }


    async moveNoteToBottom(noteId: string): Promise<void> {
        if (!indicesService) return;
        const store = useNoteStore.getState();
        const searchQuery = store.searchQuery;
        const selectedDeckId = store.searchQuery.deckId ?? 'all';
        const path = searchQuery?.path;
        if (!selectedDeckId) return;
        const noteList = store.noteList;
        const currentIndex = noteList.findIndex(id => id === noteId);
        if (currentIndex < 0 || currentIndex >= noteList.length - 1) return;
        const note = indicesService.getNoteById(noteId);
        if (!note) return;
        const POSITION_STEP = 10000;
        const notes = noteList.map(id => {
            const n = indicesService.getNoteById(id);
            return n ? {
                id: n.id,
                position: n.position !== null && n.position !== undefined ? n.position : new Date(n.created_at).getTime()
            } : null;
        }).filter((n): n is { id: string; position: number } => n !== null);
        if (notes.length === 0) return;
        const maxPosition = Math.max(...notes.map(n => n.position));
        const newPosition = maxPosition + POSITION_STEP;
        await this.updateNotes({
            [noteId]: { position: newPosition }
        });
        const sortState: SortState = { key: 'position', order: 'asc' };
        let updatedNoteIds = indicesService.getDeckNoteIds(selectedDeckId, sortState);
        if (path !== undefined && path !== null && path.length > 0) {
            updatedNoteIds = updatedNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
        }
        updatedNoteIds = this.filterDeletedNotes(updatedNoteIds, selectedDeckId);
        useNoteStore.getState().setNoteList(updatedNoteIds);
    }



}


export const noteService = new NoteService();
export default noteService;