// @/lib/convert/noteToHtml.ts


import { Note } from '../note';
import { markdownToHtml } from './markdownToHtml';
import { getImageUri, hasImage } from '../note/imageNote';


export function noteToHtml(note: Note, includeTitle = true, includeTags = true): string {
    const titleHtml = includeTitle && note.title
        ? `<h2 class="noolingo-title">${note.title}</h2>`
        : '';
    let contentHtml = '';
    if (hasImage(note.imageNote)) {
        const imageUrl = getImageUri(note.imageNote);
        contentHtml = `
            <div class="note-image-container" style="
                width: 100%;
                max-width: 640px;
                margin: 0 auto;
                padding: 0;
                box-sizing: border-box;
            ">
                <div class="image-wrapper" style="
                    position: relative; 
                    display: inline-block;
                    width: 100%;
                    overflow: hidden;
                    background-color: #f5f5f5;
                ">
                    <img 
                        src="${imageUrl}"
                        class="note-image"
                        style="
                            width: 100%;
                            height: auto;
                            display: block;
                            object-fit: cover;
                            margin: 0;
                            padding: 0;
                        "
                        alt="Note image"
                    />
                </div>
            </div>
        `;
    } else if (note.html_text) {
        contentHtml = `<div class="noolingo-content">${note.html_text}</div>`;
    } else {
        contentHtml = markdownToHtml(note.markdown_text || '');
    }
    const tagsHtml = includeTags && note.tags?.length
        ? `<div class="noolingo-tags">${note.tags.map(tag =>
            `<span class="noolingo-tag">#${tag}</span>`
        ).join(' ')}</div>`
        : '';
    return `<div class="note">${titleHtml}${contentHtml}${tagsHtml}</div>`.trim();
}
