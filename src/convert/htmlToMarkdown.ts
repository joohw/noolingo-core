// @/lib/convert/htmlToMarkdown.ts


export function htmlToMarkdown(html: string): string {
    try {
        const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '');
        // 转换内容
        return cleanHtml
            // 转换特殊语法
            .replace(/<span[^>]*class="noolingo-speech"[^>]*data-text="([^"]*)"[^>]*>.*?<\/span>/g, '^^$1^^')
            .replace(/<span[^>]*class="noolingo-wikilink"[^>]*>(.*?)<\/span>/g, '[[$1]]')
            .replace(/<mark[^>]*class="noolingo-highlight"[^>]*>(.*?)<\/mark>/g, '==$1==')
            .replace(/<strong[^>]*class="noolingo-mask"[^>]*>(.*?)<\/strong>/g, '{{$1}}')
            // 转换基本格式
            .replace(/<(b|strong)(?![^>]*class="noolingo-mask")[^>]*>(.*?)<\/\1>/g, '**$2**')
            .replace(/<(i|em)[^>]*>(.*?)<\/\1>/g, '*$2*')
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '$1\n')
            .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<div[^>]*>(.*?)<\/div>/g, '$1\n')
            // 转换列表
            .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
                let counter = 1;
                return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_: any, item: any) => 
                    `${counter++}. ${item.trim()}\n`
                );
            })
            .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => 
                content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_: any, item: any) => 
                    `- ${item.trim()}\n`
                )
            )
            // 清理剩余标签和HTML实体
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
    } catch (e) {
        console.error('Error converting HTML to Markdown:', e);
        return html.replace(/<[^>]+>/g, '');
    }
}
