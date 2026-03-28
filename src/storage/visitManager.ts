// @/storage/visitManager.ts
// 访问记录管理器，用于追踪功能的使用情况

import { ConfigKey, configManager } from './configManager';


// 访问记录接口
interface VisitRecord {
    hasVisited: boolean;
    firstVisitTime?: number;
    lastVisitTime?: number;
    visitCount: number;
}
type VisitMap = Record<string, VisitRecord>;


export class VisitManager {

    private static readonly CONFIG_KEY = ConfigKey.PAGE_VISIT_COUNT;

    // 标记功能为已访问
    public static markVisited(key: string): void {
        const allRecords = this.getAllVisits();
        const now = Date.now();
        const existingRecord = allRecords[key];
        if (existingRecord) {
            allRecords[key] = {
                ...existingRecord,
                lastVisitTime: now,
                visitCount: existingRecord.visitCount + 1
            };
        } else {
            // 创建新记录
            allRecords[key] = {
                hasVisited: true,
                firstVisitTime: now,
                lastVisitTime: now,
                visitCount: 1
            };
        }
        this.saveAllVisits(allRecords);
    }


    // 是否是今天第一次访问
    public static isVisitedToday(key: string): boolean {
        const record = this.getVisit(key);
        if (!record || !record.lastVisitTime) {
            return false;
        }
        const lastVisitDate = new Date(record.lastVisitTime);
        const today = new Date();
        return (
            lastVisitDate.getFullYear() === today.getFullYear() &&
            lastVisitDate.getMonth() === today.getMonth() &&
            lastVisitDate.getDate() === today.getDate()
        );
    }

    // 检查是否首次访问
    public static isVisitedRecently(key: string, days: number = 3): boolean {
        const record = this.getVisit(key);
        if (!record || !record.lastVisitTime) {
            return false;
        }
        const lastVisitTime = record.lastVisitTime;
        const now = Date.now();
        const daysInMs = days * 24 * 60 * 60 * 1000;
        return (now - lastVisitTime) <= daysInMs;
    }


    // 检查是否首次访问
    public static isFirstVisit(key: string): boolean {
        const record = this.getVisit(key);
        return !record || record.visitCount === 0;
    }

    // 检查是否是特定次数的访问（用于序列化引导）
    public static isVisitCount(key: string, count: number): boolean {
        const record = this.getVisit(key);
        return record ? record.visitCount === count : count === 0;
    }

    // 检查是否小于特定访问次数（用于序列化引导）
    public static isBeforeVisitCount(key: string, count: number): boolean {
        const record = this.getVisit(key);
        const currentCount = record ? record.visitCount : 0;
        return currentCount < count;
    }

    // 获取访问记录
    public static getVisit(key: string): VisitRecord | null {
        const allRecords = this.getAllVisits();
        return allRecords[key] || null;
    }

    // 获取访问次数
    public static getVisitCount(key: string): number {
        const record = this.getVisit(key);
        return record ? record.visitCount : 0;
    }

    //  重置特定访问记录
    public static resetVisit(key: string): void {
        const allRecords = this.getAllVisits();
        delete allRecords[key];
        this.saveAllVisits(allRecords);
    }


    // 重置所有访问记录
    public static resetAllVisits(): void {
        console.log('resetAllVisits');
        configManager.removeConfig(this.CONFIG_KEY);
    }

    // 获取所有访问记录
    private static getAllVisits(): VisitMap {
        return configManager.getConfig<VisitMap>(this.CONFIG_KEY) || {};
    }

    // 保存所有访问记录
    private static saveAllVisits(records: VisitMap): void {
        configManager.saveConfig(this.CONFIG_KEY, records);
    }

}

// 导出便捷函数
export const visitManager = {
    markVisited: (key: string) => VisitManager.markVisited(key),
    isFirstVisit: (key: string) => VisitManager.isFirstVisit(key),
    isVisitedToday: (key: string) => VisitManager.isVisitedToday(key),
    getVisitCount: (key: string) => VisitManager.getVisitCount(key),
    isVisitCount: (key: string, count: number) => VisitManager.isVisitCount(key, count),
    isBeforeVisitCount: (key: string, count: number) => VisitManager.isBeforeVisitCount(key, count),
    reset: (key: string) => VisitManager.resetVisit(key),
    resetAll: () => VisitManager.resetAllVisits(),
};
