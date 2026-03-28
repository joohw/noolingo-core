// @/stores/updateStore.ts
// 管理应用更新状态的 store


import { create } from 'zustand';


export interface UpdateStoreState {
    isUpdating: boolean;
    setUpdating: (updating: boolean) => void;
}


export const useUpdateStore = create<UpdateStoreState>((set) => ({
    isUpdating: false,
    setUpdating: (updating) => set({ isUpdating: updating }),
}));

