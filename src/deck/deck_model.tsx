// @/types/deck_model.ts


import { BaseModel } from '../types/base_model';


export type SortOrder = 'asc' | 'desc';


export interface DeckFeatures {
    notes_count: number;
    new_count: number;
    reviewable_count: number;
}


export interface SortState {
    key: NoteSortKey,
    order: SortOrder,
    seed?: string
}

export interface DeckSortState {
    key: DeckSortKey;
    order: SortOrder;
}

export const defaultSortState: SortState = {
    key: 'created_at',
    order: 'desc',
    seed: undefined
}

export const defaultDeckSortState: DeckSortState = {
    key: 'created_at',
    order: 'desc'
}

export enum NoteLayout {
    single = "single",
    masonry = "masonry",
}

export enum CardStyle {
    default = "default",
    compact = "compact",
    detailed = "detailed",
}


export type NoteSortKey =
    | 'created_at'
    | 'updated_at'
    | 'title'
    | 'schedule'
    | 'mastery'
    | 'color'
    | 'last_review'
    | 'random'
    | 'position'


export type DeckSortKey =
    | 'name'           // 按名称排序 A-Z
    | 'notes_count'    // 按笔记数量排序
    | 'created_at'     // 按创建时间排序
    | 'updated_at'     // 按更新时间排序


export interface NoteDisplayMode {
    enableDueInfo: boolean;       // 显示到期信息
    enableCreatedAt: boolean;     // 显示创建时间
    enableLinks: boolean;         // 启用双向链接
    enableTags: boolean;          // 显示 tag
    enableMastery: boolean;      // 显示掌握程度
    enableColor: boolean;      // 显示优先级
}


// 基础Deck
export interface BaseDeck extends BaseModel {
    id: string;
    name: string;
    description: string;
    labels: string[];
    created_at: string;
    updated_at: string;
    sortState: SortState; // deck内笔记的排序状态
    layout: NoteLayout;
    archived: boolean;
    topic: DeckTopic;
    coverImage?: string; // 封面图片
    reviewSettings?: ReviewSettings; // 复习设置
    paths?: string[][]; // 该deck下所有的章节路径列表
}


// 带有附加属性的deck
export interface Deck extends BaseDeck {
    public?: boolean;
    shortId?: string;
    curatedId?: string,
    stats: {
        notes_count: number;
        new_count: number;
        archived_count: number;
        reviewable_count: number;
        total_stability: number;
    };
}


// 公开的Deck
export interface PublicDeck extends Deck {
    _id: string;         // 云端ID  
    category: string[],
    noteCount: number;
    language: string,
    ownerId: string,    // 所有者的openId
    sharedBy?: string,     // 共享者的openId
    downloadCount?: number, // 下载次数
    viewsCount?: number,    // 浏览次数
    popularity?: number,   // 受欢迎程度
    rating?: number,       // 评分
    fileUrl?: string,      // 云端文件地址
}



export enum DeckTopic {
    GENERAL = 'general',               // 通用/未分类
    LANGUAGES = 'languages',           // 语言学习
    LAW = 'law',                       // 法律
    MEDICINE = 'medicine',             // 医学
    EXAM = 'exam',                     // 考试
    SCIENCE = 'science',               // 科学
    MATH = 'math',                     // 数学
    COMPUTER_SCIENCE = 'computer_science', // 计算机科学
    DESIGN = 'design',                 // 设计创意
    ARTS = 'arts',                     // 艺术
}


export interface ReviewSettings {
    timeScale: number;
}


export const defaultReviewSettings: ReviewSettings = {
    timeScale: 1,
}


export function validateReviewSettings(settings: Partial<ReviewSettings>): ReviewSettings {
    return {
        timeScale: Math.max(0.1, Math.min(10, settings.timeScale ?? 1)), // 限制在 0.1-10 之间
    };
}


//支持的DeckAction类型
export type DeckAction =
    | 'info' //查看deck信息
    | 'edit' //编辑
    | 'export'//导出
    | 'package'//打包
    | 'focus' //聚焦/关注
    | 'unfocus' //取消关注
    | 'view'//在新页面打开
    | 'dialog'//弹出对话框
    | 'save' //保存
    | 'clear'  // 清空deck中的笔记（移到回收站）,不删除deck
    | 'delete' //硬删除deck并且删除deck中的笔记
    | 'hardDelete' //硬删除deck
    | 'share' //分享
    | 'clearHistory'//清空历史 
    | 'clearUnorganized'//清空未组织的笔记
    | 'clearFavorites'//清空收藏的笔记
    | 'archive' //归档
    | 'unarchive' //取消归档
    | 'setBackground'//添加背景图片
    | 'clearTrash'//清空垃圾箱
    | 'makePublic' // 设为公开
    | 'makePrivate' // 设为私有
    | 'copyCloudId'


// 保留的deckName
export type SpecialDeckId = 'all' | 'trash' | 'unorganized' | 'starred'

export const SPECIAL_DECK_IDS = [
    'all',
    'trash',
    'unorganized',
    'starred',
];




export enum DeckImportFormat {
    NOO = 'NOO',
    APKG = 'APKG',
    MARKDOWN = 'MARKDOWN',
    TEXT = 'TEXT'
}


// deck 验证方法
export function validateDeck(deck: any): Deck {
    const validatedDeck = {
        ...deck,
        labels: Array.isArray(deck.labels) ? deck.labels : [],
        archived: deck.archived ?? false,
        private: deck.private ?? true,
        sortState: deck.sortState ?? defaultSortState,
        displayMode: {
            ...defaultNoteDisplayMode,
            ...deck.displayMode
        },
        layout: deck.layout ?? defaultNoteLayout,
        stats: deck.stats ?? {
            notes_count: 0,
            new_count: 0,
            archived_count: 0,
            reviewable_count: 0,
            total_stability: 0,
        },
        reviewSettings: deck.reviewSettings ?? defaultReviewSettings,
        paths: Array.isArray(deck.paths) ? deck.paths : undefined,
    };
    return validatedDeck as Deck;
}



export const defaultNoteDisplayMode: NoteDisplayMode = {
    enableDueInfo: false,
    enableCreatedAt: true,
    enableLinks: true,
    enableTags: true,
    enableMastery: true,
    enableColor: true,
}


export const defaultNoteLayout = NoteLayout.single;
