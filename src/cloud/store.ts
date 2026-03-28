// @/services/cloud/store.ts
import cloud, { ApiResponse } from './core';



export const Store = {

    // 读取store中的数据
    async readStore<T>(
        storeName: string,
        ids: string[]
    ): Promise<ApiResponse<T>> {
        return await cloud.fetch(`/store/${storeName}/read`, {
            method: 'POST',
            body: JSON.stringify({ ids }),
            needAuth: true
        });
    },


    // 创建或更新store中的数据
    async putStore<T>(
        storeName: string,
        items: any[]
    ): Promise<ApiResponse<T>> {
        return await cloud.fetch(`/store/${storeName}/put`, {
            method: 'POST',
            body: JSON.stringify({ items }),
            needAuth: true
        });
    },


    // 删除store中的数据
    async deleteStore(
        storeName: string,
        ids: string[]
    ): Promise<ApiResponse<void>> {
        return await cloud.fetch(`/store/${storeName}/delete`, {
            method: 'POST',
            body: JSON.stringify({ ids }),
            needAuth: true
        });
    },


    // 清空store中的数据
    async clearStore(
        storeName: string
    ): Promise<ApiResponse<void>> {
        return await cloud.fetch(`/store/${storeName}/clear`, {
            method: 'POST',
            needAuth: true
        });
    },


    async countStore(
        storeName: string
    ): Promise<ApiResponse<{ total: number }>> {
        return await cloud.fetch(`/store/${storeName}/count`, {
            method: 'GET',
            needAuth: true
        });
    },


    // 查询store中的数据
    async queryStore<T>(
        storeName: string,
        pagination?: { limit?: number; offset?: number, since?: number }
    ): Promise<ApiResponse<T>> {
        const queryParams = new URLSearchParams();
        if (pagination?.limit !== undefined) {
            queryParams.append('limit', pagination.limit.toString());
        }
        if (pagination?.offset !== undefined) {
            queryParams.append('offset', pagination.offset.toString());
        }
        if (pagination?.since !== undefined) {
            queryParams.append('since', pagination.since.toString());
        }
        const url = `/store/${storeName}/query${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const result = await cloud.fetch(url, {
            method: 'GET',
            needAuth: true
        });
        return result;
    },




    async listStoreItems(
        storeName: string,
        params?: {
            offset?: number;
            since?: number;
            before?: number;
            limit?: number;
        }
    ): Promise<ApiResponse<{
        items: Array<{
            id: string;
            _ver: number;
            deleted?: boolean;
            store?: string;
            size?: number;
            hash?: string;
            isAttachment?: boolean;
        }>;
        hasMore: boolean;
        offset?: number;
    }>> {
        const queryParams = new URLSearchParams();
        if (params?.offset !== undefined) {
            queryParams.append('offset', params.offset.toString());
        }
        if (params?.limit !== undefined) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.since !== undefined) {
            queryParams.append('since', params.since.toString());
        }
        if (params?.before !== undefined) {
            queryParams.append('before', params.before.toString());
        }
        const url = `/store/${storeName}/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await cloud.fetch(url, {
            method: 'GET',
            needAuth: true
        });
    }



};