// 聚合各 Zustand store，供 Noolingo 实例的 stores 字段使用（与分别 import 等价）

import { useAuthStore } from './authStore';
import { useNoteStore } from './noteStore';
import { useStudyStore } from './studyStore';
import { useSyncStore } from './syncStore';
import { useStatsStore } from './statsStore';
import { useQuizStore } from './quizStore';
import { useSelectionStore } from './selectionStore';
import { useSettingStore } from './settingStore';
import { useImportStore } from './importStore';
import { useMessageStore } from './chatStore';
import { useContextMenuStore } from './contextMenuStore';
import { useUpdateStore } from './updateStore';
import { useAIStore } from './aiStore';
import { useAudioStore } from './audioStore';



export const stores = {
    auth: useAuthStore,
    note: useNoteStore,
    study: useStudyStore,
    sync: useSyncStore,
    stats: useStatsStore,
    quiz: useQuizStore,
    selection: useSelectionStore,
    setting: useSettingStore,
    importStore: useImportStore,
    message: useMessageStore,
    contextMenu: useContextMenuStore,
    update: useUpdateStore,
    ai: useAIStore,
    audio: useAudioStore,
};



export type NoolingoStores = typeof stores;

export * from './authStore';
export * from './noteStore';
export * from './studyStore';
export * from './syncStore';
export * from './statsStore';
export * from './quizStore';
export * from './selectionStore';
export * from './settingStore';
export * from './importStore';
export * from './chatStore';
export * from './contextMenuStore';
export * from './updateStore';
export * from './aiStore';
export * from './audioStore';
