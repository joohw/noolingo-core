import { create } from "zustand";
import { Note } from "../note/note_model";

export interface ImportStoreState {
    notesToImport: Note[];
    deckToImport: string;
    pathToImport: string[] | null;
    newDeckToImport: string;
    isParsing: boolean; // 是否正在解析内容
    isGenerating: boolean; // 是否正在生成笔记
    generatingNotes: string;// 正在生成的笔记内容
    editorContent: string;
    setIsParsing: (isParsing: boolean) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setGeneratingNotes: (noteText: string) => void;
    setDeckToImport: (deck: string) => void;
    setPathToImport: (path: string[] | null) => void;
    setNewDeckToImport: (deckName: string) => void;
    setNotesToImport: (notes: Note[]) => void;
    setEditorContent: (content: string) => void;
    reset: () => void;
}

export const useImportStore = create<ImportStoreState>((set) => ({
    notesToImport: [],
    deckToImport: "",
    pathToImport: null,
    newDeckToImport: "",
    generatingNotes: '',
    isGenerating: false,
    isParsing: false,
    editorContent: '',
    setIsParsing: (isParsing: boolean) => set(() => ({ isParsing })),
    setIsGenerating: (isGenerating: boolean) => set(() => ({ isGenerating })),
    setGeneratingNotes: (noteText: string) => set(() => ({ generatingNotes: noteText })),
    setDeckToImport: (deck: string) => set(() => ({ deckToImport: deck })),
    setPathToImport: (path: string[] | null) => set(() => ({ pathToImport: path })),
    setNewDeckToImport: (deckName: string) => set(() => ({ newDeckToImport: deckName })),
    setNotesToImport: (notes: Note[]) => set(() => ({ notesToImport: notes })),
    setEditorContent: (content: string) => set(() => ({ editorContent: content })),
    reset: () => set(() => ({ notesToImport: [], deckToImport: "", pathToImport: null, newDeckToImport: "", generatingNotes: '', editorContent: '' }))
}));


export default useImportStore;