// @/utils/textUtils.tsx
// textUtils.ts

import { franc } from 'franc-min';


export const calculateWordCount = (html: string): number => {
  const text = html.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const words = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + words.length;
};




// 估算的token用量
export const estimateTokenCount = (text: string, multiplier: number = 1): number => {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const chineseCharRatio = chineseChars / text.length;
  let charsPerToken = 4; // 默认比率(英文)
  if (chineseCharRatio > 0.5) {
    charsPerToken = 1.3; // 中文比率
  }
  return Math.ceil((text.length / charsPerToken) * multiplier);
};





// 辅助函数：检查内容是否为空
export const isContentEmpty = (content: string): boolean => {
  const cleanContent = content
    .replace(/<[^>]+>/g, '')  // 移除HTML标签
    .replace(/&nbsp;/g, ' ')  // 替换空格实体
    .replace(/&[a-zA-Z0-9]+;/g, 'x')  // 替换其他HTML实体为单个字符
    .trim();
  return !cleanContent || cleanContent === '' || cleanContent === '<p></p>' || cleanContent === '<br>';
};



// 手动实现的句子分割函数
export function splitTextIntoSentences(text: string): string[] {
    if (!text.trim()) return [];
    const sentences: string[] = [];
    let currentSentence = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';
        const nextChar = i < text.length - 1 ? text[i + 1] : '';
        currentSentence += char;
        // 检查是否是句子结束标点
        if (char === '.' || char === '!' || char === '?' || char === '。' || char === '！' || char === '？') {
            // 处理英文缩写（如 e.g., i.e., etc., Mr., Dr. 等）
            if (char === '.') {
                // 检查是否是常见缩写
                const wordBeforeDot = getLastWord(currentSentence.slice(0, -1));
                const commonAbbreviations = new Set([
                    'e.g', 'i.e', 'etc', 'vs', 'mr', 'mrs', 'dr', 'prof', 'rev',
                    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
                    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
                    'st', 'ave', 'blvd', 'rd'
                ]);
                
                if (commonAbbreviations.has(wordBeforeDot.toLowerCase())) {
                    continue;
                }
                // 检查是否是数字（如 3.14）
                if (isNumericWord(wordBeforeDot)) {
                    continue;
                }
                // 检查是否是网址或邮箱
                if (isLikelyUrlOrEmail(currentSentence)) {
                    continue;
                }
            }
            // 检查下一个字符是否是引号或括号结束
            let shouldSplit = true;
            if (char === '.' || char === '!' || char === '?') {
                // 英文标点后通常是空格或结束，但如果是引号、括号等，也要分割
                if (nextChar === '"' || nextChar === "'" || nextChar === '”' || nextChar === ')') {
                    currentSentence += nextChar;
                    i++; // 跳过下一个字符
                }
            }
            if (shouldSplit) {
                const trimmedSentence = currentSentence.trim();
                if (trimmedSentence.length > 0) {
                    sentences.push(trimmedSentence);
                }
                currentSentence = '';
            }
        }
        // 处理换行符（如果当前句子有内容）
        else if (char === '\n' && currentSentence.trim().length > 1) {
            const trimmedSentence = currentSentence.trim();
            if (trimmedSentence.length > 0) {
                sentences.push(trimmedSentence);
            }
            currentSentence = '';
        }
    }
    // 处理最后剩余的句子
    if (currentSentence.trim().length > 0) {
        sentences.push(currentSentence.trim());
    }
    return sentences.filter(sentence => sentence.length > 0);
}


// 辅助函数：获取最后一个单词
function getLastWord(text: string): string {
    const words = text.split(/\s+/);
    return words[words.length - 1] || '';
}


// 辅助函数：检查是否是数字单词（处理小数等情况）
function isNumericWord(word: string): boolean {
    return /^\d*\.?\d+$/.test(word);
}


// 辅助函数：检查是否是网址或邮箱
function isLikelyUrlOrEmail(text: string): boolean {
    return text.includes('://') || text.includes('www.') || text.includes('@');
}




// 语言检测函数
export function detectLanguage(text: string): string {
    if (!text.trim()) return 'zh-CN';
    const result = franc(text, {
        minLength: 1,
        only: ['cmn', 'eng', 'jpn', 'kor']
    });
    const languageMap: { [key: string]: string } = {
        'cmn': 'zh-CN', // 中文
        'eng': 'en-US', // 英文
        'jpn': 'ja-JP', // 日文
        'kor': 'ko-KR', // 韩文
    };
    return languageMap[result] || 'zh-CN';
}



// 读取文本的语言
export async function getTextLanguage(text: string): Promise<string> {
    try {
        const detectedLang = detectLanguage(text);
        return detectedLang;
      } catch (error) {
        console.error('Language detection error:', error);
        return 'zh-CN'; // 默认返回中文
      }
}
