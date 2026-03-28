// @/lib/convert/noteToJson.ts


import { Note } from '../note';


export function noteToJson(note: Note): any {
    return {
        title: note.title,
        unit: note.unit,
        html_text: note.html_text,
        markdown_text: note.markdown_text,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        audio: note.audio,
        recall: note.recall,
        hash: note.hash,
        vector: note.vector,
        links: note.links,
        imageNote: note.imageNote || undefined
    };
}
