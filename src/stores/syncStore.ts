// @/stores/syncStore.ts
// 存储同步状态的store


import { create } from 'zustand';
import { SyncStatus } from 'delta-sync';
import { ConfigKey,configManager } from "../storage/configManager";



export interface SyncStoreState {
    syncStatus: SyncStatus;
    latestSync: number;
    statsRefreshing: boolean;
    errorMessage: string;
    cloudNotesCount: number;
    isCheckingCloudCapacity: boolean;
    setCheckingCloudCapacity: (checking: boolean) => void;
    setCloudNotesCount: (count: number) => void;
    setSyncStatus: (status: SyncStatus) => void;
    setLatestSync: (version: number) => void;
    setStatsRefreshing: (refreshing: boolean) => void;
    reset: () => void;
    setErrorMessage: (message: string) => void;
}



export const useSyncStore = create<SyncStoreState>((set, get) => ({
    syncStatus: SyncStatus.OFFLINE,
    latestSync: 0,
    statsRefreshing: false,
    errorMessage: '',
    cloudNotesCount: 0,
    isCheckingCloudCapacity: false,
    setCheckingCloudCapacity: (checking: boolean) => set({ isCheckingCloudCapacity: checking }),
    setCloudNotesCount: (count) => set({ cloudNotesCount: count }),
    setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),
    setLatestSync: (version: number) => {
        configManager.saveConfig(ConfigKey.LAST_SYNC_TIME, version);
        set({ latestSync: version });
    },
    setStatsRefreshing: (refreshing) => set({
        statsRefreshing: refreshing
    }),
    setErrorMessage: (message) => set({ errorMessage: message }),
    reset: () => {
        configManager.saveConfig(ConfigKey.LAST_SYNC_TIME, 0);
        set({
            syncStatus: SyncStatus.OFFLINE,
            latestSync: 0,
            statsRefreshing: false,
            errorMessage: '',
            cloudNotesCount: 0,
            isCheckingCloudCapacity: false,
        });
    },
}));
