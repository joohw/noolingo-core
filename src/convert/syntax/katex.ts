// @/lib/convert/syntax/katex.ts


import type MarkdownIt from 'markdown-it';
import katex from 'katex';

export function katexPlugin(md: MarkdownIt) {


    // 添加行内公式语法 $...$
    md.inline.ruler.push('math_inline', function (state, silent) {
        const start = state.pos;
        const max = state.posMax;
        if (state.src.charCodeAt(start) !== 0x24/* $ */) return false;
        let pos = start + 1;
        while (pos < max && state.src.charCodeAt(pos) !== 0x24/* $ */) {
            pos++;
        }
        if (pos === max) return false;
        if (!silent) {
            const token = state.push('math_inline', 'span', 0);
            token.content = state.src.slice(start + 1, pos);
            token.markup = '$';
        }
        state.pos = pos + 1;
        return true;
    });

    // 添加块级公式语法 $$...$$
    md.block.ruler.before('paragraph', 'math_block', function (state, startLine, endLine, silent) {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        if (state.src.charCodeAt(start) !== 0x24/* $ */ ||
            state.src.charCodeAt(start + 1) !== 0x24/* $ */) {
            return false;
        }
        let nextLine = startLine;
        let hasEndMarker = false;
        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) break;
            const start = state.bMarks[nextLine] + state.tShift[nextLine];
            if (state.src.charCodeAt(start) === 0x24/* $ */ &&
                state.src.charCodeAt(start + 1) === 0x24/* $ */) {
                hasEndMarker = true;
                break;
            }
        }
        if (!hasEndMarker) return false;
        if (silent) return true;
        const token = state.push('math_block', 'div', 0);
        token.content = state.src.slice(
            state.bMarks[startLine] + 2,
            state.bMarks[nextLine]
        ).trim();
        token.markup = '$$';
        state.line = nextLine + 1;
        return true;
    });


    // 渲染规则
    md.renderer.rules.math_inline = function (tokens, idx) {
        const token = tokens[idx];
        try {
            return katex.renderToString(token.content, {
                displayMode: false,
                throwOnError: false
            });
        } catch (e) {
            console.error('KaTeX rendering error:', e);
            return `<span class="katex-error">${token.content}</span>`;
        }
    };


    md.renderer.rules.math_block = function (tokens, idx) {
        const token = tokens[idx];
        try {
            return katex.renderToString(token.content, {
                displayMode: true,
                throwOnError: false
            });
        } catch (e) {
            console.error('KaTeX rendering error:', e);
            return `<div class="katex-error">${token.content}</div>`;
        }
    };
    
}
