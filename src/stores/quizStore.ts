// @/stores/quizStore.ts

import { create } from 'zustand';
import { QuizModeId } from '../quiz/quiz_model';



export interface QuizStore {
  error: string;
  quizMap: Record<string, string>;
  generationQueue: Set<string>;
  activeGenerations: Set<string>;
  selectedQuizMode: QuizModeId;
  setSelectedQuizMode: (quizModeId: QuizModeId) => void;
  setQuizText: (cacheKey: string, text: string) => void;
  setError: (error: string) => void;
  removeQuiz: (noteId: string) => void;
  clearQuizzes: () => void;
  addToGenerationQueue: (noteId: string) => void;
  removeFromGenerationQueue: (noteId: string) => void;
  addActiveGeneration: (noteId: string) => void;
  removeActiveGeneration: (noteId: string) => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  quizMap: {},
  error: '',
  generationQueue: new Set(),
  activeGenerations: new Set(),
  selectedQuizMode: 'memory',
  setSelectedQuizMode: (quizModeId: QuizModeId) => {
    set({ selectedQuizMode: quizModeId });
  },
  setQuizText: (cacheKey, text) => set((state) => ({
    quizMap: { ...state.quizMap, [cacheKey]: text }
  })),
  setError: (error) => set({ error }),
  removeQuiz: (noteId) => set((state) => {
    const newQuizMap = { ...state.quizMap };
    delete newQuizMap[noteId];
    return { quizMap: newQuizMap };
  }),
  clearQuizzes: () => set({
    quizMap: {},
    generationQueue: new Set(),
    activeGenerations: new Set()
  }),
  addToGenerationQueue: (noteId) => set((state) => {
    const newQueue = new Set(state.generationQueue);
    newQueue.add(noteId);
    return { generationQueue: newQueue };
  }),
  removeFromGenerationQueue: (noteId) => set((state) => {
    const newQueue = new Set(state.generationQueue);
    newQueue.delete(noteId);
    return { generationQueue: newQueue };
  }),
  addActiveGeneration: (noteId) => set((state) => {
    const newActive = new Set(state.activeGenerations);
    newActive.add(noteId);
    return { activeGenerations: newActive };
  }),
  removeActiveGeneration: (noteId) => set((state) => {
    const newActive = new Set(state.activeGenerations);
    newActive.delete(noteId);
    return { activeGenerations: newActive };
  })
}));