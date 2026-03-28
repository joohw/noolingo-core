// @/lib/import/markdownToNotes.ts

import { Note, createDefaultNote } from '../../note';
import { ConversionOptions, ConversionResult, FileConverter } from './types';
import { decodeBuffer } from '../../utils/encoding';
import { markdownToText } from '../markdownToText';


// 按三个或更多连续空行分割markdown文本
export function splitMarkdownByBlankLines(markdown: string): string[] {
    const blocks = markdown.trim().split(/\n{3,}/);
    return blocks.filter(block => block.trim().length > 0);
}


export const markdownToNotesFromFile: FileConverter = async (
    buffer: ArrayBuffer,
    options: ConversionOptions = {}
): Promise<ConversionResult> => {
    try {
        let markdown = await decodeBuffer(buffer);
        markdown = markdown.replace(/\r\n/g, '\n');
        // 如果启用了分割选项，按三个空行分割
        if (options.splitByBlankLines) {
            const blocks = splitMarkdownByBlankLines(markdown);
            const notes = blocks.map(block => markdownToNote(block, {
                ...options,
                useFirstLineAsTitle: true,
                includeTags: true,
            }));
            return {
                notes,
                deckName: options.defaultDeckName || 'Imported Notes',
                stats: {
                    total: notes.length,
                    errors: 0,
                }
            };
        }
        // 默认行为：整个文件作为一个笔记
        const note = markdownToNote(markdown, options);
        return {
            notes: [note],
            deckName: options.defaultDeckName || 'Imported Notes',
            stats: {
                total: 1,
                errors: 0,
            }
        };
    } catch (error) {
        console.error('Error converting markdown file:', error);
        return {
            notes: [],
            deckName: options.defaultDeckName || 'Imported Notes',
            stats: {
                total: 0,
                errors: 1,
            }
        };
    }
};


export const splitTags = (markdownText: string): { markdown: string, tags: string[] } => {
    const result = {
        markdown: markdownText.trim(),
        tags: [] as string[]
    };
    if (!markdownText) return result;
    const lines = markdownText.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine && /^#[\p{L}\p{N}_-]+/u.test(lastLine)) {
        result.tags = lastLine.split(/\s+/)
            .filter(word => word.startsWith('#'))
            .map(tag => {
                let cleanTag = tag.substring(1).trim();
                cleanTag = cleanTag.replace(/[.,;!?]$/, '');
                return cleanTag;
            })
            .filter(tag => tag.length > 0); // 过滤空标签
        result.markdown = lines.slice(0, -1).join('\n').trim();
    }
    return result;
};



// 将markdown文本转换成单个笔记对象
export function markdownToNote(
    markdown: string,
    options: ConversionOptions = {}
): Note {
    try {
        const lines = markdown.trim().split('\n');
        let title = options.defaultDeckName || '';
        let content = markdown;
        let tags: string[] = [];
        if (options.useFirstLineAsTitle && lines.length > 1) {
            title = markdownToText(lines[0].trim()); // todo：移除markdown语法
            content = lines.slice(1).join('\n').trim(); // 剩余内容作为正文
        }
        // 如果启用了标签解析，使用独立的splitTags函数
        if (options.includeTags) {
            const { markdown: processedContent, tags: extractedTags } = splitTags(content);
            content = processedContent;
            tags = extractedTags;
        }
        // 创建完整的笔记对象，保存原始markdown文本
        return createDefaultNote({
            title,
            markdown_text: content, // 直接保存处理后的markdown内容
            tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    } catch (e) {
        // 错误时也返回完整的笔记对象
        return createDefaultNote({
            title: options.defaultDeckName || '',
            markdown_text: markdown,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }
}



// 规范化空行：将3个或更多连续空行压缩为最多2个空行
const normalizeEmptyLines = (text: string): string => {
    return text.replace(/\n{3,}/g, '\n\n');
};


// 解析Markdown格式的笔记
export const markdownToNotes = (content: string): Note[] => {
    if (!content.trim()) return [];
    const noteTexts = content.trim().split(/\n{3,}/);
    const notes = noteTexts
        .map(block => normalizeEmptyLines(block.trim()))
        .filter(block => block.length > 0)
        .map(block => markdownToNote(block, {
            useFirstLineAsTitle: true,
            includeTags: true,
        }));
    return notes;
};
