// @/services/sync.service.ts


import { Service } from './service'
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { useNoteStore } from '../stores/noteStore';
import { SyncEngine, SyncStatus } from 'delta-sync';
import { CloudBaseAdapter } from '../storage/CloudbaseAdapter';
import nooCloud from "../cloud";
import authService from './auth.service';
import indiceService from './indices.service';
import { storage } from '../storage/syncManager';
import { ConfigKey, configManager } from '../storage/configManager';


export class SyncService implements Service {

    private syncEngine: SyncEngine | null = null;
    private initialized: boolean = false;


    // 阻止直接实例化
    constructor() {

    }

    async init() {
        if (this.initialized) return;
        try {
            const persisted = configManager.getConfig<number>(ConfigKey.LAST_SYNC_TIME) || 0;
            useSyncStore.setState({ latestSync: persisted });
            this.setupAuthListeners();
            await storage.waitForReady();
            this.syncEngine = storage.getSyncEngine();
            if (authService.isAuthenticated()) {
                await this.handleLoginSuccess();
            }
            this.initialized = true;
        } catch (error) {
            console.error('同步服务初始化失败:', error);
            throw new Error('同步服务初始化失败');
        }
    }


    //设置认证相关的监听器
    private setupAuthListeners(): void {
        authService.onLoginSuccess(async () => {
            await this.handleLoginSuccess();
        });
        authService.onLogout(() => {
            this.handleLogout();
        });
    }


