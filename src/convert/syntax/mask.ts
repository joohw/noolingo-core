// @/lib/convert/syntax/mask.ts


import type MarkdownIt from 'markdown-it';
export function maskPlugin(md: MarkdownIt) {

    // 添加块级遮罩语法 {{{...}}}
    md.block.ruler.before('paragraph', 'block_mask', function (state, startLine, endLine, silent) {
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        // 检查开始标记 {{{
        if (state.src.charCodeAt(start) !== 0x7B/* { */ ||
            state.src.charCodeAt(start + 1) !== 0x7B/* { */ ||
            state.src.charCodeAt(start + 2) !== 0x7B/* { */) {
            return false;
        }
        let nextLine = startLine;
        let hasEndMarker = false;
        // 查找结束标记 }}}
        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) break;
            start = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];
            if (state.src.charCodeAt(start) === 0x7D/* } */ &&
                state.src.charCodeAt(start + 1) === 0x7D/* } */ &&
                state.src.charCodeAt(start + 2) === 0x7D/* } */) {
                hasEndMarker = true;
                break;
            }
        }
        if (!hasEndMarker) return false;
        // 不处理嵌套的情况
        if (silent) return true;
        let token = state.push('block_mask_open', 'div', 1);
        token.attrs = [['class', 'noolingo-block-mask']];
        token.map = [startLine, nextLine];
        // 处理内部内容
        state.md.block.tokenize(state, startLine + 1, nextLine);
        token = state.push('block_mask_close', 'div', -1);
        state.line = nextLine + 1;
        return true;
    });
    md.renderer.rules.block_mask_open = function () {
        return '<div class="noolingo-block-mask">';
    };


    // 添加遮罩语法 {{...}}
    md.inline.ruler.push('mask', function (state, silent) {
        const start = state.pos;
        const max = state.posMax;
        if (state.src.charCodeAt(start) !== 0x7B/* { */ ||
            state.src.charCodeAt(start + 1) !== 0x7B/* { */) return false;
        if (start > 0 && state.src.charCodeAt(start - 1) === 0x7B/* { */) {
            return false;
        }
        let pos = start + 2;
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x7D/* } */ &&
                state.src.charCodeAt(pos + 1) === 0x7D/* } */) {
                if (pos + 2 < max && state.src.charCodeAt(pos + 2) === 0x7D/* } */) {
                    return false;
                }
                break;
            }
            pos++;
        }
        if (pos === max) return false;
        if (!silent) {
            const token = state.push('mask', 'span', 0);
            token.attrs = [['class', 'noolingo-mask']];
            token.content = state.src.slice(start + 2, pos);
        }
        state.pos = pos + 2;
        return true;
    });
    md.renderer.rules.mask = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        // 解析遮盖内的内容为 tokens，让嵌套语法（如高亮）生效
        const content = token.content || '';
        // 使用 markdown-it 解析并渲染内容
        const html = md.renderInline(content);
        return `<span class="noolingo-mask">${html}</span>`;
    };
    md.renderer.rules.block_mask_close = function () {
        return '</div>';
    };
}
