// @/services/curate.service.ts
// 精选笔记的模块
// publicNote存储在数据库中，精选笔记的数据则是以json格式存储在oss中


import { Service } from './service'
import { Language } from '../locales/languages';
import { getAdapter } from '../adapter';
import nooCloud from '../cloud';
import { PublicDeck } from '../deck/deck_model';
import { Note } from '../note'




export class CurateService implements Service {

    private decksCache: { data: PublicDeck[]; timestamp: number } | null = null;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存


    constructor() { }

    async init(): Promise<any> {

    }

    // 将CDN URL转换为Origin URL（用于有时效性的数据）
    private convertToOriginUrl(url: string): string {
        if (!url) return url;
        const { ossCdnUrl, ossOriginUrl } = getAdapter().appConfig;
        if (url.includes(ossCdnUrl)) {
            return url.replace(ossCdnUrl, ossOriginUrl);
        }
        return url;
    }


    async getDeckCategories(language: Language): Promise<string[]> {
        try {
            const url = nooCloud.core.getFullUrl('/curated/categories?language=' + language);
            const response = await fetch(url);
            if (!response.ok) return [];
            const json = await response.json();
            if (json.success) {
                return json.data;
            }
            return [];
        } catch (error) {
            console.error('getDeckCategories error:', error);
            return [];
        }
    }



    // 获取建议搜索词
    async getSuggestedSearches(language: Language, limit: number = 10): Promise<string[]> {
        try {
            const url = nooCloud.core.getFullUrl(`/curated/suggestions?language=${language}&limit=${limit}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error('API request failed');
            }
            return responseData.data?.suggestions || [];
        } catch (error) {
            console.error('Failed to get suggested searches:', error);
            return [];
        }
    }


    getCachedDecks(): PublicDeck[] | null {
        if (!this.decksCache) {
            return null;
        }
        const cacheAge = Date.now() - this.decksCache.timestamp;
        if (cacheAge > this.CACHE_DURATION) {
            this.decksCache = null;
            return null;
        }
        // 返回缓存中的所有 decks
        return this.decksCache.data;
    }


    getCachedDeck(deckId: string): PublicDeck | null {
        if (!this.decksCache) {
            return null;
        }
        const cacheAge = Date.now() - this.decksCache.timestamp;
        if (cacheAge > this.CACHE_DURATION) {
            return null;
        }
        const deck = this.decksCache.data.find(d => d._id === deckId);
        return deck || null;
    }



    async getCuratedDecks(
        language: Language,
        topic?: string, // 改为 topic
        searchQuery?: string,
        sortBy: 'popularity' | 'newest' | 'rating' = 'popularity',
        sortOrder: 'asc' | 'desc' = 'desc',
        offset: number = 0,
        limit: number = 20
    ): Promise<PublicDeck[]> {
        try {
            const params = new URLSearchParams({
                language: language,
                sortBy: sortBy,
                sortOrder: sortOrder,
                offset: offset.toString(),
                limit: limit.toString()
            });
            if (topic) {
                params.append('topic', topic);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            const endpoint = `${nooCloud.core.getFullUrl('/curated/decks')}?${params.toString()}`;
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error('API request failed');
            }
            const decksData = responseData.data?.decks || [];
            if (!Array.isArray(decksData)) {
                console.warn('Response decks is not an array:', typeof decksData);
                return [];
            }
            this.decksCache = {
                data: decksData,
                timestamp: Date.now()
            };
            return decksData;
        } catch (error) {
            console.error('Failed to get curated decks:', error);
            throw error;
        }
    }




    async previewCuratedNotes(deckId: string, limit: number = 100, offset: number = 0): Promise<Note[]> {
        try {
            const deck = this.decksCache?.data?.find(d => d._id === deckId);
            if (!deck?.fileUrl) {
                throw new Error('Deck not found or missing file URL');
            }
            // 使用origin URL确保获取最新数据
            const fileUrl = this.convertToOriginUrl(deck.fileUrl);
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch from OSS: ${response.status}`);
            }
            const curatedDeckData = await response.json();
            const notes = curatedDeckData.notes || [];
            console.log(`Successfully fetched ${notes.length} notes for deck ${deckId}`);
            return notes.slice(offset, offset + limit);
        } catch (error) {
            console.error(`Failed to get full curated notes for deck ${deckId}:`, error);
            throw error;
        }
    }



    async downloadCuratedNotes(deckId: string): Promise<Note[]> {
        try {
            // 从缓存中获取deck信息
            const deck = this.decksCache?.data?.find(d => d._id === deckId);
            if (!deck?.fileUrl) {
                throw new Error('Deck not found or missing file URL');
            }
            // 使用origin URL确保获取最新数据
            const fileUrl = this.convertToOriginUrl(deck.fileUrl);
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch from OSS: ${response.status}`);
            }
            const curatedDeckData = await response.json();
            const notes = curatedDeckData.notes || [];
            // 异步记录下载统计 - 使用统一的action接口
            this.recordDeckAction(deckId, 'download').catch(error => {
                console.warn('Failed to record download action:', error);
            });
            console.log(`Successfully fetched ${notes.length} notes for deck ${deckId}`);
            return notes;
        } catch (error) {
            console.error(`Failed to get full curated notes for deck ${deckId}:`, error);
            throw error;
        }
    }


    // 使用统一的action接口记录统计
    private async recordDeckAction(deckId: string, action: 'download' | 'like' | 'view'): Promise<void> {
        try {
            const url = nooCloud.core.getFullUrl(`/curated/decks/${deckId}/action`);
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action
                })
            });
        } catch (error) {
            console.warn(`Failed to record ${action} action:`, error);
        }
    }


}


export const curateService = new CurateService();
export default curateService;