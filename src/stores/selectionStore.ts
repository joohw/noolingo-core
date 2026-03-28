// @/stores/selectionStore.ts


import { create } from 'zustand';


export interface SelectionStore {
    selectedIds: Set<string>;
    isSelectionMode: boolean;
    toggleSelectionMode: () => void;
    enableSelectionMode: () => void;
    disableSelectionMode: () => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
    toggleAllSelection: (ids: string[]) => void;
    isSelected: (id: string) => boolean;
}



export const useSelectionStore = create<SelectionStore>((set, get) => ({
    selectedIds: new Set<string>(),
    isSelectionMode: false,
    toggleSelectionMode: () => set(state => ({
        isSelectionMode: !state.isSelectionMode,
        selectedIds: !state.isSelectionMode ? state.selectedIds : new Set()
    })),
    enableSelectionMode: () => set(state => ({
        isSelectionMode: true
    })),
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
    clearSelection: () => set({
        selectedIds: new Set()
    }),
    selectAll: (ids: string[]) => set({
        selectedIds: new Set(ids)
    }),
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
    isSelected: (id: string) => get().selectedIds.has(id),
}));
