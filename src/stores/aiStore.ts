// @/stores/aiStore.ts

import { create } from 'zustand';
import { AIModel } from '../types/ai';
import { Language } from '../locales/languages';


export interface UsageInfo {
  used: number;
  quota: number;
  remaining?: number;
  percentage?: number;
  isQuotaExceeded?: boolean;
}


export interface AIState {
  isGenerating: boolean;
  error: string | null;
  usageInfo: UsageInfo | null;
  isUsageLoaded: boolean;
  availableModels: AIModel[];
  aiOutputLanguage: Language | null;
  streamingMessage: string;
  setAvailableModels: (models: AIModel[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setUsageInfo: (usageInfo: UsageInfo | null) => void;
  updateUsageInfo: (usageInfo: UsageInfo) => void;
  setAIOutputLanguage: (language: Language | null) => void;
  setStreamingMessage: (message: string) => void;
  resetAIState: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isGenerating: false,
  error: null,
  usageInfo: null,
  isUsageLoaded: false,
  availableModels: [], // Initialize as empty array
  aiOutputLanguage: null,
  streamingMessage: '',
  setAvailableModels: (availableModels) => set({ availableModels }), // New setter
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  setUsageInfo: (usageInfo) => set({ usageInfo }),
  updateUsageInfo: (usageInfo) => { set({ usageInfo, }); },
  setAIOutputLanguage: (language) => set({ aiOutputLanguage: language }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  resetAIState: () => set({
    isGenerating: false,
    error: null,
    usageInfo: null,
    isUsageLoaded: false,
    availableModels: [],
    aiOutputLanguage: null,
    streamingMessage: '',
  })
}));

export type AIStore = ReturnType<typeof useAIStore>;
