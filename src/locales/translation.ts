// @/utils/translation.ts
// 服务层使用的翻译工具函数

import { Language, DEFAULT_LANGUAGE } from './languages';
import { getSavedLanguage } from '../utils/language';
import { translations } from './locales';


// 获取翻译文本（服务层使用）
export async function getTranslation(key: string, options?: Record<string, any>): Promise<string> {
  try {
    const language = await getSavedLanguage();
    const targetLanguage: Language = language || DEFAULT_LANGUAGE;
    const translationData = translations[targetLanguage] || translations[DEFAULT_LANGUAGE] || {};
    const result = key.split('.').reduce((obj: any, k) => obj?.[k], translationData);
    if (result === undefined) {
      console.warn(`翻译键未找到: ${key} (语言: ${targetLanguage})`);
      return key;
    }
    if (typeof result === 'string') {
      if (result.trim() === '') {
        console.warn(`翻译值为空: ${key} (语言: ${targetLanguage})`);
        return key;
      }
      if (options) {
        return Object.entries(options).reduce(
          (text, [key, value]) => text.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
          result
        );
      }
      return result;
    }
    console.warn(`翻译值类型错误: ${key} (语言: ${targetLanguage}, 类型: ${typeof result})`);
    return key;
  } catch (error) {
    console.error('获取翻译失败:', error);
    return key;
  }
}

