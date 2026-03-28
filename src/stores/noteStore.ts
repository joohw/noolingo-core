// @/stores/noteStore.ts
// 存储笔记的显示状态，笔记数据的store


import { create } from 'zustand';
import { Note } from '../note/note_model';
import { Deck, SortState, DeckSortKey, SortOrder, defaultSortState } from '../deck/deck_model';
import { SearchQuery } from '../types/search_model';


export enum ContextOperation {
    IDLE = 'idle',
    ADDING = 'adding',
    UPDATING = 'updating',
    DELETING = 'deleting',
    SEARCHING = 'searching'
}


export interface OperationProgress {
    deckId: string;
    operation: ContextOperation;
    total: number;
    current: number;
    message?: string;
}


export interface NoteStoreState {
    noteList: string[];
    notesMap: Map<string, Note>;
    decksMap: Map<string, Deck>;
    currentOperation: ContextOperation;
    operationProgresses: Map<string, OperationProgress>;
    isEditing: boolean;
    readingNoteIds: string[];
    readingIndex: number;
    currentSortState: SortState;
    deckSortState: { key: DeckSortKey; order: SortOrder };
    isSpeechMode: boolean;
    isSearching: boolean;
    searchQuery: SearchQuery;
    setIsSearching: (isSearching: boolean) => void;
    setSearchQuery: (query: SearchQuery) => void;
    setIsSpeechMode: (isSpeechMode: boolean) => void;
    setDeckSortState: (sortState: { key: DeckSortKey; order: SortOrder }) => void;
    setReadingNotes: (noteIds: string[], index?: number) => void;
    clearReadingNotes: () => void;
    updateReadingIndex: (index: number) => void;
    setNoteList: (noteList: string[]) => void;
    setDecksMap: (decks: Map<string, Deck>) => void;
    setOperation: (operation: ContextOperation) => void;
    setIsEditing: (editing: boolean) => void;
    updateProgress: (deckId: string, operation: ContextOperation, current: number, total: number, message?: string) => void;
    clearProgress: (deckId: string) => void;
    reset: () => void;
    setCurrentSortState: (sortState: SortState) => void;
    setNotesMap: (notes: Map<string, Note>) => void;
}



export const useNoteStore = create<NoteStoreState>((set, get) => ({
    noteList: [],
    decksMap: new Map(),
    deckStats: new Map(),
    currentOperation: ContextOperation.IDLE,
    operationProgresses: new Map(),
    isEditing: false,
    notesMap: new Map(),
    readingNoteIds: [],
    readingIndex: 0,
    currentSortState: defaultSortState,
    isSpeechMode: false,
    deckSortState: { key: 'created_at', order: 'desc' },
    searchQuery: {},
    isSearching: false,
    setIsSearching: (isSearching) => set({ isSearching }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setIsSpeechMode: (isSpeechMode) => set({ isSpeechMode }),
    setDeckSortState: (sortState) => set({ deckSortState: sortState }),
    setNoteList: (noteList) => {
        set({ noteList });
    },
    setDecksMap: (decks) => set({ decksMap: new Map(decks) }),
    setNotesMap: (notes) =>
        set({ notesMap: new Map(notes) }),
    setOperation: (operation) =>
        set((state) => {
            if (state.currentOperation === operation) return state;
            return { currentOperation: operation };
        }),
    setIsEditing: (editing) =>
        set({ isEditing: editing }),
    updateProgress: (deckId, operation, current, total, message) =>
        set((state) => {
            const newProgresses = new Map(state.operationProgresses);
            newProgresses.set(deckId, {
                deckId,
                operation,
                current,
                total,
                message
            });
            return { operationProgresses: newProgresses };
        }),
    clearProgress: (deckId) =>
        set((state) => {
            const newProgresses = new Map(state.operationProgresses);
            newProgresses.delete(deckId);
            return { operationProgresses: newProgresses };
        }),
    setReadingNotes: (noteIds: string[], index = 0) => set({
        readingNoteIds: noteIds,
        readingIndex: index
    }),
    clearReadingNotes: () => set({
        readingNoteIds: [],
        readingIndex: 0
    }),
    updateReadingIndex: (index: number) => set({
        readingIndex: index
    }),
    reset: () => set({
        noteList: [],
        notesMap: new Map(),
        decksMap: new Map(),
        currentOperation: ContextOperation.IDLE,
        operationProgresses: new Map(),
        isEditing: false,
    }),
    setCurrentSortState: (sortState: SortState) => {
        set({ currentSortState: sortState });
    }
}));
