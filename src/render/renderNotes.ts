// 渲染多篇笔记为html

import { RenderOptions, renderNote } from "./renderNote";
import { Note } from "../note/note_model";



export const renderNotes = async (notes: Note[], options: RenderOptions = {}, showDivider = true): Promise<string> => {
    const notesContent = await Promise.all(
        notes.map(async (note, index) => {
            const content = await renderNote(note, options);
            const divider = showDivider && index !== notes.length - 1
                ? '<div class="note-divider"></div>'
                : '';
            return content + divider;
        })
    );
    return `
        <div class="notes-container">
            ${notesContent.join('\n')}
        </div>
    `;
}