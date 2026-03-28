// @/utils/strip.ts
// 添加辅助函数：将 HTML 转换为纯文本


export function stripHtml(html: string): string {
    let text = html.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }
  
  
  // Add this helper function to strip CSS styles
  export function stripCssStyles(html: string): string {
    return html
      .replace(/\s*style="[^"]*"/g, '')
      .replace(/\s*class="[^"]*"/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?font[^>]*>/g, '')
      .replace(/<b>(.*?)<\/b>/gi, '$1')
      .replace(/\s*nightMode[^"']*/g, '')
      .trim();
  }
  


  export function stripOldCssStyles(html: string): string {
    return html
      .replace(/\s*class="([^"]*)"/g, (match, classNames) => {
        const filteredClasses = classNames
          .split(/\s+/)
          .filter((className: string) => 
            !className.includes('noolingofont') && 
            !className.includes('noolingo-font') &&
            !className.includes('noolingo-text') &&
            !className.includes('noolingo-space')
          )
          .join(' ');
        // 如果还有类名剩余，返回带有剩余类名的class属性
        return filteredClasses ? ` class="${filteredClasses}"` : '';
      })
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除样式标签
      .replace(/<\/?font[^>]*>/g, '') // 移除font标签
      .trim();
  }
