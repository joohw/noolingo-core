// @/lib/convert/noteToCsv.ts


import { Note } from '../note';
import { htmlToText } from './htmlToText';


export interface CsvFields {
    title: string;
    content: string;
    tags: string;
    created_at: string;
    updated_at: string;
    priority: number;
    stability: number;
}


// 将笔记转换为CSV格式的行数据
export function noteToCsv(note: Note): CsvFields {
    return {
        title: note.title || '',
        content: note.html_text ? htmlToText(note.html_text) : '',
        tags: note.tags?.join(',') || '',
        created_at: note.created_at || '',
        updated_at: note.updated_at || '',
        priority: note.color || 0,
        stability: note.recall?.stability || 0
    };
}


// 将多个笔记转换为CSV字符串
export function notesToCsvString(notes: Note[]): string {
    if (notes.length === 0) return '';
    const headers = [
        'title',
        'content',
        'tags',
        'created_at',
        'updated_at',
        'priority',
        'stability'
    ];
    const rows = notes.map(note => {
        const fields = noteToCsv(note);
        return headers.map(header => {
            const value = String(fields[header as keyof CsvFields])
                .replace(/"/g, '""');
            return /[,\n"]/.test(value) ? `"${value}"` : value;
        }).join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}
