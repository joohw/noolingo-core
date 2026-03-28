// @/lib/convert/markdownToHtml.ts


import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import { 
    highlightPlugin, 
    maskPlugin, 
    speechPlugin, 
    katexPlugin,
    wikilinkPlugin 
} from './syntax';


const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
        const escapedCode = str;
        if (lang) {
            return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
        }
        return `<pre><code>${escapedCode}</code></pre>`;
    }
}).disable(['code']);


// 使用插件
md.use(taskLists, {
    enabled: true,
    errorColor: '#cc0000',
    strict: false
})
.use(highlightPlugin)
.use(maskPlugin)
.use(speechPlugin)
.use(katexPlugin)
.use(wikilinkPlugin)
.enable(['table', 'strikethrough'])
.enable('table');



// 修改代码块渲染规则
md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
    const token = tokens[idx];
    const lang = token.info || '';
    const code = token.content;
    return `<pre class="noolingo-pre">
        <header>
            <span>${lang}</span>
        </header>
        <code class="language-${lang}">${code}</code>
    </pre>`;
};



export function markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    markdown = preprocessMarkdown(markdown);
    let content = '';
    const lines = markdown.trim().split('\n');
    content = lines.join('\n').trim();
    const htmlContent = md.render(content);
    return htmlContent;
}



// 把非标准markdown转换成标准markdown
const preprocessMarkdown = (text: string): string => {
    if (!text) return '';
    // 1. 统一换行符
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 2. 处理数学公式块的边界空白
    text = text.replace(/\n\s*(\$\$[\s\S]*?\$\$)/g, '\n\n$1\n\n');
    // 3. 预处理需要换行的语法标记
    text = text
        .replace(/＆＆([^＆]+)＆＆/g, '&&$1&&')
        .replace(/^(\s*)\{{3}/gm, '\n$1{{{')
        .replace(/^(\s*)\^{3}/gm, '\n$1^^^')
        .replace(/【【([^】]+)】】/g, '[[$1]]')
        .replace(/［［([^］]+)］］/g, '[[$1]]')
        .replace(/｛｛([^｝]+)｝｝/g, '{{$1}}')
        .replace(/［/g, '[')
        .replace(/］/g, ']')
        .replace(/（/g, '(')
        .replace(/）/g, ')')
    return text.trim();
};
