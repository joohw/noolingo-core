// @/stores/messageStore.ts
// 消息状态管理


import { create } from 'zustand';
import { Message } from '../types/chat';


export interface MessageStore {
    // 消息相关
    messages: Message[];
    isGenerating: boolean;
    
    // 选择相关
    selectedIds: Set<string>;
    isSelectionMode: boolean;
    
    // 消息操作方法
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (messageId: string, content: string) => void;
    deleteMessage: (messageId: string) => void;
    deleteMessages: (messageIds: string[]) => void;
    clearMessages: () => void;
    setIsGenerating: (isGenerating: boolean) => void;
    toggleSelectionMode: () => void;
    enableSelectionMode: () => void;
    disableSelectionMode: () => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
    toggleAllSelection: (ids: string[]) => void;
    isSelected: (id: string) => boolean;
}


export const useMessageStore = create<MessageStore>((set, get) => ({
    // 消息状态
    messages: [],
    isGenerating: false,
    
    // 选择状态
    selectedIds: new Set<string>(),
    isSelectionMode: false,
    
    // 消息操作方法
    setMessages: (messages: Message[]) => set({ messages }),
    addMessage: (message: Message) => set(state => ({
        messages: [...state.messages, message]
    })),
    updateMessage: (messageId: string, content: string) => set(state => ({
        messages: state.messages.map(msg =>
            msg.id === messageId
                ? { ...msg, content, updatedAt: Date.now() }
                : msg
        )
    })),
    deleteMessage: (messageId: string) => set(state => ({
        messages: state.messages.filter(msg => msg.id !== messageId)
    })),
    deleteMessages: (messageIds: string[]) => set(state => {
        const idsSet = new Set(messageIds);
        return {
            messages: state.messages.filter(msg => !idsSet.has(msg.id))
        };
    }),
    clearMessages: () => set({ messages: [] }),
    setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),
    
    // 选择操作方法
    toggleSelectionMode: () => set(state => ({
        isSelectionMode: !state.isSelectionMode,
        selectedIds: !state.isSelectionMode ? state.selectedIds : new Set()
    })),
    enableSelectionMode: () => set({ isSelectionMode: true }),
    disableSelectionMode: () => set({
        isSelectionMode: false,
        selectedIds: new Set()
    }),
    toggleSelection: (id: string) => set(state => {
        const newSelectedIds = new Set(state.selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        return { selectedIds: newSelectedIds };
    }),
    clearSelection: () => set({ selectedIds: new Set() }),
    selectAll: (ids: string[]) => set({ selectedIds: new Set(ids) }),
    toggleAllSelection: (ids: string[]) => set(state => {
        const newSelectedIds = new Set(state.selectedIds);
        ids.forEach(id => {
            if (newSelectedIds.has(id)) {
                newSelectedIds.delete(id);
            } else {
                newSelectedIds.add(id);
            }
        });
        return { selectedIds: newSelectedIds };
    }),
    isSelected: (id: string) => get().selectedIds.has(id)
}));

