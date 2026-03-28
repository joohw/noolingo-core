// @/stores/contextMenuStore.ts
import { create } from 'zustand';

export interface Position {
  x: number;
  y: number;
}

export interface ContextMenuState {
  isNoteMenuOpen: boolean;
  isDeckMenuOpen: boolean;
  NoteMenuPosition: Position | null;
  DeckMenuPosition: Position | null;
  targetNoteId: string | null;
  targetDeckId: string | null;
  openNoteMenu: (position: Position, targetId: string) => void;
  closeNoteMenu: () => void;
  openDeckMenu: (position: Position, targetId: string) => void;
  closeDeckMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isNoteMenuOpen: false,
  isDeckMenuOpen: false,
  NoteMenuPosition: null,
  DeckMenuPosition: null,
  targetNoteId: null,
  targetDeckId: null,
  
  openNoteMenu: (position, targetId) => set({
    isNoteMenuOpen: true,
    NoteMenuPosition: position,
    targetNoteId: targetId,
    isDeckMenuOpen: false, // 确保deck菜单关闭
    DeckMenuPosition: null,
    targetDeckId: null
  }),
  
  closeNoteMenu: () => set({
    isNoteMenuOpen: false,
    NoteMenuPosition: null,
    targetNoteId: null
  }),
  
  openDeckMenu: (position, targetId) => set({
    isDeckMenuOpen: true,
    DeckMenuPosition: position,
    targetDeckId: targetId,
    isNoteMenuOpen: false, // 确保note菜单关闭
    NoteMenuPosition: null,
    targetNoteId: null
  }),
  
  closeDeckMenu: () => set({
    isDeckMenuOpen: false,
    DeckMenuPosition: null,
    targetDeckId: null
  })
}));