// @/services/chat.service.ts
// 聊天消息存储服务


import { Service } from './service';
import aiService from './ai.service';
import { Message } from '../types/chat';
import { useMessageStore } from '../stores/chatStore';
import { estimateTokenCount } from '../utils/textUtils';
import chatMessageRepository from '../repo/ChatRepository';
import { getAdapter } from '../adapter';
import { introPrompt } from '../prompts/intro';
import { ConfigKey, configManager } from '../storage/configManager';


export type MessageUpdateCallback = (messages: Message[]) => void;
export type GeneratingStatusCallback = (isGenerating: boolean) => void;


export class ChatService implements Service {

    private isGeneratingRef: { current: boolean } = { current: false };
    private messageIdCounter: number = 0;

    // 生成唯一的消息ID
    private generateMessageId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const counter = this.messageIdCounter++;
        return `${timestamp}-${random}-${counter}`;
    }


    async init() {
        const store = useMessageStore.getState();
        if (store.messages.length > 0) {
            return;
        }
        const savedMessages = await this.getMessages();
        if (savedMessages.length > 0) {
            store.setMessages(savedMessages);
        }
       await this.getRecommendIntro();
    }


    // 订阅消息更新（保留兼容性，但不再使用）
    onMessageUpdate(callback: MessageUpdateCallback): () => void {
        // 不再使用回调机制，直接返回空函数
        return () => {};
    }


    // 订阅生成状态更新（保留兼容性，但不再使用）
    onGeneratingStatus(callback: GeneratingStatusCallback): () => void {
        // 不再使用回调机制，直接返回空函数
        return () => {};
    }


    // 加载聊天消息
    async getMessages(): Promise<Message[]> {
        try {
            const messages = await chatMessageRepository.getAllMessages();
            // 确保所有消息都有唯一ID
            const messagesWithIds = messages.map(msg => {
                if (!msg.id) {
                    return { ...msg, id: this.generateMessageId() };
                }
                return msg;
            });
            return messagesWithIds;
        } catch (error) {
            console.error('Error loading chat messages:', error);
            return [];
        }
    }


    // 清空聊天消息
    async clearMessages(): Promise<void> {
        try {
            useMessageStore.getState().clearMessages();
            await chatMessageRepository.clearAllMessages();
        } catch (error) {
            console.error('Error clearing chat messages:', error);
        }
    }


    // 删除特定消息
    async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const messages = useMessageStore.getState().messages;
            const index = messages.findIndex(msg => msg.id === messageId);
            if (index === -1) {
                return false;
            }
            useMessageStore.getState().deleteMessage(messageId);
            await chatMessageRepository.deleteMessage(messageId);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }


    // 批量删除消息
    async deleteMessages(messageIds: string[]): Promise<number> {
        try {
            const messages = useMessageStore.getState().messages;
            const idsSet = new Set(messageIds);
            const deletedCount = messages.filter(msg => idsSet.has(msg.id)).length;
            if (deletedCount > 0) {
                useMessageStore.getState().deleteMessages(messageIds);
                await chatMessageRepository.deleteMessages(messageIds);
            }
            return deletedCount;
        } catch (error) {
            console.error('Error deleting messages:', error);
            return 0;
        }
    }


    // 复制消息内容到剪贴板
    async copyMessage(messageId: string): Promise<boolean> {
        try {
            const messages = useMessageStore.getState().messages;
            const message = messages.find(msg => msg.id === messageId);
            if (!message || !message.content) {
                return false;
            }
            await getAdapter().device.copyToClipboard(message.content);
            return true;
        } catch (error) {
            console.error('Error copying message:', error);
            return false;
        }
    }


    // 发送消息并生成回复
    async sendMessage(userPrompt: string, onError?: (error: Error) => void, existingUserMessageId?: string): Promise<void> {
        const store = useMessageStore.getState();
        if (!userPrompt.trim() || store.isGenerating) {
            return;
        }
        let userMessage: Message;
        let messages: Message[];

        if (existingUserMessageId) {
            // 如果提供了已有的用户消息ID，使用已有的消息
            messages = store.messages;
            userMessage = messages.find(msg => msg.id === existingUserMessageId)!;
            if (!userMessage) {
                throw new Error('User message not found');
            }
        } else {
            // 否则创建新的用户消息
            const now = Date.now();
            userMessage = {
                id: this.generateMessageId(),
                role: 'user',
                content: userPrompt.trim(),
                createdAt: now,
                updatedAt: now,
                syncStatus: 'pending',
                store: 'localChats',
                _ver: now,
            };

            // 添加用户消息
            store.addMessage(userMessage);
            await chatMessageRepository.addMessage(userMessage);
            messages = [...store.messages];
        }

        // 获取消息历史（包括新添加的用户消息）
        const messageHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 计算 prompt tokens（用于记录 token 使用）
        let estimatedPromptTokens = 0;
        for (const msg of messageHistory) {
            if (typeof msg.content === 'string') {
                estimatedPromptTokens += estimateTokenCount(msg.content);
            }
        }
        // 添加空的助手消息占位符
        const now = Date.now();
        const assistantMessage: Message = {
            id: this.generateMessageId(),
            role: 'assistant',
            content: '',
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            store: 'localChats',
            _ver: now,
        };
        store.addMessage(assistantMessage);
        await chatMessageRepository.addMessage(assistantMessage);

        store.setIsGenerating(true);
        this.isGeneratingRef.current = true;

        try {
            const models = aiService.getTextsModels();
            if (models.length === 0) {
                throw new Error('No AI model available');
            }

            const stream = await aiService.completeTextStreamly({
                model: models[0],
                userPrompt: userPrompt.trim(),
                messageHistory: messageHistory,
                temperature: 0.7
            });

            let fullContent = '';
            let estimatedCompletionTokens = 0;
            let wasInterrupted = false;
            let lastUpdateTime = Date.now();
            const UPDATE_INTERVAL = 100; // 每100ms最多更新一次UI

            for await (const chunk of stream) {
                if (!this.isGeneratingRef.current) {
                    wasInterrupted = true;
                    break;
                }
                fullContent += chunk;
                estimatedCompletionTokens += estimateTokenCount(chunk);

                // 防抖更新UI，减少重渲染频率
                const now = Date.now();
                if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                    store.updateMessage(assistantMessage.id, fullContent);
                    await chatMessageRepository.updateMessage(assistantMessage.id, { content: fullContent });
                    lastUpdateTime = now;
                }
            }

            // 确保最后的内容得到更新
            if (fullContent && this.isGeneratingRef.current) {
                store.updateMessage(assistantMessage.id, fullContent);
                await chatMessageRepository.updateMessage(assistantMessage.id, { content: fullContent });
            }
            if (wasInterrupted && (fullContent.length > 0 || estimatedPromptTokens > 0)) {
                const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
                await aiService.recordTokenUsage(totalTokens);
            }

            if (!this.isGeneratingRef.current) {
                store.deleteMessage(assistantMessage.id);
                await chatMessageRepository.deleteMessage(assistantMessage.id);
            }
            // 如果生成成功，消息已经在流式更新时保存了，不需要额外操作
        } catch (error) {
            console.error('Chat error:', error);
            store.deleteMessage(assistantMessage.id);
            await chatMessageRepository.deleteMessage(assistantMessage.id);
            if (onError) {
                onError(error instanceof Error ? error : new Error('Unknown error'));
            }
        } finally {
            store.setIsGenerating(false);
            this.isGeneratingRef.current = false;
        }
    }


    // 取消生成
    cancelGeneration(): void {
        this.isGeneratingRef.current = false;
    }


    // 获取推荐的介绍示例（带缓存，每天只生成一次）
    async getRecommendIntro(): Promise<string[]> {
        // 获取今天的日期字符串（格式：YYYY-MM-DD）
        const today = new Date().toISOString().split('T')[0];
        // 检查缓存
        const cacheKey = ConfigKey.CHAT_INTRO_CACHE;
        const cached = configManager.getConfig<{ date: string; examples: string[] }>(cacheKey);
        // 如果缓存存在且是今天的，直接返回
        if (cached && cached.date === today && cached.examples && cached.examples.length === 3) {
            return cached.examples;
        }
        // 生成新的示例
        try {
            const models = aiService.getTextsModels();
            if (models.length === 0) {
                throw new Error('No AI model available');
            }
            const response = await aiService.completeText({
                model: models[0],
                userPrompt: introPrompt,
                systemPrompt: '',
                temperature: 0.8,
                maxTokens: 200
            });
            // 解析返回的内容，提取三个问题
            const content = response.content.trim();
            const examples = content
                .split('\n')
                .map(line => {
                    return line.trim().replace(/^[\d一二三四五六七八九十]+[\.、。]\s*/, '').replace(/^[-•]\s*/, '');
                })
                .filter(line => line.length > 0 && line.length < 100) // 过滤空行和过长的行
                .slice(0, 3);
            // 如果成功解析到三个问题，保存到缓存
            if (examples.length === 3) {
                configManager.saveConfig(cacheKey, {
                    date: today,
                    examples: examples
                });
                return examples;
            } else {
                // 如果解析失败，返回默认示例
                return this.getDefaultExamples();
            }
        } catch (error) {
            console.error('Error generating intro examples:', error);
            // 如果生成失败，返回默认示例
            return this.getDefaultExamples();
        }
    }


    // 获取默认示例（作为后备方案）
    private getDefaultExamples(): string[] {
        return [
            "如何用英文表达'精妙的'？",
            "如何理解'量子纠缠'？",
            "解释一下'相对论'的基本概念"
        ];
    }




}


export const chatService = new ChatService();
export default chatService;
