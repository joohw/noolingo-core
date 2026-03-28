// @/styles/font.ts
// 自定义字体加载配置

// 系统字体（不需要加载文件，使用系统默认字体）
// 'sans' 和 'prose' 对应系统默认字体，不需要加载字体文件
const SYSTEM_FONTS: string[] = ['sans', 'prose'];


export function getFontFaceCSS(fontFamily?: string): string {
    if (!fontFamily) {
        return '';
    }
    if (SYSTEM_FONTS.includes(fontFamily.toLowerCase())) {
        return '';
    }
    // 字体文件名和字体名完全对应（不区分大小写）
    // 支持 .ttf 和 .otf 格式
    // 优先尝试 .ttf，如果不存在则尝试 .otf
    const fontName = fontFamily; // 字体名就是字体文件名（不含扩展名）
    const androidPathTTF = `file:///android_asset/fonts/${fontName}.ttf`;
    const androidPathOTF = `file:///android_asset/fonts/${fontName}.otf`;
    const iosPathTTF = `./fonts/${fontName}.ttf`;
    const iosPathOTF = `./fonts/${fontName}.otf`;
    // 同时支持 Android 和 iOS 的路径，以及 .ttf 和 .otf 格式
    return `
@font-face {
    font-family: '${fontName}';
    src: url('${androidPathTTF}') format('truetype'),
         url('${androidPathOTF}') format('opentype'),
         url('${iosPathTTF}') format('truetype'),
         url('${iosPathOTF}') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap; /* 优化加载性能，避免阻塞渲染 */
}
`;
}

