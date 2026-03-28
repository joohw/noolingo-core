// @/utils/markdownTools.ts
// 基于AST快速操作Markdown内容

import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { remarkHighlight, remarkConceal } from './remarkPlugins';


interface Selection {
    start: number;
    end: number;
}

interface EditorState {
    content: string;
    selection: Selection;
}


// 检测格式状态
export const getActiveFormats = (content: string, selection: Selection): Set<string> => {
    const activeFormats = new Set<string>();
    if (selection.start !== selection.end) {
        return activeFormats;
    }
    const lineInfo = getCursorLineInfo(content, selection.start);
    if (!lineInfo) return activeFormats;
    try {
        const processor = createExtendedProcessor();
        const _processed = processor.parse(content);
        const ast = processor.runSync(_processed);
        const lineNumber = lineInfo.lineIndex + 1;
        const cursorInLine = lineInfo.offsetInLine;
        visit(ast, (node: any) => {
            if (!node.position) return;
            if (node.position.start.line <= lineNumber && node.position.end.line >= lineNumber) {
                const nodeFormatType = getExtendedFormatTypeFromNode(node);
                if (!nodeFormatType) return;
                if (node.position.start.line === lineNumber && node.position.end.line === lineNumber) {
                    const nodeStart = node.position.start.column - 1;
                    const nodeEnd = node.position.end.column - 1;
                    if (cursorInLine >= nodeStart && cursorInLine <= nodeEnd) {
                        activeFormats.add(nodeFormatType);
                    }
                } else {
                    activeFormats.add(nodeFormatType);
                }
            }
        });
        detectParagraphFormats(content, selection, activeFormats);
        return activeFormats;
    } catch (error) {
        console.error('❌ Remark format detection failed:', error);
        return activeFormats;
    }
};


export const addInlineFormat = (
    content: string,
    selection: Selection,
    formatType: string,
): EditorState => {
    const selectedText = content.substring(selection.start, selection.end);
    const markers = getMarkersByFormatType(formatType);
    if (!markers) {
        return { content, selection };
    }
    const { leftMarker, rightMarker } = markers;
    const formattedText = leftMarker + selectedText + rightMarker;
    const newContent =
        content.substring(0, selection.start) +
        formattedText +
        content.substring(selection.end);
    const newCursorStart = selection.start + leftMarker.length;
    const newCursorEnd = newCursorStart + selectedText.length;
    return {
        content: newContent,
        selection: {
            start: newCursorStart,
            end: newCursorEnd
        }
    };
};


export const selectFormat = (
    content: string,
    selection: Selection,
    formatType: string
): EditorState => {
    try {
        const processor = createExtendedProcessor();
        const ast = processor.parse(content);
        const lineInfo = getCursorLineInfo(content, selection.start);
        if (!lineInfo) {
            return { content, selection };
        }
        const lineNumber = lineInfo.lineIndex + 1;
        const cursorInLine = lineInfo.offsetInLine;
        let targetNode: any = null;
        visit(ast, (node: any) => {
            if (!node.position) return;
            const nodeFormatType = getExtendedFormatTypeFromNode(node);
            if (nodeFormatType !== formatType) return;
            const nodeStartLine = node.position.start.line;
            const nodeEndLine = node.position.end.line;
            const nodeStartCol = node.position.start.column - 1;
            const nodeEndCol = node.position.end.column - 1;
            if (nodeStartLine <= lineNumber && nodeEndLine >= lineNumber) {
                if (nodeStartLine === lineNumber && nodeEndLine === lineNumber) {
                    if (cursorInLine >= nodeStartCol && cursorInLine <= nodeEndCol) {
                        targetNode = node;
                    }
                } else {
                    if (nodeStartLine === lineNumber && cursorInLine >= nodeStartCol) {
                        targetNode = node;
                    } else if (nodeEndLine === lineNumber && cursorInLine <= nodeEndCol) {
                        targetNode = node;
                    }
                }
            }
        });
        if (!targetNode) {
            return { content, selection };
        }
        const formatStart = targetNode.position.start.offset;
        const formatEnd = targetNode.position.end.offset;
        return {
            content,
            selection: {
                start: formatStart,
                end: formatEnd
            }
        };
    } catch (error) {
        console.error(`❌ AST-based format selection failed for ${formatType}:`, error);
        return { content, selection };
    }
};


