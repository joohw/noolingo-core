// @/storage/CloudbaseAdapter.ts



import { DatabaseAdapter, SyncViewItem } from 'delta-sync';
import { StoreName, BaseModel } from '../types/base_model';
import nooCloud from "../cloud";


export class CloudBaseAdapter implements DatabaseAdapter {


    private static instance: CloudBaseAdapter | null = null;
    private calculateDataSize(data: any): number {
        try {
            const jsonString = JSON.stringify(data);
            if (typeof window !== 'undefined' && window.TextEncoder) {
                return new TextEncoder().encode(jsonString).length;
            }
            if (typeof Buffer !== 'undefined') {
                return Buffer.byteLength(jsonString, 'utf8');
            }
            return jsonString.length * 3;
        } catch (error) {
            console.warn('[CloudBaseAdapter] 数据大小计算失败，使用默认值:', error);
            return 1024;
        }
    }
    private readonly MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;
    private readonly MAX_ITEM_SIZE = 5000 * 1024;
    private readonly DEFAULT_BATCH_SIZE = 100;
    private constructor() {

    }


    public static getInstance(): CloudBaseAdapter {
        if (!CloudBaseAdapter.instance) {
            CloudBaseAdapter.instance = new CloudBaseAdapter();
        }
        return CloudBaseAdapter.instance;
    }


    async readStore<T extends BaseModel>(
        storeName: StoreName,
        limit?: number,
        offset?: number
    ): Promise<{ items: T[]; hasMore: boolean }> {
        try {
            const response = await nooCloud.store.queryStore<{ items: T[]; hasMore: boolean }>(
                storeName,
                { limit, offset }
            );
            return response.data!;
        } catch (error) {
            console.error(`从${storeName}读取数据失败:`, error);
            throw error;
        }
    }


    async listStoreItems(
        storeName: string,
        offset?: number,
        since?: number,
        before?: number,
    ): Promise<{
        items: SyncViewItem[];
        hasMore?: boolean,
        offset?: number
    }> {
        try {
            const response = await nooCloud.store.listStoreItems(storeName, {
                offset,
                since,
                before,
                limit: 100
            });
            if (!response.success || !response.data) {
                throw new Error(response.message || `获取${storeName}列表失败`);
            }
            return response.data as any;
        } catch (error) {
            console.error(`获取${storeName}列表失败:`, error);
            throw error;
        }
    }

    async readBulk<T extends BaseModel>(
        storeName: StoreName,
        ids: string[]
    ): Promise<T[]> {
        if (!ids.length) return [];
        try {
            const allResults: T[] = [];
            let currentIds = [...ids];
            while (currentIds.length > 0) {
                const response = await nooCloud.store.readStore<T[]>(storeName, currentIds);
                if (!response.success) {
                    throw new Error(response.message || `读取${storeName}失败`);
                }
                const items = response.data || [];
                allResults.push(...items);
                const pagination = (response as any).pagination;
                const hasMore = pagination?.hasMore === true;
                if (!hasMore) {
                    break;
                }
                const returnedIds = new Set(items.map(item => item.id));
                currentIds = currentIds.filter(id => !returnedIds.has(id));
                if (currentIds.length === 0) {
                    break;
                }
            }
            return allResults;
        } catch (error) {
            console.error(`[CloudBaseAdapter] readBulk失败 for store ${storeName}:`, error);
            throw error;
        }
    }



    async putBulk<T extends BaseModel>(
        storeName: StoreName,
        items: T[]
    ): Promise<T[]> {
        if (!items.length) return [];
        try {
            if (items.length <= this.DEFAULT_BATCH_SIZE) {
                const batchSize = this.calculateDataSize(items);
                if (batchSize <= this.MAX_PAYLOAD_SIZE) {
                    const response = await nooCloud.store.putStore<T[]>(storeName, items);
                    return response.data!;
                }
            }
            return await this.putBulkWithSizeLimit(storeName, items);
        } catch (error) {
            console.error(`[CloudBaseAdapter] putBulk failed for store ${storeName}:`, error);
            throw error;
        }
    }


