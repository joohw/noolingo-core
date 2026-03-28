// @/repo/UserRepository.tsx

import { DailyStudyData, createDefaultDailyStudyData, validateDailyStudyData } from "../stat/stat_model";
import { StudyPreferences, defaultStudyPreferences } from "../types/preference";
import { storage, SyncDbClient } from "../storage/syncManager";


export class UserRepository {
    private storage: SyncDbClient;

    constructor() {
        this.storage = storage;
    }


    async getSpecificDateStatistics(date: string): Promise<DailyStudyData> {
        const data = await this.storage.readBulk<DailyStudyData>('localDailyStudyData', date);
        return data[0] || createDefaultDailyStudyData(date);
    }


    async updateSpecificDateStatistics(date: string, updateData: Partial<DailyStudyData>): Promise<void> {
        try {
            const existingData = await this.getSpecificDateStatistics(date);
            const updatedData: DailyStudyData = {
                ...existingData,
                ...updateData,
                date: date,
            };
            await this.storage.putBulk<DailyStudyData>('localDailyStudyData', updatedData);
        } catch (error) {
            console.error("Error updating user statistics:", error);
            throw error;
        }
    }


    async getRecentDailyStudyData(days: number = 365): Promise<DailyStudyData[]> {
        try {
            const today = new Date();
            today.setHours(23, 59, 0, 0);
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            const allDates = Array.from({ length: days }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                return formatDate(date);
            });
            const allData = await this.storage.readAll<DailyStudyData>('localDailyStudyData');
            const dataMap = new Map<string, DailyStudyData>(
                allData.map(item => [item.date, validateDailyStudyData(item)])
            );
            return allDates
                .map(date => dataMap.get(date))
                .filter((item): item is DailyStudyData => item !== undefined)
                .slice(0, days)
                .reverse();
        } catch (error) {
            console.error("Error fetching recent daily study data:", error);
            throw error;
        }
    }



    async clearStats(): Promise<void> {
        try {
            await this.storage.clearStore('localDailyStudyData');
        } catch (error) {
            console.error("Error clearing user statistics:", error);
            throw error;
        }
    }


    async getStudyPreferences(): Promise<StudyPreferences> {
        const prefs = await this.storage.readBulk<StudyPreferences>('localUser', 'STUDY_PREFERENCES_ID');
        if (prefs.length === 0) {
            console.log('Study preferences do not exist, creating default');
            const created = await this.storage.putBulk<StudyPreferences>('localUser', [
                { ...defaultStudyPreferences, id: 'STUDY_PREFERENCES_ID' }
            ]);
            return created[0];
        }
        return prefs[0];
    }


    async updateStudyPreferences(prefsUpdate: Partial<StudyPreferences>): Promise<StudyPreferences> {
        const existingPrefs = await this.getStudyPreferences();
        const updatedPrefs: StudyPreferences = {
            ...existingPrefs,
            ...prefsUpdate,
        };
        const results = await this.storage.updateBulk<StudyPreferences>('localUser', [{
            ...updatedPrefs,
            id: 'STUDY_PREFERENCES_ID'
        }]);
        return results[0];
    }


}

export const userRepository = new UserRepository();
export default userRepository;