// @/utils/textNormalize.ts
// 文本规范化工具，用于统一处理全角/半角字符


// 规范化标题文本：将全角字符转换为半角字符，用于索引和搜索
export function normalizeTitleForIndex(title: string): string {
    if (!title) return '';
    return title
        .trim()
        .toLowerCase()
        // 全角括号转半角
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/［/g, '[')
        .replace(/］/g, ']')
        .replace(/｛/g, '{')
        .replace(/｝/g, '}')
        // 全角冒号转半角
        .replace(/：/g, ':')
        // 全角逗号转半角
        .replace(/，/g, ',')
        // 全角句号转半角
        .replace(/。/g, '.')
        // 全角分号转半角
        .replace(/；/g, ';')
        // 全角问号转半角
        .replace(/？/g, '?')
        // 全角感叹号转半角
        .replace(/！/g, '!')
        // 全角空格转半角
        .replace(/　/g, ' ');
}

