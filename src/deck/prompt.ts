// @/core/prompts/deck/optimize.ts

import { DeckTopic } from './deck_model';



export const DECK_OPTIMIZE_PROMPT = `
你是一个专业的笔记本优化助手，请根据提供的笔记本内容和现有信息，优化这个笔记本的配置。

【现有笔记本信息】
- 当前名称: {{currentName}}
- 当前描述: {{currentDescription}}
- 当前主题: {{currentTopic}}

【笔记本内容样本】
{{noteSamples}}

【优化任务】
请分析笔记本内容，然后提供以下优化建议：
1. 一个更合适的笔记本名称
2. 一个更准确的描述
3. 一个最匹配的学习主题分类

【输出格式】
请严格按照以下JSON格式返回，不要包含其他内容：
{
  "name": "优化后的笔记本名称",
  "description": "优化后的描述文本", 
  "topic": "最匹配的主题分类"
}

【主题分类选项】
- general: 通用学习
- languages: 语言学习  
- science: 科学
- math: 数学
- computer_science: 计算机科学
- programming: 编程开发
- design: 设计创意
- arts: 艺术
- law: 法律
- medicine: 医学
- exam: 考试

【优化原则】
1. 名称：简洁明了，反映核心内容
2. 描述：概括主要内容特点和学习目标
3. 主题：选择最准确匹配内容主题的分类
4. 如果现有信息已经很合适，可以保持不变
`;



export interface DeckOptimization {
  name: string;
  description: string;
  topic: DeckTopic;
}



export const buildDeckOptimizePrompt = (
  noteSamples: string, 
  currentName: string, 
  currentDescription: string, 
  currentTopic: DeckTopic
): string => {
  return DECK_OPTIMIZE_PROMPT
    .replace('{{currentName}}', currentName)
    .replace('{{currentDescription}}', currentDescription)
    .replace('{{currentTopic}}', currentTopic || 'general')
    .replace('{{noteSamples}}', noteSamples);
};




// 解析AI返回的deck优化结果
export const parseDeckOptimization = (content: string): DeckOptimization | null => {
  try {
    const cleanedContent = content.trim()
      .replace(/^```(?:json)?\s*/i, '')  // 移除开头的 ```json 或 ```
      .replace(/\s*```$/, '');           // 移除结尾的 ```
    const parsed = JSON.parse(cleanedContent.trim());
    if (!parsed.name || !parsed.description || !parsed.topic) {
      console.warn('AI返回的优化结果缺少必需字段:', parsed);
      return null;
    }
    if (!Object.values(DeckTopic).includes(parsed.topic)) {
      console.warn('AI返回了无效的主题分类:', parsed.topic);
      return null;
    }
    return {
      name: parsed.name.trim(),
      description: parsed.description.trim(),
      topic: parsed.topic as DeckTopic
    };
  } catch (error) {
    console.error('解析AI优化结果失败:', error);
    return null;
  }
};