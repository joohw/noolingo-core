// @/lib/render/renderNote.ts

import { markdownToHtml } from '../convert/markdownToHtml';
import { Note } from '../note/note_model';
import { parse, HTMLElement } from 'node-html-parser';
import { stripOldCssStyles } from '../utils/strip';
import { MaskOptions, DEFAULT_MASK_OPTIONS } from '../types/setting';
import { addMaskClass, fixSvgNamespace } from '../utils/renderUtils';
import indicesService from '../services/indices.service';


// 笔记的渲染选项
export interface RenderOptions {
  initiallyHidden?: boolean;
  maskOptions?: MaskOptions; // 闪卡选项
  showReferences?: boolean; // 是否显示引用信息，默认为 false
}


export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  initiallyHidden: false,
  maskOptions: DEFAULT_MASK_OPTIONS,
  showReferences: false
};


export const renderNote = async (note: Note, options: RenderOptions = {}): Promise<string> => {

  const mergedOptions = {
    ...DEFAULT_RENDER_OPTIONS,
    ...options,
    maskOptions: {
      ...DEFAULT_MASK_OPTIONS,
      ...options.maskOptions,
    }
  };

  const {
    initiallyHidden = false,
    maskOptions = DEFAULT_MASK_OPTIONS,
    showReferences = false
  } = mergedOptions;

  const {
    hideTitle = false,
    hideContent: maskHideContent = false,
    enableHighlightedTextMask = true,
    enableBoldTextMask = true,
    enableSyntaxMask = true
  } = maskOptions;

  // 1. 创建基础容器
  const root = parse('<div class="noolingo-content"></div>');
  const contentContainer = root.querySelector('.noolingo-content')!;

  // 2. 添加标题元素
  if (note.title && note.title.trim() !== '') {
    const titleElement = parse(`<h1 class="note-title">${note.title}</h1>`).querySelector('h1')!;
    contentContainer.appendChild(titleElement);
  }

  // 3. 添加imageNote或content元素
  if (note.imageNote) {
    let imageUrl = note.imageNote.imageUrl || note.imageNote.imageBase64;
    const maskElements = note.imageNote.masks ? note.imageNote.masks.map((mask, index) => {
      const maskClass = initiallyHidden ? 'content-mask' : 'content-mask-off';
      return `
        <div 
          class="note-image-mask ${maskClass} clickable-mask" 
          data-mask-index="${index}"
          style="
            position: absolute;
            left: ${mask.x}%;
            top: ${mask.y}%;
            width: ${mask.width}%;
            height: ${mask.height}%;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10;
            user-select: none;
            -webkit-user-select: none;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 12px;
            font-weight: 600;
            color: white;
          "
        >
          ${initiallyHidden && !initiallyHidden ? index + 1 : ''}
        </div>
      `;
    }).join('') : '';

    const svgMask = initiallyHidden && note.imageNote.maskSvg ? `
      <div style="
        position: absolute; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        z-index: 5;
        pointer-events: none;
      ">
        ${fixSvgNamespace(note.imageNote.maskSvg)}
      </div>
    ` : '';

    const imageContent = `
      <div class="note-image-container" style="
        width: 100%;
        max-width: 640px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="image-wrapper" style="
          position: relative; 
          display: inline-block;
          width: 100%;
          overflow: hidden;
          background-color: var(--surface-variant, #f5f5f5);
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
          ${maskElements}
          ${svgMask}
        </div>
      </div>
    `;
    const imageRoot = parse(imageContent);
    const imageContainer = imageRoot.querySelector('.note-image-container')!;
    contentContainer.appendChild(imageContainer);
  } else if (note.markdown_text) {
    const markdownContent = markdownToHtml(note.markdown_text);
    const contentRoot = parse(markdownContent);
    // 将解析后的所有子节点添加到容器中
    contentRoot.childNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        contentContainer.appendChild(node);
      }
    });
  } else if (note.html_text) {
    const htmlContent = stripOldCssStyles(note.html_text);
    const contentRoot = parse(htmlContent);
    // 将解析后的所有子节点添加到容器中
    contentRoot.childNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        contentContainer.appendChild(node);
      }
    });
  }

  // 4. 应用遮罩（标题遮罩、内容遮罩、高亮遮罩、加粗遮罩、语法遮罩）
  const hasTitle = Boolean(note.title?.trim());
  const titleElement = hasTitle ? root.querySelector('h1.note-title') : null;
  const hasImageNote = Boolean(note.imageNote);

  // 标题遮罩
  if (hideTitle && titleElement) {
    addMaskClass(titleElement, initiallyHidden);
  }

  // 内容遮罩（仅对非 imageNote 的笔记应用）
  if (maskHideContent && !hasImageNote) {
    const contentElements = Array.from(contentContainer.childNodes).filter(
      node => node instanceof HTMLElement
    ) as HTMLElement[];
    const paragraphBlocks: HTMLElement[] = [];
    contentElements.forEach(node => {
      if (node instanceof HTMLElement) {
        // 排除标题元素（标题有单独的遮罩处理）
        if (node.classList.contains('note-title')) {
          return;
        }
        if (['p', 'li', 'tr', 'blockquote', 'pre', 'table', 'ul', 'img', 'ol'].includes(node.tagName?.toLowerCase())) {
          paragraphBlocks.push(node);
        }
        else if (node.tagName?.match(/^h[1-6]$/i)) {
          paragraphBlocks.push(node);
        }
        else {
          const innerBlocks = node.querySelectorAll('p, li, tr, blockquote, div, pre, h1, h2, h3, h4, h5, h6');
          // 排除标题元素
          const filteredBlocks = Array.from(innerBlocks).filter(block => {
            if (block instanceof HTMLElement) {
              return !block.classList.contains('note-title');
            }
            return true;
          });
          if (filteredBlocks.length > 0) {
            paragraphBlocks.push(...(filteredBlocks as HTMLElement[]));
          } else {
            paragraphBlocks.push(node);
          }
        }
      }
    });
    paragraphBlocks.forEach(block => {
      if (!block.closest('.content-mask, .content-mask-off')) {
        addMaskClass(block, initiallyHidden);
      }
    });
  }

  // 文本相关的遮罩（仅对非 imageNote 的笔记应用）
  if (!hasImageNote) {
    if (enableHighlightedTextMask) {
      root.querySelectorAll('mark').forEach((mark: HTMLElement) => {
        if (!mark.closest('.content-mask, .content-mask-off')) {
          mark.classList.add('noolingo-highlight');
          addMaskClass(mark, initiallyHidden);
        }
      });
    }

    // 对加粗内容应用遮盖
    if (enableBoldTextMask) {
      root.querySelectorAll('strong').forEach((strong: HTMLElement) => {
        if (!strong.closest('.content-mask, .content-mask-off')) {
          addMaskClass(strong, initiallyHidden);
        }
      });
    }

    if (enableSyntaxMask) {
      root.querySelectorAll('span.noolingo-mask').forEach((mask: HTMLElement) => {
        if (!mask.closest('.content-mask, .content-mask-off')) {
          addMaskClass(mask, initiallyHidden);
        }
      });
      root.querySelectorAll('.noolingo-block-mask').forEach((block: HTMLElement) => {
        if (!block.closest('.content-mask, .content-mask-off')) {
          addMaskClass(block, initiallyHidden);
        }
      });
    }
  }

  // 5. 最后添加引用信息（引出和引入），避免被遮罩影响
  if (showReferences) {
    const hasToLinks = note.links?.to && note.links.to.length > 0;
    const hasFromLinks = note.links?.from && note.links.from.length > 0;
    
    if (hasToLinks || hasFromLinks) {
    const referencesHtml = `
      <div class="note-references">
        ${hasToLinks ? `
          <div class="note-references-list">
            ${note.links.to.map((noteId) => {
              const refNote = indicesService.getNoteById(noteId);
              const displayText = refNote?.features?.summary || refNote?.title || noteId;
              return `
                <div class="note-reference-item" data-note-id="${noteId}">
                  <span class="note-reference-icon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 10L10 2M10 2H6M10 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="note-reference-text">${displayText}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
        ${hasFromLinks ? `
          <div class="note-references-list">
            ${note.links.from.map((noteId) => {
              const refNote = indicesService.getNoteById(noteId);
              const displayText = refNote?.features?.summary || refNote?.title || noteId;
              return `
                <div class="note-reference-item" data-note-id="${noteId}">
                  <span class="note-reference-icon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 2L10 10M10 10H6M10 10V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="note-reference-text">${displayText}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
      const referencesRoot = parse(referencesHtml);
      const referencesContainer = referencesRoot.querySelector('.note-references')!;
      contentContainer.appendChild(referencesContainer);
    }
  }

  const finalContent = root.toString();
  return finalContent;
}

export default renderNote;