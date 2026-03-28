import { BaseModel } from './base_model';
import { ReadSettings, DEFAULT_READ_SETTINGS } from "./setting";

// 闪卡模式策略
export type StudyQueueMode =
    | 'review-only'     // 仅复习
    | 'new-only'        // 仅新学
    | 'review-first'    // 先复习后新学
    | 'new-first'       // 先新学后复习
    | 'smart';          // 智能模式（智能混合会按照一定比例混合）


// 测验题选择策略
export type QuizSelectionStrategy =
    | 'due_only'       // 只读取复习到期状态的测验
    | 'recent' // 只读取近期最近没有quiz过的
    | 'all';   // 所有可用的



// 学习偏好设置
export interface StudyPreferences extends BaseModel {
    advanced_mode: boolean; // 高级模式/多选项模式
    note_batch_size: number;    // 每次学习的笔记数量
    show_next_review_time: boolean; // 是否在按钮上显示下次复习时间
    notification_enabled: boolean; // 是否启用通知
    notification_time?: string; // 通知时间
    shouldUpdateStudyProgress: boolean;   // 是否在测验模式下更新学习进度
    target_retention_days: number;    // 目标保留天数   
    learningMode: StudyQueueMode;   // 闪卡复习模式
    quiz_selection_strategy: QuizSelectionStrategy;   // 测验题选择策略
    showDeckProgress: boolean;   // 是否显示笔记本的学习进度
    showLearnableCount: boolean;   // 是否显示笔记本的可学习数量
    showNotesCount: boolean;   // 是否显示笔记本的笔记数量
    readSettings: ReadSettings;   // 阅读设置
}


// 定义默认的学习偏好
export const defaultStudyPreferences: StudyPreferences = {
    id: "STUDY_PREFERENCES_ID",
    show_next_review_time: false,
    advanced_mode: false,
    note_batch_size: 10,
    notification_enabled: true,
    notification_time: "20:00",
    shouldUpdateStudyProgress: true,
    target_retention_days: 180,
    quiz_selection_strategy: 'recent',
    showDeckProgress: true,
    showNotesCount: true,
    showLearnableCount: true,
    learningMode: 'smart',
    readSettings: DEFAULT_READ_SETTINGS,
};  