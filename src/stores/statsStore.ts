// @/stores/statsStore.ts

import { create } from 'zustand';
import { DailyStudyData } from '../stat/stat_model';
import { OverallStudyStats, defaultOverallStudyStats } from '../stat/stat_model';


export interface StatsState {
    unfinishedCount: number;
    overallStudyStats: OverallStudyStats;
    recentDailyStudyData: DailyStudyData[];
    setUnfinishedCount: (count: number) => void;
    setOverallStudyStats: (stats: OverallStudyStats) => void;
    setRecentDailyStudyData: (data: DailyStudyData[]) => void;
    reset: () => void;
}


export const useStatsStore = create<StatsState>((set, get) => ({
    overallStudyStats: defaultOverallStudyStats,
    recentDailyStudyData: [],
    unfinishedCount: 0,
    setUnfinishedCount: (count) => {
        const current = get().unfinishedCount;
        if (current !== count) {
            set({ unfinishedCount: count });
        }
    },
    setOverallStudyStats: (stats) => set({ overallStudyStats: stats }),
    setRecentDailyStudyData: (data) => set({ recentDailyStudyData: data }),
    reset: () => set({
        recentDailyStudyData: [],
        unfinishedCount: 0,
        overallStudyStats: defaultOverallStudyStats,
    })
}));

export type StatsStore = ReturnType<typeof useStatsStore>;