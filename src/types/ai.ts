// @/types/ai.ts
// types.ts

import { Language } from "../locales/languages";


export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

// 工具定义
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required?: string[];
        };
    };
}

// 工具调用
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}


export enum ModelTier {
    Free = 0,
    Basic = 1,
    Standard = 2,
    Premium = 3,
}

// 提供给ai的提示词的设置
export interface SavedPromptInfo {
    promptId: string;
    includeNickname: boolean;
    includeEarlyBird: boolean;
 }

 

export interface AIModel {
    id: string;                   // 模型标识符
    name: string;                 // 模型显示名称
    endpoint: string;             // API 端点
    maxTokens: number;            // 最大 token 限制
    maxContextLength: number;     // 最大上下文长度
    supportStreaming: boolean;    // 是否支持流式响应
    tier: ModelTier;              // 模型等级
    supportsVision: boolean;      // 是否支持图像理解
    supportsReasoning: boolean;   // 是否支持推理功能
    apiKey: string;                // 模型的密钥
}


export interface AIRequestOptions {
    model: AIModel;
    userPrompt: string;
    systemPrompt?: string;
    messageHistory?: Message[];  // 添加历史消息支持
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
    language?: Language;
    tools?: ToolDefinition[];  // 工具定义
    tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}


export type MessageRole = 'user' | 'assistant';


// 对话类型
export interface Conversation {
    id: string;
    title?: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}




