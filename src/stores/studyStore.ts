// @/stores/studyStore.ts

import { create } from 'zustand';
import { SortState } from '../deck/deck_model';
import { CardRating } from '../fsrs/recall';
import { ConfigKey, configManager } from "../storage/configManager";
import { StudyPreferences, defaultStudyPreferences } from '../types/preference';

export interface StudyResult {
  noteId: string;
  isCorrect: boolean;
  userRating: CardRating;
  timeUsed: number;
}

export interface StudyState {
  pendingQueue: string[];
  activeQueue: string[];
  queueSortState: SortState;
  preferences: StudyPreferences;
  studyResults: StudyResult[];
  setPreferences: (preferences: Partial<StudyPreferences>) => void;
  setActiveQueue: (queue: string[] | ((prev: string[]) => string[])) => void;
  setPendingQueue: (queue: string[] | ((prev: string[]) => string[])) => void;
  setQueueSortState: (sortState: SortState) => void;
  setStudyResults: (results: StudyResult[] | ((prev: StudyResult[]) => StudyResult[])) => void;
  removeStudyResultByNoteId: (noteId: string) => void;
  reset: () => void;
}


export const useStudyStore = create<StudyState>((set, get) => ({
  activeQueue: [],
  pendingQueue: [],
  learnableQueue: [],
  preferences: defaultStudyPreferences,
  studyResults: [],
  setPreferences: (preferences) => set(() => ({
    preferences: { ...get().preferences, ...preferences }
  })),
  queueSortState:  { key: 'schedule', order: 'desc' },
  setQueueSortState: (sortState) => set(() => {
    configManager.saveConfig(ConfigKey.QUEUE_SORT_STATE, sortState);
    return { queueSortState: sortState };
  }),
  setActiveQueue: (queue) => set((state) => {
    const currentQueue = state.activeQueue || [];
    const newQueue = typeof queue === 'function' ? queue(currentQueue) : queue;
    return {
      activeQueue: Array.isArray(newQueue) ? newQueue : []
    };
  }),
  setPendingQueue: (queue) => set((state) => {
    const currentQueue = state.pendingQueue || [];
    const newQueue = typeof queue === 'function' ? queue(currentQueue) : queue;
    return {
      pendingQueue: Array.isArray(newQueue) ? newQueue : []
    };
  }),
  setStudyResults: (results) => set((state) => ({
    studyResults: typeof results === 'function' ? results(state.studyResults) : results
  })),
  removeStudyResultByNoteId: (noteId) => set((state) => ({
    studyResults: state.studyResults.filter(result => result.noteId !== noteId)
  })),
  reset: () => set({
    activeQueue: [],
    pendingQueue: [],
    studyResults: [],
  })
}));

export type StudyStore = ReturnType<typeof useStudyStore>;