    private async putBulkWithSizeLimit<T extends BaseModel>(
        storeName: StoreName,
        items: T[]
    ): Promise<T[]> {
        const results: T[] = [];
        let currentBatch: T[] = [];
        let currentBatchSize = 0;
        let skippedItems = 0;
        console.log(`[CloudBaseAdapter] 开始分批处理 ${items.length} 个项目到 ${storeName}`);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemSize = this.calculateDataSize(item);
            if (itemSize > this.MAX_ITEM_SIZE) {
                console.warn(`[CloudBaseAdapter] 项目 ${item.id} 过大被跳过: ${itemSize} bytes`);
                skippedItems++;
                continue;
            }
            const testBatch = [...currentBatch, item];
            const testBatchSize = this.calculateDataSize(testBatch);
            if (testBatchSize > this.MAX_PAYLOAD_SIZE && currentBatch.length > 0) {
                try {
                    const response = await nooCloud.store.putStore<T[]>(storeName, currentBatch);
                    if (response.data) {
                        results.push(...response.data);
                    }
                    console.log(`[CloudBaseAdapter] 批次已提交: ${currentBatch.length} 项目到 ${storeName}`);
                } catch (error) {
                    console.error(`[CloudBaseAdapter] 批次提交失败:`, error);
                    throw error;
                }
                currentBatch = [item];
                currentBatchSize = itemSize;
            } else {
                currentBatch.push(item);
                currentBatchSize = testBatchSize;
            }
            if (currentBatch.length >= this.DEFAULT_BATCH_SIZE) {
                try {
                    const response = await nooCloud.store.putStore<T[]>(storeName, currentBatch);
                    if (response.data) {
                        results.push(...response.data);
                    }
                    console.log(`[CloudBaseAdapter] 达到最大批次大小，已提交: ${currentBatch.length} 项目到 ${storeName}`);
                } catch (error) {
                    console.error(`[CloudBaseAdapter] 批次提交失败:`, error);
                    throw error;
                }
                currentBatch = [];
                currentBatchSize = 0;
            }
        }
        if (currentBatch.length > 0) {
            try {
                const response = await nooCloud.store.putStore<T[]>(storeName, currentBatch);
                if (response.data) {
                    results.push(...response.data);
                }
                console.log(`[CloudBaseAdapter] 最终批次已提交: ${currentBatch.length} 项目到 ${storeName}`);
            } catch (error) {
                console.error(`[CloudBaseAdapter] 最终批次提交失败:`, error);
                throw error;
            }
        }
        if (skippedItems > 0) {
            console.warn(`[CloudBaseAdapter] putBulk 跳过了 ${skippedItems} 个过大项目`);
        }
        console.log(`[CloudBaseAdapter] 分批处理完成: 处理了 ${results.length} 个项目，跳过了 ${skippedItems} 个项目`);
        return results;
    }


    async deleteBulk(
        storeName: StoreName,
        ids: string[]
    ): Promise<void> {
        if (!ids.length) return;
        try {
            await nooCloud.store.deleteStore(storeName, ids);
        } catch (error) {
            throw error;
        }
    }


    async clearStore(storeName: StoreName): Promise<boolean> {
        try {
            const response = await nooCloud.store.clearStore(storeName);
            return response.success;
        } catch (error) {
            return false;
        }
    }


    async countStore(storeName: StoreName): Promise<number> {
        try {
            const response = await nooCloud.store.countStore(storeName);
            if (!response.success) {
                throw new Error('获取数据数量失败');
            }
            return response.data?.total || 0;
        } catch (error) {
            console.error(`获取${storeName}数据数量失败:`, error);
            throw error;
        }
    }


    async getStores(): Promise<string[]> {
        return [
            'localUser',
            'localDecks',
            'localNotes',
            'localDailyStudyData',
            'tombStones',
        ];
    }

}
