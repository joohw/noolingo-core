// @/lib/import/htmlToNotes.ts


import { Note, createDefaultNote } from '../../note';
import { ConversionOptions, ConversionResult, FileConverter } from './types';
import { htmlToMarkdown } from '../htmlToMarkdown';



export const htmlToNotesFromFile: FileConverter = async (
    buffer: ArrayBuffer,
    options: ConversionOptions = {}
): Promise<ConversionResult> => {
    const text = new TextDecoder().decode(buffer);
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const notes: Note[] = [];
    let deckName = 'Imported HTML';
    if ('filename' in options && typeof options.filename === 'string') {
        deckName = options.filename.replace(/\.[^/.]+$/, '');
    } else {
        // 否则尝试 h1 元素或 defaultDeckName
        const h1Element = doc.querySelector('h1');
        deckName = h1Element?.textContent?.trim() || options.defaultDeckName || deckName;
    }
    // 找到所有 note div
    const noteElements = doc.querySelectorAll('div.note');
    if (noteElements.length === 0) {
        const mainContent = doc.body?.innerHTML || '';
        notes.push(createDefaultNote({
            html_text: mainContent,
            title: '',
        }));
    } else {
        // 遍历每个 note div
        noteElements.forEach(noteDiv => {
            const titleElement = noteDiv.querySelector('.noolingo-title');
            const tagsElement = noteDiv.querySelector('.noolingo-tags');
            const title = titleElement?.textContent?.trim();
            const htmlContent = noteDiv.innerHTML;
            const markdownContent = htmlToMarkdown(htmlContent);
            const tags = tagsElement
                ? Array.from(tagsElement.querySelectorAll('.noolingo-tag'))
                    .map(tag => tag.textContent?.replace('#', '').trim())
                    .filter((tag): tag is string => tag !== undefined)
                : [];
            notes.push(createDefaultNote({
                title,
                html_text: htmlContent,
                markdown_text: markdownContent,
                tags
            }));
        });
    }

    return {
        notes,
        deckName,
        stats: {
            total: notes.length,
            errors: 0
        }
    };
};