    // 获取云端笔记数量
    public async refreshCloudNoteStats(): Promise<void> {
        if (!authService.isAuthenticated()) {
            return;
        }
        const store = useSyncStore.getState();
        store.setStatsRefreshing(true);
        try {
            const response = await nooCloud.store.countStore('localNotes');
            if (!response.success) {
                throw new Error(response.message);
            }
            const notesCount = response.data?.total || 0;
            useSyncStore.getState().setCloudNotesCount(notesCount);
            store.setErrorMessage('');
        } catch (error) {
            console.error('获取笔记统计信息失败:', error);
            store.setErrorMessage(
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        } finally {
            store.setStatsRefreshing(false);
        }
    }


    // 设置云适配器
    private async configureSyncEngine(): Promise<void> {
        if (!this.syncEngine) return;
        try {
            await this.syncEngine.setCloudAdapter(
                CloudBaseAdapter.getInstance()
            );
            try {
                await this.refreshCloudNoteStats()
            } catch (error) {
                console.error('获取笔记统计信息失败:', error);
            }
            this.syncEngine.updateSyncOptions({
                onStatusUpdate: (status: any) => {
                    useSyncStore.getState().setSyncStatus(status as SyncStatus);
                },
                onVersionUpdate: (version: any) => {
                    useSyncStore.getState().setLatestSync(version);
                },
                onChangePulled: async (changes: any) => {
                    try {
                        if (changes.put.has('localNotes') || changes.delete.has('localNotes')) {
                            await this.refreshCloudNoteStats();
                        }
                        await indiceService.handleSyncChanges(changes);
                    } catch (error) {
                        console.error('处理同步变更失败:', error);
                    }
                },
                onChangePushed: async (changes: any) => {
                    try {
                        if (changes.put.has('localNotes') || changes.delete.has('localNotes')) {
                            await this.refreshCloudNoteStats();
                        }
                    } catch (error) {
                        console.error('更新云端笔记统计信息失败:', error);
                    }
                },
                onPushAvailableCheck: () => {
                    const canSync = this.checkSyncQuota();
                    if (!canSync) {
                        useSyncStore.getState().setErrorMessage('sync.quotaExceeded');
                    }
                    return canSync;
                },
                onPullAvailableCheck: () => {
                    return true;
                },
                onSyncProgress: (progress: any) => {
                    console.log(`同步进度: ${progress.processed}/${progress.total}`);
                }
            });
        } catch (error) {
            console.error('配置同步引擎失败:', error);
            throw error;
        }
    }


    private checkSyncQuota(): boolean {
        const authStore = useAuthStore.getState();
        const noteStore = useNoteStore.getState();
        const userProfile = authStore.userProfile;
        if (!userProfile) {
            return false;
        }
        const localNotesCount = noteStore.notesMap.size;
        const quota = userProfile.cloud_note_quota;
        if (quota < localNotesCount) {
            useSyncStore.getState().setErrorMessage('sync.quotaExceeded');
        }
        return localNotesCount < quota;
    }


    //执行初始同步
    private async performInitialSync(): Promise<void> {
        useSyncStore.getState().setErrorMessage('');
        if (!this.syncEngine) throw new Error('syncEngine not initialized');
        try {
            const syncStore = useSyncStore.getState();
            const lastSync = syncStore.latestSync;
            const thirtyMinutesInMs = 30 * 60 * 1000;
            const currentTime = Date.now();
            if (!lastSync || (currentTime - lastSync > thirtyMinutesInMs)) {
                await this.syncEngine.pull();
                useSyncStore.getState().setLatestSync(Date.now());
            } else {
                console.log('跳过初始同步，因为上次同步在30分钟内');
            }
        } catch (error) {
            throw error;
        }
    }



    //处理登录成功事件 
    private async handleLoginSuccess(): Promise<void> {
        try {
            await this.configureSyncEngine();
            await this.performInitialSync();
            await this.enableAutoSync();
        } catch (error) {
            console.error('登录后同步操作失败:', error);
        }
    }


    // 处理登出事件
    private handleLogout(): void {
        if (this.syncEngine) {
            this.disableAutoSync();
            this.syncEngine.dispose();
            this.syncEngine.clearLocalStores(['localUser', 'localDailyStudyData']);
            useSyncStore.getState().setSyncStatus(SyncStatus.OFFLINE);
            useSyncStore.getState().setCloudNotesCount(0);
        }
    }


    //公开的 API 方法
    public async enableAutoSync(interval?: number): Promise<void> {
        if (!this.syncEngine) throw new Error('syncEngine not initialized');
        if (!authService.isAuthenticated()) throw new Error('user not authenticated');
        this.syncEngine.enableAutoSync(interval);
    }



    public async disableAutoSync(): Promise<void> {
        if (!this.syncEngine) return;
        this.syncEngine.disableAutoSync();
    }



    public async syncAll(): Promise<void> {
        useSyncStore.getState().setErrorMessage('');
        if (!this.syncEngine) throw new Error('syncEngine not initialized');
        if (!authService.isAuthenticated()) throw new Error('user not authenticated');
        await this.syncEngine.fullSync();
        useSyncStore.getState().setLatestSync(Date.now());
    }



    public async push(): Promise<void> {
        useSyncStore.getState().setErrorMessage('');
        if (!this.syncEngine) throw new Error('syncEngine not initialized');
        if (!authService.isAuthenticated()) throw new Error('user not authenticated');
        this.syncEngine.push();
        useSyncStore.getState().setLatestSync(Date.now());
        return;
    }



    public async pull(): Promise<void> {
        useSyncStore.getState().setErrorMessage('');
        if (!this.syncEngine) throw new Error('syncEngine not initialized');
        if (!authService.isAuthenticated()) throw new Error('用户未登录');
        this.syncEngine.pull();
        useSyncStore.getState().setLatestSync(Date.now());
        return;
    }



    public getSyncStatus(): SyncStatus {
        return useSyncStore.getState().syncStatus;
    }



    public async clearCloudNotes(): Promise<void> {
        if (!this.syncEngine) {
            throw new Error('syncEngine not initialized');
        }
        try {
            await this.syncEngine.clearCloudStores([
                'localNotes',
                'localDecks',
                'tombStones',
            ]);
            await this.refreshCloudNoteStats();
        } catch (error) {
            throw error instanceof Error
                ? error
                : new Error('failed to clear cloud notes');
        }
    }



}


export const syncService = new SyncService();
export default syncService;