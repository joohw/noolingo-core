// @/lib/convert/noteToMarkdown.ts


import { Note } from '../note';
import { htmlToMarkdown } from './htmlToMarkdown';



export function noteToMarkdown(
    note: Note,
    includeTitle: boolean = false,
    includeTags: boolean = false
): string {
    let markdown = '';
    if (note.markdown_text) {
        markdown = note.markdown_text;
    } else if (note.html_text) {
        markdown = htmlToMarkdown(note.html_text);
    }
    if (includeTitle && note.title) {
        markdown = `# ${note.title}\n${markdown}`;
    }
    if (includeTags && note.tags && note.tags.length > 0) {
        markdown = `${markdown}\n\n${note.tags.map(tag => `#${tag}`).join(' ')}`;
    }
    return markdown.trim();
}
