// 本地聊天消息（同步存储），与 ./ai 中 API 用的 Message 不同

import type { BaseModel } from './base_model';

export interface Message extends BaseModel {
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
    updatedAt: number;
}
