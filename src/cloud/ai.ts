// @/services/cloud/ai.ts


import cloud, { ApiResponse } from './core';
import { UsageInfo } from '../stores/aiStore';
import { AIModel } from '../types/ai';
import { simpleDecrypt } from '../utils/crypt';


const convertTokensToPoints = (rawTokens: number): number => {
  return Math.ceil(rawTokens / 1500);
}


export const AI = {


  async getAvailableModels(): Promise<any> {
    return await cloud.fetch('/ai/models', {
      method: 'GET',
      needAuth: false
    });
  },


  async getTokensUsage(): Promise<ApiResponse<UsageInfo>> {
    return await cloud.fetch<UsageInfo>('/user/tokens', {
      method: 'GET',
      needAuth: true
    });
  },

  
  async recordTokenUsage(rawTokens: number): Promise<UsageInfo | null> {
    try {
      const points = convertTokensToPoints(rawTokens);
      const result = await cloud.fetch<UsageInfo>('/user/tokens/record', {
        method: 'POST',
        body: JSON.stringify({ usage: points }),
        needAuth: true
      });
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('记录token使用情况失败:', error);
      return null;
    }
  },


  async fetchAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await cloud.fetch<AIModel[]>('/ai/models', {
        method: 'GET',
        needAuth: true
      });
      if (!response.success || !response.data) {
        return [];
      }
      const apiModels = response.data.map((model) => ({
        id: model.id,
        name: model.name,
        maxTokens: model.maxTokens,
        maxContextLength: model.maxContextLength,
        supportStreaming: model.supportStreaming || false,
        supportsVision: model.supportsVision || false,
        supportsReasoning: model.supportsReasoning || false,
        endpoint: simpleDecrypt(model.endpoint),
        apiKey: simpleDecrypt(model.apiKey) || '',
      })) as AIModel[];
      return [...apiModels];
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  },


};