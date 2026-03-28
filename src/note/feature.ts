import { Note } from "./note_model";
import { NoteFeatures } from "./note_model";
import { defaultNoteFeatures } from "./note_model";
import { isContentEmpty } from "../utils/textUtils";
import { calculateWordCount } from "../utils/textUtils";
import { extractImageUrlsFromMarkdown } from "../utils/imageUtils";
import { noteToText } from "../convert/noteToText";
import CryptoJS from "crypto-js";



// 计算笔记的派生属性
export const determineNoteFeatures = (note: Note): NoteFeatures => {
    const features: NoteFeatures = { ...defaultNoteFeatures };
    features.hasTitle = !!note.title && note.title.trim() !== '';
    let contentFound = false;
    let htmlContent = '';
    let extractedImageUrls: string[] = [];
    if (note.html_text && !isContentEmpty(note.html_text)) {
        contentFound = true;
        htmlContent = note.html_text;
        features.wordCount = calculateWordCount(note.html_text);
        if (/<img[^>]+>/i.test(note.html_text)) {
            features.hasImages = true;
        }
    }
    if (note.markdown_text && note.markdown_text.trim() !== '') {
        contentFound = true;
        const markdownImageUrls = extractImageUrlsFromMarkdown(note.markdown_text);
        if (markdownImageUrls.length > 0) {
            features.hasImages = true;
            extractedImageUrls = [...extractedImageUrls, ...markdownImageUrls];
        }
    }
    if (note.imageNote) {
        contentFound = true;
        features.hasImages = true;
        if (note.imageNote.imageUrl) {
            extractedImageUrls.push(note.imageNote.imageUrl);
        } else if (note.imageNote.imageBase64) {
            extractedImageUrls.push(note.imageNote.imageBase64);
        }
    }
    if (Array.isArray(note.audio) && note.audio.length > 0) {
        contentFound = true;
    }
    features.hasContent = contentFound;
    features.hasTags = Array.isArray(note.tags) && note.tags.length > 0;
    features.summary = noteToText(note, false, false);
    features.images = [...new Set(extractedImageUrls)].filter(url => url && url.trim() !== '');
    if (!features.summary || features.summary.length < 10 || note.imageNote) {
        features.quizzable = false;
    }
    features.hash = calculateNoteHash(note) || '';
    return features;
};



export const calculateNoteHash = (note: Partial<Note>): string | null => {
    try {
        const contentParts: string[] = [];
        if (note.title && note.title.trim()) {
            contentParts.push(`title:${note.title.trim()}`);
        }
        if (note.markdown_text && note.markdown_text.trim()) {
            contentParts.push(`markdown:${note.markdown_text.trim()}`);
        }
        if (note.imageNote?.imageUrl) {
            contentParts.push(`imageUrl:${note.imageNote.imageUrl}`);
        } else if (note.imageNote?.imageBase64) {
            let base64Content = note.imageNote.imageBase64;
            const dataUrlMatch = base64Content.match(/^data:[^;]+;base64,(.+)$/);
            if (dataUrlMatch) {
                base64Content = dataUrlMatch[1];
            }
            const representativeContent = base64Content.substring(0, 500);
            contentParts.push(`imageBase64:${representativeContent}`);
        }
        // 包含图片笔记的 masks（遮盖区域）
        if (note.imageNote?.masks && note.imageNote.masks.length > 0) {
            const masksStr = JSON.stringify(note.imageNote.masks.map(m => ({
                x: m.x,
                y: m.y,
                width: m.width,
                height: m.height,
            })));
            contentParts.push(`imageMasks:${masksStr}`);
        }
        // 包含图片笔记的 maskSvg（SVG 遮罩数据）
        if (note.imageNote?.maskSvg && note.imageNote.maskSvg.trim()) {
            const svgContent = note.imageNote.maskSvg.trim().substring(0, 200);
            contentParts.push(`maskSvg:${svgContent}`);
        }
        if (contentParts.length === 0) {
            return null;
        }
        contentParts.sort();
        const combinedContent = contentParts.join('|');
        return CryptoJS.SHA256(combinedContent).toString();
    } catch (error) {
        console.error('Error calculating note hash:', error);
        return null;
    }
};

