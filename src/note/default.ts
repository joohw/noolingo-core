// @/core/note/default.ts
// 创建默认笔记

import { Note, defaultNoteFeatures, ColorLabel } from "./note_model";
import { defaultRecall } from "../fsrs/recall";
import { determineNoteFeatures } from "./feature";


export const createDefaultNote = (partialNote: Partial<Note> = {}): Note => {
    const now = Date.now();
    const isoString = new Date(now).toISOString();
    const baseNote: Note = {
        id: '',
        deck_id: null,
        created_at: isoString,
        updated_at: isoString,
        last_quiz_at: null,
        next_quiz_at: null,
        title: '',
        unit: null,
        html_text: null,
        markdown_text: null,
        position: now,
        imageNote: null,
        audio: [],
        tags: [],
        starred: false,
        vector: [],
        hash: null,
        path: null,
        archived: false,
        color: ColorLabel.GRAY,
        features: defaultNoteFeatures,
        recall: defaultRecall(),
        links: {
            to: [],
            from: []
        }
    };
    const mergedNote = { ...baseNote, ...partialNote };
    mergedNote.features = determineNoteFeatures(mergedNote);
    return mergedNote;
};
