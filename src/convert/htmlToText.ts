// @/lib/convert/htmlToText.ts


export function htmlToText(html: string): string {
    if (!html) return '';
    try {
        // 第一步：在关键位置保留换行，移除脚本和样式
        let text = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            // 替换块级元素为换行
            .replace(/<(div|p|br|h[1-6]|li|tr)[^>]*>/gi, '\n');
        // 第二步：移除所有HTML标签，但不立即替换为空格
        text = text.replace(/<[^>]+>/g, '');
        // 第三步：处理HTML实体
        text = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
        // 第四步：规范化空白
        text = text
            // 处理连续的水平空白
            .replace(/[ \t]+/g, ' ')
            // 处理行首和行尾的空白
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
            
        return text.trim();
    } catch (e) {
        console.error('Error converting HTML to text:', e);
        return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
}
