import { Note } from ".";
import { validateRecall } from "../fsrs/recall";
import { defaultRecall } from "../fsrs/recall";
import { ColorLabel } from "./note_model";
import { determineNoteFeatures } from "./feature";
import { hasImage } from "./imageNote";



export const validateNote = (note: any): Note | null => {
    if (!note.id || note.id === '') {
      return null;
    }
    const created_at = note.created_at || new Date().toISOString();
    const validatedNote = {
      ...note,
      recall: validateRecall(note.recall || defaultRecall()),
      links: note.links || { to: [], from: [] },
      created_at: created_at,
      updated_at: note.updated_at || new Date().toISOString(),
      tags: Array.isArray(note.tags) ? note.tags : [],
      images: Array.isArray(note.images) ? note.images : [],
      audio: Array.isArray(note.audio) ? note.audio : [],
      path: Array.isArray(note.path) ? note.path : (note.path === null ? null : null),
      color: note.color || ColorLabel.GRAY,
      position: note.position !== null && note.position !== undefined ? note.position : new Date(created_at).getTime(),
      features: determineNoteFeatures({
        ...note,
        recall: note.recall || defaultRecall(),
        links: note.links || { to: [], from: [] },
        tags: Array.isArray(note.tags) ? note.tags : [],
        images: Array.isArray(note.images) ? note.images : [],
        audio: Array.isArray(note.audio) ? note.audio : []
      })
    };
    const isTitleEmpty = !validatedNote.title || validatedNote.title.trim() === '';
    const isHtmlEmpty = !validatedNote.html_text ||
      validatedNote.html_text.trim() === '' ||
      validatedNote.html_text.trim() === '<p></p>';
    const isMarkdownEmpty = !validatedNote.markdown_text ||
      validatedNote.markdown_text.trim() === '';
    const isImageNoteEmpty = !hasImage(validatedNote.imageNote);
    const isAudioEmpty = !validatedNote.audio || validatedNote.audio.length === 0;
    const isImagesEmpty = !validatedNote.images || validatedNote.images.length === 0;
    const isEmpty = isTitleEmpty &&
      isHtmlEmpty &&
      isMarkdownEmpty &&
      isImageNoteEmpty &&
      isAudioEmpty &&
      isImagesEmpty;
    if (isEmpty) {
      return null;
    }
    return validatedNote as Note;
  }



  // 验证导入的笔记
export const validateImportedNotes = (notes: any[]): Note[] => {
  return notes
    .map(note => {
      const hasTitle = note.title && note.title.trim() !== '';
      const hasMarkdown = note.markdown_text && note.markdown_text.trim() !== '';
      const hasImageNote = hasImage(note.imageNote);
      if (!hasTitle && !hasMarkdown && !hasImageNote) {
        return null;
      }
      const validatedNote: Partial<Note> = {
        id: note.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: note.title || '',
        markdown_text: note.markdown_text || null,
        html_text: note.html_text || null,
        deck_id: note.deck_id || null,
        tags: Array.isArray(note.tags) ? note.tags : [],
        imageNote: note.imageNote || null,
        audio: Array.isArray(note.audio) ? note.audio : [],
        created_at: note.created_at || new Date().toISOString(),
        updated_at: note.updated_at || new Date().toISOString(),
        last_quiz_at: note.last_quiz_at || null,
        starred: Boolean(note.starred),
        archived: Boolean(note.archived),
        color: note.color || ColorLabel.GRAY,
        position: note.position || null,
        unit: note.unit || null,
        path: Array.isArray(note.path) ? note.path : null,
        vector: Array.isArray(note.vector) ? note.vector : [],
        hash: note.hash || null,
        recall: note.recall || defaultRecall(),
        links: note.links || { to: [], from: [] },
      };
      // 确保计算 features
      validatedNote.features = determineNoteFeatures(validatedNote as Note);
      return validatedNote;
    })
    .filter((note): note is Note => note !== null);
};