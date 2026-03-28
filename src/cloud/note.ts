import cloud, { ApiResponse } from './core';


export const Note = {


    async shareDeck(deckId: string, isPublic: boolean = true): Promise<ApiResponse<any>> {
        return cloud.fetch(`/share/${deckId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'share', public: isPublic })
        });
    },


    // 取消分享
    async unshareDeck(deckId: string): Promise<ApiResponse<any>> {
        return cloud.fetch(`/share/${deckId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'unshare' })
        });
    },


    // 下载共享的笔记本
    async getSharedDeck(params: {
        shortId: string,
        offset: number,
        limit: number,
        password?: string,
    }): Promise<ApiResponse<any>> {
        return cloud.fetch(`/share/download`, {
            method: 'POST',
            body: JSON.stringify(params),
            needAuth: false
        });
    },


    // 获取笔记的统计数据
    async fetchNoteStats(): Promise<any> {
        return await cloud.fetch<any>('/store/stats', {
            method: 'GET',
            needAuth: true
        });
    }
    
};