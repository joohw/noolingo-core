// @/lib/import/opmlToNotes.ts
import { Note, createDefaultNote } from '../../note';
import { ConversionOptions, ConversionResult, FileConverter } from './types';
import { parse } from 'node-html-parser';
import { decodeBuffer } from '../../utils/encoding';

interface OpmlOutline {
    text: string;
    _note?: string;  // 幕布特有的备注字段
    children?: OpmlOutline[];
}

export async function opmlToNotes(
    buffer: ArrayBuffer,
    options: ConversionOptions = {}
): Promise<ConversionResult> {
    try {
        const text = await decodeBuffer(buffer);
        const doc = parse(text);
        const title = doc.querySelector('title')?.text.trim()
            || doc.querySelector('head title')?.text.trim()
            || options.defaultDeckName
            || '';
        const markdownContent = convertOpmlToMarkdown(doc);
        const note = createDefaultNote({
            title,
            markdown_text: markdownContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        return {
            notes: [note],
            deckName: title,
            stats: { total: 1, errors: 0 }
        };
    } catch (error) {
        console.error('OPML转换错误:', error);
        return {
            notes: [],
            deckName: options.defaultDeckName || '导入失败',
            stats: { total: 0, errors: 1 }
        };
    }
}



// 将OPML转换为markdown格式
function convertOpmlToMarkdown(doc: any): string {
    const body = doc.querySelector('body');
    if (!body) return '';
    const rootOutlines = parseOutlineElements(body.querySelectorAll(':scope > outline'));
    let md = '';
    rootOutlines.forEach(outline => { md += renderOutlineAsMarkdown(outline); });
    return md.trim();
}


//解析幕布的outline元素
function parseOutlineElements(elements: any[]): OpmlOutline[] {
    return Array.from(elements).map(el => {
        const rawText = el.getAttribute('mubu_text') || el.getAttribute('text') || '';
        const rawNote = el.getAttribute('mubu_note') || el.getAttribute('note') || '';
        const outline: OpmlOutline = {
            text: decodeURIComponent(rawText) || '',
            _note: decodeURIComponent(rawNote) || '',
        };
        const childOutlines = el.querySelectorAll(':scope > outline');
        if (childOutlines.length > 0) {
            outline.children = parseOutlineElements(childOutlines);
        }
        return outline;
    });
}



// 通过迭代将outline的每个元素渲染为markdown格式
function renderOutlineAsMarkdown(
    outline: OpmlOutline,
    level = 0
): string {
    const indent = '    '.repeat(level);
    let content = `${indent}- ${convertOpmlTextToMarkdown(outline.text)}\n`;
    if (outline._note && outline._note.trim()) {
        content += `${indent}  > ${convertOpmlTextToMarkdown(outline._note)}\n`;
    }
    if (outline.children) {
        outline.children.forEach(child => {
            content += renderOutlineAsMarkdown(child, level + 1);
        });
    }
    return content;
}




// 转换OPML文本为Markdown格式
function convertOpmlTextToMarkdown(text: string): string {
    if (!text) return '';
    
    let decoded = text;
    try {
        decoded = decodeURIComponent(text);
    } catch (e) {
        console.warn('URL解码失败:', e);
    }
    
    // 先处理HTML标签
    let result = decoded
        .replace(/<span class="bold">([^<]*)<\/span>/g, '**$1**')
        .replace(/<span class="underline">([^<]*)<\/span>/g, '__$1__')
        .replace(/<span class="bold underline">([^<]*)<\/span>/g, '**$1**')
        .replace(/<[^>]*>/g, '');

    result = result.replace(/\n/g, '  \n');
    
    return result;
}




export const opmlToNotesFromFile: FileConverter = opmlToNotes;