// 移除行内格式（粗体、斜体、高亮、遮盖等）


export const removeInlineFormat = (
    content: string,
    selection: Selection,
    formatType: string,
): EditorState => {
    const markers = getMarkersByFormatType(formatType);
    if (!markers) {
        return { content, selection };
    }
    const { leftMarker, rightMarker } = markers;
    const cursorPos = selection.start;
    // 搜索范围：向前向后各搜索一定距离
    const searchRange = 500;
    const searchStart = Math.max(0, cursorPos - searchRange);
    const searchEnd = Math.min(content.length, cursorPos + searchRange);
    const searchText = content.substring(searchStart, searchEnd);
    const relativeCursorPos = cursorPos - searchStart;
    // 向后搜索左标记（开始标记）：从光标位置向前搜索
    let leftMarkerPos = -1;
    for (let i = relativeCursorPos; i >= 0; i--) {
        if (searchText.substring(i, i + leftMarker.length) === leftMarker) {
            leftMarkerPos = searchStart + i;
            break;
        }
    }
    // 向前搜索右标记（闭合标记）：从光标位置向后搜索
    let rightMarkerPos = -1;
    if (leftMarkerPos !== -1) {
        // 从左标记之后开始搜索右标记
        const afterLeftMarker = leftMarkerPos + leftMarker.length;
        const searchEndForRight = Math.min(content.length, afterLeftMarker + searchRange);
        const textAfterLeft = content.substring(afterLeftMarker, searchEndForRight);
        const rightMarkerIndex = textAfterLeft.indexOf(rightMarker);
        if (rightMarkerIndex !== -1) {
            rightMarkerPos = afterLeftMarker + rightMarkerIndex + rightMarker.length;
        }
    } else {
        // 如果没找到左标记，从光标位置向后搜索右标记
        for (let i = relativeCursorPos; i < searchText.length; i++) {
            if (searchText.substring(i, i + rightMarker.length) === rightMarker) {
                rightMarkerPos = searchStart + i + rightMarker.length;
                // 找到了右标记，再向前搜索左标记
                const beforeRightMarker = searchStart + i;
                for (let j = beforeRightMarker; j >= 0; j--) {
                    if (content.substring(j, j + leftMarker.length) === leftMarker) {
                        const innerContent = content.substring(j + leftMarker.length, beforeRightMarker);
                        if (innerContent.length > 0) {
                            leftMarkerPos = j;
                            break;
                        }
                    }
                }
                break;
            }
        }
    }
    // 如果找到了匹配的标记对，且光标在标记对范围内，移除它们
    if (leftMarkerPos !== -1 && rightMarkerPos !== -1 && leftMarkerPos < rightMarkerPos) {
        // 检查光标是否在标记对范围内（包括边界）
        if (cursorPos >= leftMarkerPos && cursorPos <= rightMarkerPos) {
            const innerContent = content.substring(leftMarkerPos + leftMarker.length, rightMarkerPos - rightMarker.length);
            const newContent =
                content.substring(0, leftMarkerPos) +
                innerContent +
                content.substring(rightMarkerPos);
            const newCursorPos = leftMarkerPos + innerContent.length;
            return {
                content: newContent,
                selection: {
                    start: newCursorPos,
                    end: newCursorPos
                }
            };
        }
    }
    // 如果没有找到匹配的标记，返回原内容
    return { content, selection };
};


// 移除段落格式（标题、列表、引用等）
export const removeParagraphFormat = (
    content: string,
    selection: Selection,
    formatType: string
): EditorState => {
    // 段落格式的移除使用 applyParagraphFormat，因为它会切换格式状态
    return applyParagraphFormat(content, selection, formatType);
};


