// @/lib/convert/noteToText.ts



import { markdownToText } from './markdownToText';
import { htmlToText } from './htmlToText';


//从Markdown文本中提取代码块
function extractCodeFromMarkdown(markdown: string): string[] {
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  const codeBlocks: string[] = [];
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push(match[1].trim());
  }
  if (codeBlocks.length === 0) {
    while ((match = inlineCodeRegex.exec(markdown)) !== null) {
      codeBlocks.push(match[1].trim());
    }
  }
  return codeBlocks;
}



// 从HTML中提取代码块
function extractCodeFromHtml(html: string): string[] {
  const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
  const inlineCodeRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  const codeBlocks: string[] = [];
  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const decodedCode = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    codeBlocks.push(decodedCode.trim());
  }
  if (codeBlocks.length === 0) {
    while ((match = inlineCodeRegex.exec(html)) !== null) {
      const decodedCode = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      codeBlocks.push(decodedCode.trim());
    }
  }
  return codeBlocks;
}



//将笔记转换为纯文本，可选择包含代码块
export function noteToText(
  note: any,
  includeTitle = true,
  includeTags = true,
  includeContent = true,
): string {
  let text = '';
  if (note.title && includeTitle) {
    text += note.title + '\n';
  }
  if (includeContent) {
    let contentText = '';
    let codeBlocks: string[] = [];
    if (note.markdown_text) {
      codeBlocks = extractCodeFromMarkdown(note.markdown_text);
      contentText = markdownToText(note.markdown_text);
    } else if (note.html_text) {
      codeBlocks = extractCodeFromHtml(note.html_text);
      contentText = htmlToText(note.html_text);
    }
    if (contentText) {
      if (text) {
        text += '\n';
      }
      text += contentText;
    }
    if ((!contentText || contentText.trim().length < 30) && codeBlocks.length > 0) {
      text += '\n' + codeBlocks.join('\n\n');
    }
  }
  if (note.tags && note.tags.length > 0 && includeTags) {
    text += '\n' + note.tags.join(' ');
  }
  return text.trim();
}
