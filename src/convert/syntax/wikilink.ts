// @/lib/convert/syntax/wikilink.ts


import type MarkdownIt from 'markdown-it';
export function wikilinkPlugin(md: MarkdownIt) {

    md.inline.ruler.push('wikilink', function (state, silent) {
        const start = state.pos;
        const max = state.posMax;
        if (state.src.charCodeAt(start) !== 0x5B/* [ */ ||
            state.src.charCodeAt(start + 1) !== 0x5B/* [ */) return false;
        let pos = start + 2;
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x5D/* ] */ &&
                state.src.charCodeAt(pos + 1) === 0x5D/* ] */) {
                break;
            }
            pos++;
        }
        if (pos === max) return false;
        if (!silent) {
            const token = state.push('wikilink', 'a', 0);
            token.attrs = [['class', 'noolingo-wikilink']];
            token.content = state.src.slice(start + 2, pos);
        }
        state.pos = pos + 2;
        return true;
    });

    
    md.renderer.rules.wikilink = function (tokens, idx) {
        const token = tokens[idx];
        const slug = token.content.toLowerCase().replace(/\s+/g, '-');
        const escapedTitle = token.content.replace(/"/g, '&quot;');
        return `<a href="/wiki/${slug}" class="noolingo-wikilink" data-wiki-title="${escapedTitle}">${token.content}</a>`;
    };
}
