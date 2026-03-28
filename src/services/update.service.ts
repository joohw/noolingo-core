// @/services/update.service.ts
// 更新服务

import { Service } from './service'
import { Language } from '../locales/languages';
import { getAdapter } from '../adapter';
import type { NoolingoPlatform } from '../types/platform';


export interface ChangeLog {
  version: string;
  date: string;
  priority: number;
  title: string;
  content: string;
  platforms?: NoolingoPlatform[];
  tags: string[];
}


export class UpdateService implements Service {
  constructor() { }


  async init(): Promise<void> { }

  
  // 获取所有更新日志（已按平台筛选）
  async getChangeLogs(language: Language): Promise<ChangeLog[]> {
    const { device, appConfig } = getAdapter();
    const targetPlatform = device.getPlatform();
    try {
      const url = `${appConfig.ossOriginUrl}/assets/${language}/changelog/changelog.json?t=${Date.now()}`;
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const cleanText = text.replace(/^\uFEFF/, '');
      if (!response.ok) {
        throw new Error(`Failed to fetch update data: ${response.statusText}`);
      }
      const data: { updates: ChangeLog[] } = JSON.parse(cleanText);
      console.log(`Loaded update data for ${language} on ${targetPlatform}`);
      return data.updates
        .filter(update =>
          !update.platforms || update.platforms.includes(targetPlatform)
        )
        .sort((a, b) => this.compareDates(b.date, a.date)); // 按日期降序排序
    } catch (error) {
      console.error('Failed to load update data:', error);
      throw error;
    }
  }


  // 检查当前平台是否有更新
  async checkUpdate(language: Language): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    latestChangeLog: ChangeLog | null;
    forceUpdate?: boolean;
  }> {
    try {
      const changeLogs = await this.getChangeLogs(language);
      if (changeLogs.length === 0) {
        const v = getAdapter().appConfig.appVersion;
        return {
          hasUpdate: false,
          currentVersion: v,
          latestVersion: v,
          latestChangeLog: null
        };
      }
      // 获取最新版本的更新（按日期排序后的第一条）
      const latestChangeLog = changeLogs[0];
      const latestVersion = latestChangeLog.version;
      const appVersion = getAdapter().appConfig.appVersion;
      const hasUpdate = this.compareVersions(latestVersion, appVersion) > 0;
      return {
        hasUpdate,
        currentVersion: appVersion,
        latestVersion,
        latestChangeLog,
        forceUpdate: latestChangeLog?.priority === 0
      };
    } catch (error) {
      console.error('Failed to check update:', error);
      const v = getAdapter().appConfig.appVersion;
      return {
        hasUpdate: false,
        currentVersion: v,
        latestVersion: v,
        latestChangeLog: null
      };
    }
  }


  // 比较版本号
  private compareVersions(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(part => parseInt(part, 10));
    const v2Parts = v2.split('.').map(part => parseInt(part, 10));
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    while (v1Parts.length < maxLength) v1Parts.push(0);
    while (v2Parts.length < maxLength) v2Parts.push(0);
    for (let i = 0; i < maxLength; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
  }


  // 比较日期（按时间戳排序）
  private compareDates(date1: string, date2: string): number {
    const timestamp1 = new Date(date1).getTime();
    const timestamp2 = new Date(date2).getTime();
    return timestamp1 - timestamp2;
  }


}

export const updateService = new UpdateService();
export default updateService;