// @/services/ai.service.ts


import OpenAI from 'openai';
import { Service } from './service'
import { AIModel, AIRequestOptions } from '../types/ai';
import { useAIStore, UsageInfo } from '../stores/aiStore';
import { estimateTokenCount } from '../utils/textUtils';
import { simpleDecrypt } from '../utils/crypt';
import { LANGUAGE_TEXT_MAP, Language } from '../locales/languages';
import { getAiLanguage } from '../utils/language';
import authService from './auth.service';
import nooCloud from "../cloud";
import { ConfigKey, configManager } from '../storage/configManager';


// StreamChunk 类型定义
export interface StreamChunk {
  content: string;
  reasoningContent?: string;
  done: boolean;
  toolCalls?: Array<{
      id: string;
      type: 'function';
      function: {
          name: string;
          arguments: string;
      };
  }>;
}


export interface CompletionResponse {
  content: string;
  reasoningContent?: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  }
}


export class AIService implements Service {


  private openaiClient: OpenAI | null = null;

  constructor() { }


  async init() {
    const models = await this.fetchAvailableModels();
    const aiStore = useAIStore.getState();
    aiStore.setAvailableModels(models);
    const savedAILanguage = configManager.getConfig<Language>(ConfigKey.AI_OUTPUT_LANGUAGE);
    aiStore.setAIOutputLanguage(savedAILanguage);
    authService.onLoginSuccess(() => { this.checkAIAvailable() });
    this.checkAIAvailable();
  }



  isQuotaExceeded(): boolean {
    const aiStore = useAIStore.getState();
    return aiStore.usageInfo?.isQuotaExceeded || false;
  }


  private async addLanguageToPrompt(prompt: string): Promise<string> {
    // 优先使用 store 中存储的 AI 语言，如果没有则回退到 getAiLanguage
    const aiStore = useAIStore.getState();
    let language = aiStore.aiOutputLanguage;
    if (!language) {
      language = await getAiLanguage();
    }
    const languageText = (language && LANGUAGE_TEXT_MAP[language as Language]) || LANGUAGE_TEXT_MAP[Language.EN];
    const languagePrompt = `\n !语言规范（重要）：\n 你输出的时候应该的语言：${languageText}`;
    return prompt + languagePrompt;
  }


  private initializeClient(model: AIModel) {
    this.openaiClient = new OpenAI({
      apiKey: model.apiKey,
      baseURL: model.endpoint,
      dangerouslyAllowBrowser: true
    });
  }




