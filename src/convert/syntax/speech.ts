// @/lib/convert/syntax/speech.ts


import type MarkdownIt from 'markdown-it';

export function speechPlugin(md: MarkdownIt) {


    // 添加块级语音语法 ^^^...^^^
    md.block.ruler.before('paragraph', 'block_speech', function (state, startLine, endLine, silent) {
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        // 检查开始标记 ^^^
        if (state.src.charCodeAt(start) !== 0x5E/* ^ */ ||
            state.src.charCodeAt(start + 1) !== 0x5E/* ^ */ ||
            state.src.charCodeAt(start + 2) !== 0x5E/* ^ */) {
            return false;
        }
        let nextLine = startLine;
        let hasEndMarker = false;
        let content = '';
        content = state.src.slice(state.bMarks[startLine] + 3, state.eMarks[startLine]) + '\n';
        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) break;
            start = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];
            if (state.src.charCodeAt(start) === 0x5E/* ^ */ &&
                state.src.charCodeAt(start + 1) === 0x5E/* ^ */ &&
                state.src.charCodeAt(start + 2) === 0x5E/* ^ */) {
                hasEndMarker = true;
                break;
            }
            content += state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]) + '\n';
        }
        if (!hasEndMarker) return false;
        if (silent) return true;
        let token = state.push('block_speech_open', 'div', 1);
        token.attrs = [
            ['class', 'noolingo-speech'],
            ['data-text', content.trim()]
        ];
        token.map = [startLine, nextLine];
        state.md.block.tokenize(state, startLine + 1, nextLine);
        // 创建结束标记
        token = state.push('block_speech_close', 'div', -1);
        state.line = nextLine + 1;
        return true;
    });



    // 添加行内语音语法 ^^...^^
    md.inline.ruler.push('speech', function (state, silent) {
        const start = state.pos;
        const max = state.posMax;
        if (state.src.charCodeAt(start) !== 0x5E/* ^ */ ||
            state.src.charCodeAt(start + 1) !== 0x5E/* ^ */) return false;
        let pos = start + 2;
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x5E/* ^ */ &&
                state.src.charCodeAt(pos + 1) === 0x5E/* ^ */) {
                break;
            }
            pos++;
        }
        if (pos === max) return false;
        if (!silent) {
            const content = state.src.slice(start + 2, pos);
            const token = state.push('speech', 'span', 0);
            token.attrs = [
                ['class', 'noolingo-speech'],
                ['data-text', content]
            ];
            token.content = content;
        }
        state.pos = pos + 2;
        return true;
    });

    // 渲染规则
    md.renderer.rules.block_speech_open = function (tokens, idx) {
        const token = tokens[idx];
        if (!token.attrs) return '<div class="noolingo-speech">';
        const textAttr = token.attrs.find(attr => attr[0] === 'data-text');
        const text = textAttr ? textAttr[1] : '';
        return `<div class="noolingo-speech" data-text="${text}">`;
    };

    md.renderer.rules.block_speech_close = function () {
        return '</div>';
    };

    md.renderer.rules.speech = function (tokens, idx) {
        const token = tokens[idx];
        return `<div class="noolingo-speech" data-text="${token.content}">${token.content}</div>`;
    };
}
