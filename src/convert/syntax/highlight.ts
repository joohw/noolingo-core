// @/lib/convert/syntax/highlight.ts


import type MarkdownIt from 'markdown-it';


export function highlightPlugin(md: MarkdownIt) {

    
    // 添加高亮语法 ==...==
    md.inline.ruler.push('highlight', function (state, silent) {
        const start = state.pos;
        const max = state.posMax;
        // 检查开始标记
        if (state.src.charCodeAt(start) !== 0x3D/* = */ ||
            state.src.charCodeAt(start + 1) !== 0x3D/* = */) return false;
        let pos = start + 2;
        // 查找结束标记
        while (pos < max) {
            // 找到结束标记
            if (state.src.charCodeAt(pos) === 0x3D/* = */ &&
                state.src.charCodeAt(pos + 1) === 0x3D/* = */) {
                break;
            }
            // 如果遇到换行符，表示这不是有效的高亮标记
            // 因为高亮是行内元素，不应该跨行
            if (state.src.charCodeAt(pos) === 0x0A) {
                return false;
            }
            pos++;
        }
        // 没找到结束标记，不是有效的高亮
        if (pos >= max - 1) return false;
        if (!silent) {
            const token = state.push('highlight', 'mark', 0);
            token.attrs = [['class', 'noolingo-highlight']];
            token.content = state.src.slice(start + 2, pos);
        }
        state.pos = pos + 2;
        return true;
    });

    
    md.renderer.rules.highlight = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        // 解析高亮内的内容为 tokens，让嵌套语法（如加粗）生效
        const content = token.content || '';
        // 使用 markdown-it 解析并渲染内容，然后提取 HTML（去除外层的 <p> 标签）
        const html = md.renderInline(content);
        return `<mark class="noolingo-highlight">${html}</mark>`;
    };
}