  private async fetchAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await nooCloud.ai.getAvailableModels();
      if (!response.success || !response.data) {
        return [];
      }
      const apiModels = response.data.map((model: any) => ({
        id: model.id,
        name: model.name,
        endpoint: simpleDecrypt(model.endpoint),
        maxTokens: model.maxTokens,
        maxContextLength: model.maxContextLength,
        supportStreaming: model.supportStreaming || false,
        tire: model.tier,
        supportsVision: model.supportsVision || false,
        supportsReasoning: model.supportsReasoning || false,
        apiKey: simpleDecrypt(model.apiKey) || '',
      })) as AIModel[];
      return [...apiModels];
    } catch (error) {
      return [];
    }
  }


  public canUseAI(): boolean {
    return authService.isAuthenticated() && !this.isQuotaExceeded() && useAIStore.getState().availableModels.length > 0;
  }

  // 初始化用户余量信息(登录成功后调用)
  async checkAIAvailable() {
    try {
      if (!authService.isAuthenticated()) {
        return false;
      }
      const aiStore = useAIStore.getState();
      aiStore.setError(null);
      const [usageInfo, models] = await Promise.all([
        this.fetchTokensUsage(),
        this.fetchAvailableModels()
      ]);
      aiStore.setAvailableModels(models);
      const savedAILanguage = configManager.getConfig<Language>(ConfigKey.AI_OUTPUT_LANGUAGE);
      aiStore.setAIOutputLanguage(savedAILanguage);
      if (usageInfo) {
        aiStore.updateUsageInfo(usageInfo);
      } else {
        const initialUsage = await this.recordTokenUsage(0);
        if (initialUsage) {
          aiStore.updateUsageInfo(initialUsage);
        }
      }
      return true;
    } catch (error) {
      console.error('检查AI可用性失败:', error);
      return false;
    }
  }


  public getAvailableModels(): AIModel[] {
    return useAIStore.getState().availableModels;
  }

  // 不使用推理模型
  public getTextsModels(): AIModel[] {
    return useAIStore.getState().availableModels.filter(model => !model.supportsReasoning);
  }

  public getResonableModels(): AIModel[] {
    return useAIStore.getState().availableModels.filter(model => model.supportsReasoning);
  }


  public getVisionModels(): AIModel[] {
    return useAIStore.getState().availableModels.filter(model => model.supportsVision);
  }





  public async fetchTokensUsage(): Promise<UsageInfo | null> {
    try {
      const result = await nooCloud.ai.getTokensUsage();
      if (result.success && result.data) {
        useAIStore.getState().updateUsageInfo(result.data);
        return result.data;
      } else {
        console.warn('Failed to fetch token usage:', result.message);
      }
      return null;
    } catch (error) {
      console.error('获取token使用情况失败:', error);
      return null;
    }
  }


  public async recordTokenUsage(rawTokens: number): Promise<UsageInfo | null> {
    try {
      const usageInfo = await nooCloud.ai.recordTokenUsage(rawTokens);
      if (usageInfo) {
        useAIStore.getState().updateUsageInfo(usageInfo);
        return usageInfo;
      }
      return null;
    } catch (error) {
      console.error('记录token使用情况失败:', error);
      return null;
    }
  }



  public async completeText(options: AIRequestOptions): Promise<CompletionResponse> {
    const { model, systemPrompt = '', messageHistory = [], temperature = 0.7, maxTokens } = options;
    const finalSystemPrompt = await this.addLanguageToPrompt(systemPrompt);
    if (!model || !options.userPrompt) {
      throw new Error('Missing required parameters: model and userPrompt');
    }
    let estimatedPromptTokens = 0;
    if (finalSystemPrompt) {
      estimatedPromptTokens += estimateTokenCount(finalSystemPrompt);
    }
    for (const msg of messageHistory) {
      if (typeof msg.content === 'string') {
        estimatedPromptTokens += estimateTokenCount(msg.content);
      }
    }
    estimatedPromptTokens += estimateTokenCount(options.userPrompt);
    try {
      this.initializeClient(model);
      if (!this.openaiClient) {
        throw new Error('OpenAI client not initialized');
      }
      useAIStore.getState().setIsGenerating(true);
      
      // 转换消息历史为 OpenAI 兼容格式
      const openAIMessages: any[] = [
        ...(finalSystemPrompt ? [{ role: 'system' as const, content: finalSystemPrompt }] : []),
        ...(messageHistory || []).map(msg => {
          if (msg.role === 'tool') {
            return {
              role: 'tool' as const,
              content: msg.content,
              tool_call_id: msg.tool_call_id
            };
          } else if (msg.role === 'assistant') {
            const assistantMsg: any = {
              role: 'assistant' as const,
              content: msg.content
            };
            // 如果助手消息包含 tool_calls，必须包含在消息中
            if (msg.tool_calls && msg.tool_calls.length > 0) {
              assistantMsg.tool_calls = msg.tool_calls.map((tc: any) => ({
                id: tc.id,
                type: 'function',
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments
                }
              }));
            }
            return assistantMsg;
          } else {
            return {
              role: 'user' as const,
              content: msg.content
            };
          }
        }),
        { role: 'user' as const, content: options.userPrompt }
      ];
      
      const response = await this.openaiClient.chat.completions.create({
        model: model.id,
        messages: openAIMessages,
        temperature,
        max_tokens: maxTokens || model.maxTokens,
        stream: false
      });
      const content = response.choices[0]?.message?.content || '';
      const reasoningContent = model.supportsReasoning
        ? (response.choices[0]?.message as any)?.reasoning_content || ''
        : '';
      const estimatedCompletionTokens = estimateTokenCount(content);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
      await this.recordTokenUsage(totalTokens);
      return {
        content,
        reasoningContent,
        tokenUsage: {
          prompt: estimatedPromptTokens,
          completion: estimatedCompletionTokens,
          total: totalTokens
        }
      };
    } catch (error) {
      console.error('文本补全失败:', error);
      throw error;
    } finally {
      useAIStore.getState().setIsGenerating(false);
    }
  }




  public async completeTextStreamly(options: AIRequestOptions): Promise<AsyncGenerator<string, string, unknown>> {
    const { model, systemPrompt = '', messageHistory = [], temperature = 0.7, maxTokens } = options;
    const finalSystemPrompt = await this.addLanguageToPrompt(systemPrompt);
    if (!model || !options.userPrompt) {
      throw new Error('Missing required parameters: model and userPrompt');
    }
    let estimatedPromptTokens = 0;
    if (finalSystemPrompt) {
      estimatedPromptTokens += estimateTokenCount(finalSystemPrompt);
    }
    for (const msg of messageHistory) {
      if (typeof msg.content === 'string') {
        estimatedPromptTokens += estimateTokenCount(msg.content);
      }
    }
    estimatedPromptTokens += estimateTokenCount(options.userPrompt);
    let estimatedCompletionTokens = 0;
    let fullContent = '';
    useAIStore.getState().setIsGenerating(true);
    const self = this;
    const generator = async function* (): AsyncGenerator<string, string, unknown> {
      try {
        self.initializeClient(model);
        if (!self.openaiClient) {
          throw new Error('OpenAI client not initialized');
        }
        const openAIMessages: any[] = [
          ...(finalSystemPrompt ? [{ role: 'system' as const, content: finalSystemPrompt }] : []),
          ...(messageHistory || []).map(msg => {
            if (msg.role === 'tool') {
              return {
                role: 'tool' as const,
                content: msg.content,
                tool_call_id: msg.tool_call_id
              };
            } else if (msg.role === 'assistant') {
              const assistantMsg: any = {
                role: 'assistant' as const,
                content: msg.content
              };
              if (msg.tool_calls && msg.tool_calls.length > 0) {
                assistantMsg.tool_calls = msg.tool_calls.map((tc: any) => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                  }
                }));
              }
              return assistantMsg;
            } else {
              return {
                role: 'user' as const,
                content: msg.content
              };
            }
          }),
          { role: 'user' as const, content: options.userPrompt }
        ];
        const stream = await self.openaiClient.chat.completions.create({
          model: model.id,
          messages: openAIMessages,
          temperature,
          max_tokens: maxTokens || model.maxTokens,
          stream: true
        }) as any;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          const content = delta?.content || '';
          if (content) {
            fullContent += content;
            estimatedCompletionTokens += estimateTokenCount(content);
            yield content;
          }
        }
        const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
        await self.recordTokenUsage(totalTokens);
        return fullContent;
      } catch (error) {
        console.error('Text generator error:', error);
        throw error;
      } finally {
        useAIStore.getState().setIsGenerating(false);
      }
    };
    return generator();
  }



  // 支持工具调用的流式响应
  public async completeTextStreamlyWithTools(options: AIRequestOptions): Promise<AsyncGenerator<StreamChunk, StreamChunk, unknown>> {
    const { model, systemPrompt = '', messageHistory = [], temperature = 0.7, maxTokens, tools, tool_choice } = options;
    const finalSystemPrompt = await this.addLanguageToPrompt(systemPrompt);
    if (!model || !options.userPrompt) {
      throw new Error('Missing required parameters: model and userPrompt');
    }
    let estimatedPromptTokens = 0;
    if (finalSystemPrompt) {
      estimatedPromptTokens += estimateTokenCount(finalSystemPrompt);
    }
    for (const msg of messageHistory) {
      if (typeof msg.content === 'string') {
        estimatedPromptTokens += estimateTokenCount(msg.content);
      }
    }
    estimatedPromptTokens += estimateTokenCount(options.userPrompt);
    let estimatedCompletionTokens = 0;
    let fullContent = '';
    let reasoningContent = '';
    useAIStore.getState().setIsGenerating(true);
    const self = this;
    const generator = async function* (): AsyncGenerator<StreamChunk, StreamChunk, unknown> {
      try {
        self.initializeClient(model);
        if (!self.openaiClient) {
          throw new Error('OpenAI client not initialized');
        }
        const openAIMessages: any[] = [
          ...(finalSystemPrompt ? [{ role: 'system' as const, content: finalSystemPrompt }] : []),
          ...(messageHistory || []).map(msg => {
            if (msg.role === 'tool') {
              return {
                role: 'tool' as const,
                content: msg.content,
                tool_call_id: msg.tool_call_id
              };
            } else if (msg.role === 'assistant') {
              const assistantMsg: any = {
                role: 'assistant' as const,
                content: msg.content
              };
              if (msg.tool_calls && msg.tool_calls.length > 0) {
                assistantMsg.tool_calls = msg.tool_calls.map((tc: any) => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                  }
                }));
              }
              return assistantMsg;
            } else {
              return {
                role: 'user' as const,
                content: msg.content
              };
            }
          }),
          { role: 'user' as const, content: options.userPrompt }
        ];
        const requestOptions: any = {
          model: model.id,
          messages: openAIMessages,
          temperature,
          max_tokens: maxTokens || model.maxTokens,
          stream: true
        };
        if (tools && tools.length > 0) {
          requestOptions.tools = tools.map(tool => ({
            type: tool.type,
            function: {
              name: tool.function.name,
              description: tool.function.description,
              parameters: tool.function.parameters
            }
          }));
          if (tool_choice) {
            requestOptions.tool_choice = tool_choice;
          }
        }
        const stream = await self.openaiClient.chat.completions.create(requestOptions) as any;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          const content = delta?.content || '';
          const chunkReasoning = model.supportsReasoning ? (delta as any)?.reasoning_content || '' : '';
          const toolCalls = delta?.tool_calls;
          let toolCallsArray: any[] | undefined = undefined;
          if (toolCalls && Array.isArray(toolCalls)) {
            toolCallsArray = toolCalls.map((tc: any) => ({
              id: tc.id,
              type: tc.type || 'function',
              function: {
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || ''
              }
            }));
          }
          if (content) {
            fullContent += content;
            estimatedCompletionTokens += estimateTokenCount(content);
          }
          if (chunkReasoning) {
            reasoningContent += chunkReasoning;
          }
          const streamChunk: StreamChunk = {
            content,
            reasoningContent: chunkReasoning ? '' : undefined,
            done: false,
            toolCalls: toolCallsArray
          };
          yield streamChunk;
        }
        const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
        await self.recordTokenUsage(totalTokens);
        return { content: fullContent, reasoningContent, done: true };
      } catch (error) {
        console.error('Text generator error:', error);
        throw error;
      } finally {
        useAIStore.getState().setIsGenerating(false);
      }
    };
    return generator();
  }


  public destroy() {
    this.openaiClient = null;
    useAIStore.getState().resetAIState();
  }


}


export const aiService = new AIService();
export default aiService;