export const applyParagraphFormat = (
    content: string,
    selection: Selection,
    formatType: string
): EditorState => {
    const lineInfo = getCursorLineInfo(content, selection.start);
    if (!lineInfo) return { content, selection };
    const currentLine = lineInfo.lineText;
    let newLine: string;
    let cleanedLine = currentLine;
    cleanedLine = cleanedLine.replace(/^#+\s/, '');
    if (cleanedLine.startsWith('- ')) {
        cleanedLine = cleanedLine.substring(2);
    }
    else if (cleanedLine.match(/^\d+\. /)) {
        cleanedLine = cleanedLine.replace(/^\d+\. /, '');
    }
    else if (cleanedLine.startsWith('> ')) {
        cleanedLine = cleanedLine.substring(2);
    }
    if (formatType.startsWith('heading-')) {
        const level = parseInt(formatType.split('-')[1]);
        const headingPrefix = '#'.repeat(level) + ' ';
        const currentHeadingMatch = currentLine.match(/^(#+)\s/);
        if (currentHeadingMatch && currentHeadingMatch[1].length === level) {
            newLine = cleanedLine; // 移除相同级别的标题
        } else {
            newLine = headingPrefix + cleanedLine; // 添加新级别的标题
        }
    } else {
        const prefixes = {
            bullet: '- ',
            numbered: '1. ',
            blockquote: '> '
        };
        const prefix = prefixes[formatType as keyof typeof prefixes];
        if (formatType === 'numbered') {
            if (currentLine.match(/^\d+\. /)) {
                newLine = cleanedLine; // 已经移除了数字前缀
            } else {
                // 检测前一行是否是有序列表项，如果是则递增编号
                let nextNumber = 1;
                if (lineInfo.lineIndex > 0) {
                    const lines = content.split('\n');
                    // 向前查找最近的有序列表项
                    for (let i = lineInfo.lineIndex - 1; i >= 0; i--) {
                        const prevLine = lines[i];
                        const numberedMatch = prevLine.match(/^(\d+)\.\s+/);
                        if (numberedMatch) {
                            // 找到前一个有序列表项，编号加1
                            nextNumber = parseInt(numberedMatch[1]) + 1;
                            break;
                        } else if (prevLine.trim() === '') {
                            // 空行，继续查找（有序列表可能被空行分隔）
                            continue;
                        } else if (prevLine.match(/^[-*+]\s/)) {
                            // 无序列表，继续查找（可能混合列表）
                            continue;
                        } else if (prevLine.match(/^>\s/)) {
                            // 引用，继续查找
                            continue;
                        } else if (prevLine.match(/^#+\s/)) {
                            // 标题，继续查找
                            continue;
                        } else {
                            // 遇到普通文本，停止查找，从1开始
                            break;
                        }
                    }
                }
                newLine = `${nextNumber}. ` + cleanedLine;
            }
        } else {
            if (currentLine.startsWith(prefix)) {
                newLine = cleanedLine; // 已经移除了该前缀
            } else {
                newLine = prefix + cleanedLine; // 添加该前缀
            }
        }
    }
    const newContent =
        content.substring(0, lineInfo.lineStartPos) +
        newLine +
        content.substring(lineInfo.lineEndPos);
    const newCursorPos = lineInfo.lineStartPos + newLine.length;
    return {
        content: newContent,
        selection: { start: newCursorPos, end: newCursorPos }
    };
};


export const isListActive = (content: string, selection: Selection, listType: 'bullet' | 'numbered'): boolean => {
    const lineInfo = getCursorLineInfo(content, selection.start);
    if (!lineInfo) return false;
    try {
        const processor = remark();
        const ast = processor.parse(content);
        let inList = false;
        let listStyle: 'bullet' | 'ordered' | null = null;
        visit(ast, ['list', 'listItem'], (node: any) => {
            if (!node.position) return;
            const lineNumber = lineInfo.lineIndex + 1;
            if (node.position.start.line <= lineNumber && node.position.end.line >= lineNumber) {
                inList = true;
                if (node.type === 'list') {
                    listStyle = node.ordered ? 'ordered' : 'bullet';
                }
            }
        });
        return inList && ((listType === 'bullet' && listStyle === 'bullet') ||
            (listType === 'numbered' && listStyle === 'ordered'));
    } catch (error) {
        console.error('List detection failed:', error);
        return false;
    }
};


export const isBlockquoteActive = (content: string, selection: Selection): boolean => {
    const lineInfo = getCursorLineInfo(content, selection.start);
    if (!lineInfo) return false;
    try {
        const processor = remark();
        const ast = processor.parse(content);
        let inBlockquote = false;
        visit(ast, 'blockquote', (node: any) => {
            if (!node.position) return;
            const lineNumber = lineInfo.lineIndex + 1;
            if (node.position.start.line <= lineNumber && node.position.end.line >= lineNumber) {
                inBlockquote = true;
            }
        });
        return inBlockquote;
    } catch (error) {
        console.error('Blockquote detection failed:', error);
        return false;
    }
};



const getExtendedFormatTypeFromNode = (node: any): string | null => {
    switch (node.type) {
        case 'strong':
            return 'bold';
        case 'emphasis':
            return 'italic';
        case 'inlineCode':
            return 'code';
        case 'highlight':
            return 'highlight';
        case 'delete':
            return 'strikethrough';
        case 'conceal':
            return 'conceal';
        case 'heading':
            return `heading-${node.depth}`;
        case 'text':
        case 'paragraph':
        case 'root':
            return null;
        case 'image':
            return 'image'; // 添加图片格式检测
        default:
            return null;
    }
};


const getMarkersByFormatType = (formatType = ''): { leftMarker: string; rightMarker: string } | null => {
    switch (formatType) {
        case 'bold':
            return { leftMarker: '**', rightMarker: '**' };
        case 'italic':
            return { leftMarker: '*', rightMarker: '*' };
        case 'code':
            return { leftMarker: '`', rightMarker: '`' };
        case 'highlight':
            return { leftMarker: '==', rightMarker: '==' }; // 常见的高亮语法
        case 'conceal':
            return { leftMarker: '{{', rightMarker: '}}' }; // 常见的隐藏/剧透语法
        case 'link':
            return { leftMarker: '[[', rightMarker: ']]' }; // wikilink 格式
        default:
            return null;
    }
};


const createExtendedProcessor = () => {
    const processor = remark()
        .use(remarkHighlight)
        .use(remarkConceal);
    return processor;
};


const getCursorLineInfo = (content: string, cursorPosition: number) => {
    const lines = content.split('\n');
    let currentPos = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLength = line.length + 1; // +1 for newline
        if (cursorPosition >= currentPos && cursorPosition <= currentPos + lineLength) {
            const offsetInLine = cursorPosition - currentPos;
            return {
                lineIndex: i,
                lineText: line,
                offsetInLine,
                lineStartPos: currentPos,
                lineEndPos: currentPos + line.length
            };
        }
        currentPos += lineLength;
    }
    return null;
};


const detectParagraphFormats = (content: string, selection: Selection, activeFormats: Set<string>) => {
    try {
        const processor = remark();
        const fullAst = processor.parse(content);
        const lineInfo = getCursorLineInfo(content, selection.start);
        if (!lineInfo) return;
        const lineNumber = lineInfo.lineIndex + 1; // remark 行号从 1 开始
        visit(fullAst, 'list', (node: any) => {
            if (!node.ordered && node.position &&
                node.position.start.line <= lineNumber &&
                node.position.end.line >= lineNumber) {
                activeFormats.add('bullet');
            }
        });
        visit(fullAst, 'list', (node: any) => {
            if (node.ordered && node.position &&
                node.position.start.line <= lineNumber &&
                node.position.end.line >= lineNumber) {
                activeFormats.add('numbered');
            }
        });
        visit(fullAst, 'blockquote', (node: any) => {
            if (node.position &&
                node.position.start.line <= lineNumber &&
                node.position.end.line >= lineNumber) {
                activeFormats.add('blockquote');
            }
        });
    } catch (error) {
        console.error('Paragraph format detection failed:', error);
    }
};
