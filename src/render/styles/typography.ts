// @/styles/typography.ts
// 笔记的排版的预设css样式

import { FontSize, FontFamily, Spacing } from '../../types/setting';


// 系统字体（不需要加载文件，使用系统默认字体）
const SYSTEM_FONTS: string[] = ['sans', 'prose'];


// 生成 typography CSS
export function getTypographyCSS(fontFamily?: FontFamily, fontSize?: FontSize, spacing?: Spacing): string {
    // 生成字体相关的 CSS
    let fontFaceCSS = '';
    if (fontFamily && !SYSTEM_FONTS.includes(fontFamily.toLowerCase())) {
        const fontName = fontFamily;
        const androidPathTTF = `file:///android_asset/fonts/${fontName}.ttf`;
        const androidPathOTF = `file:///android_asset/fonts/${fontName}.otf`;
        const iosPathTTF = `./fonts/${fontName}.ttf`;
        const iosPathOTF = `./fonts/${fontName}.otf`;
        fontFaceCSS = `
@font-face {
    font-family: '${fontName}';
    src: url('${androidPathTTF}') format('truetype'),
         url('${androidPathOTF}') format('opentype'),
         url('${iosPathTTF}') format('truetype'),
         url('${iosPathOTF}') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
`;
    }
    // 获取字号值
    const sizeMap: Record<FontSize, { fontSize: string; preSize: string; titleSize: string }> = {
        'xs': { fontSize: '14px', preSize: '10px', titleSize: '18px' },
        'sm': { fontSize: '16px', preSize: '12px', titleSize: '20px' },
        'base': { fontSize: '18px', preSize: '14px', titleSize: '22px' },
        'lg': { fontSize: '20px', preSize: '16px', titleSize: '24px' },
        'xl': { fontSize: '24px', preSize: '20px', titleSize: '28px' },
        '2xl': { fontSize: '28px', preSize: '22px', titleSize: '32px' },
        '3xl': { fontSize: '32px', preSize: '24px', titleSize: '36px' },
        '4xl': { fontSize: '36px', preSize: '28px', titleSize: '40px' },
        '5xl': { fontSize: '40px', preSize: '30px', titleSize: '44px' },
    };
    const defaultSize = sizeMap['base'];
    const size = fontSize ? sizeMap[fontSize] : defaultSize;
    // 获取间距值
    const spacingMap: Record<Spacing, { ratio: string; lineHeight: string }> = {
        'tight': { ratio: '0.8', lineHeight: '1.5' },
        'normal': { ratio: '1', lineHeight: '1.8' },
        'loose': { ratio: '1.2', lineHeight: '2.0' },
    };
    const defaultSpacing = spacingMap['normal'];
    const spacingValue = spacing ? spacingMap[spacing] : defaultSpacing;
    // 获取字体族
    let fontFamilyCSS = '';
    if (fontFamily) {
        if (fontFamily.toLowerCase() === 'prose') {
            fontFamilyCSS = `'Songti SC', 'STSong', 'NotoSerifSC-Regular','Source Han Serif','Source Serif Pro', 'Noto Serif CJK SC', 'Literata', serif`;
        } else if (fontFamily.toLowerCase() === 'sans') {
            fontFamilyCSS = `-apple-system, 'SF Pro Text', 'PingFang SC', 'Heiti SC', 'San Francisco', 'Lato', 'Helvetica Neue', sans-serif`;
        } else if (fontFamily.toLowerCase() === 'mono') {
            fontFamilyCSS = `'SF Mono', 'Menlo', 'Monaco','Roboto Mono','Source Code Pro', 'Consolas', 'Courier New', monospace`;
        } else {
            fontFamilyCSS = `'${fontFamily}'`;
        }
    } else {
        fontFamilyCSS = `'Songti SC', 'STSong', 'NotoSerifSC-Regular','Source Han Serif','Source Serif Pro', 'Noto Serif CJK SC', 'Literata', serif`;
    }
    // 生成全局样式 CSS
    const globalCSS = `
.noolingo-content {
  font-family: ${fontFamilyCSS};
  font-size: ${size.fontSize};
  line-height: ${spacingValue.lineHeight};
  --font-size: ${size.fontSize};
  --pre-size: ${size.preSize};
  --title-size: ${size.titleSize};
  --spacing-ratio: ${spacingValue.ratio};
  --line-height: ${spacingValue.lineHeight};
}
.noolingo-content h1.note-title {
  font-size: ${size.titleSize};
  line-height: 2;
}
.noolingo-content blockquote {
  margin-top: calc(${size.fontSize} * 0.8);
  margin-bottom: calc(${size.fontSize} * 0.8);
}
.noolingo-content h1,
.noolingo-content h2,
.noolingo-content h3,
.noolingo-content h4,
.noolingo-content h5,
.noolingo-content h6 {
  font-size: ${size.fontSize};
  line-height: 1.3;
  margin-top: calc(${size.fontSize} * ${spacingValue.ratio} * 1.2);
  margin-bottom: calc(${size.fontSize} * ${spacingValue.ratio} * 1.2);
}
.noolingo-content code {
  font-size: inherit;
  line-height: inherit;
}
.noolingo-content pre {
  font-size: ${size.preSize};
  line-height: 1.3;
  margin-top: calc(${size.fontSize} * ${spacingValue.ratio});
  margin-bottom: calc(${size.fontSize} * ${spacingValue.ratio});
}
.noolingo-content pre code {
  font-size: inherit;
}
.noolingo-content p,
.noolingo-content ul,
.noolingo-content ol {
  margin-top: calc(${size.fontSize} * ${spacingValue.ratio});
  margin-bottom: calc(${size.fontSize} * ${spacingValue.ratio});
}
.noolingo-content li {
  margin-bottom: calc(${size.fontSize} * ${spacingValue.ratio} * 0.5);
}
.noolingo-content blockquote {
  margin-top: calc(${size.fontSize} * ${spacingValue.ratio});
  margin-bottom: calc(${size.fontSize} * ${spacingValue.ratio});
}
`;
    return `${fontFaceCSS}${globalCSS}`;
}


// 保留原有的 typographyCSS 导出以保持向后兼容（如果需要）
export const typographyCSS = getTypographyCSS();
