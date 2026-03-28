// @/stores/audioStore.ts
import { create } from 'zustand';

export interface AudioState {
  isShowing: boolean;
  isPlaying: boolean;
  currentText: string | null;
  currentSentence: number;
  allSentences: string[]; // 新增：存储所有句子
  setIsShowing: (showing: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentText: (text: string | null) => void;
  setCurrentSentence: (index: number) => void;
  setAllSentences: (sentences: string[]) => void; // 新增：设置所有句子
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isShowing: false,
  isPlaying: false,
  currentText: null,
  currentSentence: 0,
  allSentences: [], // 初始为空数组
  setIsShowing: (showing) => set({ isShowing: showing }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentText: (text) => set({ currentText: text }),
  setCurrentSentence: (index) => set({ currentSentence: index }),
  setAllSentences: (sentences) => set({ allSentences: sentences }), // 设置所有句子
  reset: () => set({
    isShowing: false,
    isPlaying: false,
    currentText: null,
    currentSentence: 0,
    allSentences: [], // 重置时清空
  })
}));