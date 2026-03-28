// @/core/services/public.service
// 公共笔记服务

import { Service } from './service'
import { Note } from '../note';
import { PublicDeck } from '../deck/deck_model';
import { createDefaultNote, BaseNote, validateNote } from '../note';
import { createDefaultDeck, Deck } from '../deck';
import nooCloud from '../cloud';


export class PublicService implements Service {


    constructor() { }


    async init(): Promise<any> {

    }

    async getPublicDecks(): Promise<PublicDeck[]> {
        try {
            const endpoint = `${nooCloud.core.getFullUrl('/public/decks')}`;
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error('API request failed');
            }
            const decksData = responseData.data?.decks || [];
            if (!Array.isArray(decksData)) {
                console.warn('Response decks is not an array:', typeof decksData);
                return [];
            }
            return decksData;
        } catch (error) {
            console.error('Failed to get curated decks:', error);
            throw error;
        }
    }



    async getPublicNotesByDeckId(deckId: string): Promise<Note[]> {
        try {
            const url = nooCloud.core.getFullUrl(`/public/deck?deckId=${deckId}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error('API request failed');
            }
            const deckData = responseData.data;
            if (!deckData?.notes || !Array.isArray(deckData.notes)) {
                return [];
            }
            return deckData.notes.map((note: BaseNote) =>
                createDefaultNote({
                    title: note.title,
                    tags: note.tags || [],
                    markdown_text: note.markdown_text,
                })
            );
        } catch (error) {
            console.error(`Failed to get public notes for deck ${deckId}:`, error);
            return [];
        }
    }



    public async getSharedDeck(shortId: string, readAll = true, offset: number = 0, limit: number = 100
    ): Promise<{
        deck: Deck;
        notes: Note[];
        totalNotes: number;
    }> {
        try {
            let allNotes: Note[] = [];
            let currentOffset = offset;
            let totalNotes = 0;
            let deck: Deck | null = null;
            const id = shortId.toLowerCase();
            const firstResponse = await nooCloud.note.getSharedDeck({
                shortId: id,
                offset: currentOffset,
                limit,
            });
            if (!firstResponse.success) {
                throw new Error(firstResponse.message || 'Failed to get shared deck');
            }
            if (!firstResponse.data?.deck || !firstResponse.data.notes) {
                throw new Error('Invalid shared deck data structure');
            }
            deck = createDefaultDeck({ ...firstResponse.data.deck });
            totalNotes = firstResponse.data.pagination?.totalItems || firstResponse.data.totalNotes || 0;
            // 添加第一批notes
            const firstNotes = firstResponse.data.notes.map((note: Note) =>
                validateNote(createDefaultNote({ ...note }))
            );
            allNotes = [...allNotes, ...firstNotes];
            currentOffset += firstNotes.length;
            if (readAll && currentOffset < totalNotes) {
                while (currentOffset < totalNotes) {
                    const response = await nooCloud.note.getSharedDeck({
                        shortId: id,
                        offset: currentOffset,
                        limit,
                    });
                    if (!response.success) {
                        throw new Error(response.message || 'Failed to get shared deck');
                    }
                    if (!response.data?.notes) {
                        break; // 没有更多数据了
                    }
                    const notesToAdd = response.data.notes.map((note: Note) =>
                        validateNote(createDefaultNote({ ...note }))
                    );
                    if (notesToAdd.length === 0) {
                        break; // 没有更多数据了
                    }
                    allNotes = [...allNotes, ...notesToAdd];
                    currentOffset += notesToAdd.length;
                    if (notesToAdd.length < limit) {
                        break;
                    }
                }
            }
            if (!deck) {
                throw new Error('Deck information not found');
            }
            return {
                deck,
                notes: allNotes,
                totalNotes,
            };
        } catch (error) {
            let errorMessage = 'Failed to load shared deck';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        }
    }



}


export const publicService = new PublicService();
export default publicService;