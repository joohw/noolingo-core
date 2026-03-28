// @/repo/ChatMessageRepository.tsx


import { storage, SyncDbClient } from '../storage/syncManager';
import { Message } from '../types/chat';
import { BaseModel } from '../types/base_model';


export class ChatMessageRepository {
    private storage: SyncDbClient;


    constructor() {
        this.storage = storage;
    }


    // 获取所有消息
    async getAllMessages(): Promise<Message[]> {
        const messages = await this.storage.readAll<Message>('localChats');
        // 按创建时间排序
        return messages.sort((a, b) => {
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            return timeA - timeB;
        });
    }


    // 获取单个消息
    async getMessage(messageId: string): Promise<Message | undefined> {
        const messages = await this.storage.readBulk<Message>('localChats', messageId);
        if (messages.length === 0) return undefined;
        return messages[0];
    }


    // 批量获取消息
    async getMessages(messageIds: string[]): Promise<Message[]> {
        if (messageIds.length === 0) return [];
        return await this.storage.readBulk<Message>('localChats', messageIds);
    }


    // 添加消息
    async addMessage(message: Message): Promise<Message> {
        const now = Date.now();
        const messageWithDefaults: Message = {
            ...message,
            createdAt: message.createdAt || now,
            updatedAt: message.updatedAt || now,
            syncStatus: 'pending',
            store: 'localChats',
            _ver: now,
        };
        const results = await this.storage.putBulk<Message>('localChats', messageWithDefaults);
        return results[0];
    }


    // 批量添加消息
    async addMessages(messages: Message[]): Promise<Message[]> {
        if (messages.length === 0) return [];
        const now = Date.now();
        const messagesWithDefaults: Message[] = messages.map(msg => ({
            ...msg,
            createdAt: msg.createdAt || now,
            updatedAt: msg.updatedAt || now,
            syncStatus: 'pending',
            store: 'localChats',
            _ver: now,
        }));
        return await this.storage.putBulk<Message>('localChats', messagesWithDefaults);
    }


    // 更新消息
    async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
        const now = Date.now();
        const updatedMessages = await this.storage.updateBulk<Message>('localChats', [{
            ...updates,
            id: messageId,
            updatedAt: now,
            _ver: now,
        }]);
        return updatedMessages[0];
    }


    // 删除消息
    async deleteMessage(messageId: string): Promise<void> {
        await this.storage.hardDeleteBulk('localChats', [messageId]);
    }


    // 批量删除消息
    async deleteMessages(messageIds: string[]): Promise<void> {
        if (messageIds.length === 0) return;
        await this.storage.hardDeleteBulk('localChats', messageIds);
    }


    // 清空所有消息
    async clearAllMessages(): Promise<void> {
        await this.storage.clearStore('localChats');
    }
}


export const chatMessageRepository = new ChatMessageRepository();
export default chatMessageRepository;

