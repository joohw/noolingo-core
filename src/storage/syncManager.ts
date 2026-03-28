// @/storage
// 使用delta-sync实现数据同步


import { StoreName, BaseModel } from '../types/base_model';
import { DatabaseAdapter, SyncEngine } from 'delta-sync';
import { adapter } from '../adapter';


// 同步数据库客户端
export class SyncDbClient {
    private static instance: SyncDbClient | null = null;
    private static isInitializing: boolean = false;
    private localAdapter: DatabaseAdapter;
    private syncEngine: SyncEngine;
    private isReady: boolean = false;
    private constructor() {
        this.localAdapter = adapter.localDatabase;
        this.syncEngine = new SyncEngine(
            this.localAdapter,
            [
                'localUser',
                'localDecks',
                'localNotes',
                'localDailyStudyData',
                'localChats',
            ]
            ,
            {
                autoSync: {
                    enabled: false,
                    pullInterval: 60000000,    // 每10秒向服务器请求一次最新数据
                    pushDebounce: 3000,     // 如果没有新的更改，本地的更改在3秒后被推送
                    retryDelay: 1000
                }
            }
        );
        this.initializeAsync();
    }


    private async initializeAsync(): Promise<void> {
        try {
            await this.syncEngine.initialize?.();
            this.isReady = true;
        } catch (error) {
            console.error('SyncDbClient 异步初始化失败:', error);
        }
    }


    public static getInstance(): SyncDbClient {
        if (!SyncDbClient.instance && !SyncDbClient.isInitializing) {
            SyncDbClient.isInitializing = true;
            try {
                SyncDbClient.instance = new SyncDbClient();
            } catch (error) {
                console.error('SyncDbClient 初始化失败:', error);
                throw error;
            } finally {
                SyncDbClient.isInitializing = false;
            }
        }
        if (!SyncDbClient.instance) {
            throw new Error('SyncDbClient 正在初始化中，请稍后重试');
        }
        return SyncDbClient.instance;
    }


    // 提供一个方法来等待异步初始化完成
    public async waitForReady(): Promise<void> {
        while (!this.isReady) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }


    // 检查是否已经准备就绪
    public isInitialized(): boolean {
        return this.isReady;
    }


    public getSyncEngine(): SyncEngine {
        return this.syncEngine;
    }


    async createBulk<T extends BaseModel>(
        storeName: StoreName,
        items: T[]
    ): Promise<string[]> {
        await this.waitForReady(); // 确保异步初始化完成
        const results = await this.syncEngine.save(storeName, items);
        return results.map(item => item.id);
    }


    async putBulk<T extends BaseModel>(
        storeName: StoreName,
        items: T[] | T,
    ): Promise<T[]> {
        await this.waitForReady();
        const itemsArray = Array.isArray(items) ? items : [items];
        return await this.syncEngine.save(storeName, itemsArray);
    }


    async updateBulk<T extends BaseModel>(
        storeName: StoreName,
        updates: Array<Partial<T> & { id: string }>
    ): Promise<T[]> {
        await this.waitForReady();
        const existingItems = await this.readBulk<T>(
            storeName,
            updates.map(u => u.id)
        );
        const mergedItems = existingItems.map(item => {
            const update = updates.find(u => u.id === item.id);
            return update ? { ...item, ...update } : item;
        });
        return await this.syncEngine.save(storeName, mergedItems);
    }


    async hardDeleteBulk(
        storeName: StoreName,
        ids: string[]
    ): Promise<void> {
        await this.waitForReady();
        await this.syncEngine.delete(storeName, ids);
    }


    async readStore<T extends BaseModel>(
        storeName: StoreName,
        limit: number = 100,
        offset: number = 0
    ): Promise<{ items: T[]; hasMore: boolean }> {
        await this.waitForReady();
        const adapter = await this.syncEngine.localAdapter;
        const result = await adapter.readStore(storeName, limit, offset);
        return {
            items: result.items as T[],
            hasMore: result.hasMore
        };
    }


    async readAll<T extends BaseModel>(storeName: StoreName): Promise<T[]> {
        await this.waitForReady();
        const adapter = await this.syncEngine.localAdapter;
        const result = await adapter.readStore(storeName);
        return result.items as T[];
    }


    async readBulk<T extends BaseModel>(
        storeName: StoreName,
        ids: string[] | string
    ): Promise<T[]> {
        await this.waitForReady();
        const idsArray = Array.isArray(ids) ? ids : [ids];
        const adapter = await this.syncEngine.localAdapter;
        return adapter.readBulk(storeName, idsArray);
    }


    async clearStore(storeName: StoreName): Promise<void> {
        await this.waitForReady();
        const adapter = await this.syncEngine.localAdapter;
        await adapter.clearStore(storeName);
    }

}

let storageInstance: SyncDbClient | null = null;

function getStorageInstance(): SyncDbClient {
    if (!storageInstance) {
        storageInstance = SyncDbClient.getInstance();
    }
    return storageInstance;
}

/** 首次访问时创建（须在 `new Noolingo(adapter)` 已注入 adapter 之后） */
export const storage: SyncDbClient = new Proxy({} as SyncDbClient, {
    get(_, prop: keyof SyncDbClient) {
        const inst = getStorageInstance();
        const v = inst[prop];
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(inst) : v;
    },
});