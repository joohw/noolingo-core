// @/lib/render/getStyledContent
import { getThemeCSS } from './styles/theme';
import { noteCSS } from './styles/note';
import { maskCSS } from './styles/mask';
import { katexCSS } from './styles/katexCSS';
import { getTypographyCSS } from './styles/typography';
import { globalCSS } from './styles/global';
import { hightlightCss } from './styles/hightlight';
import { getRenderScript } from './noteWebViewScript';
import { CustomTheme } from '../types/theme';
import { FontSize, FontFamily, Spacing } from '../types/setting';


// 获取样式（不包含 HTML 结构）
export function getStyle(customTheme?: CustomTheme, fontFamily?: FontFamily, fontSize?: FontSize, spacing?: Spacing): string {
    const ThemeCss = getThemeCSS(customTheme);
    const typographyCSS = getTypographyCSS(fontFamily, fontSize, spacing);
    return `
${ThemeCss}
${typographyCSS}
${globalCSS}
${noteCSS}
${hightlightCss}
${maskCSS}
${katexCSS}`;
}



// 获取带样式的完整 HTML 内容
export function getStyledContent(
    content: string,
    customTheme?: CustomTheme,
    fontFamily?: FontFamily,
    fontSize?: FontSize,
    spacing?: Spacing
): string {
    const styles = getStyle(customTheme, fontFamily, fontSize, spacing);
    const renderScript = getRenderScript();
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
${styles}
        </style>
    </head>
    <body>
        <div class="note-container">
        ${content}
        </div>
        <script>
${renderScript}
        </script>
    </body>
    </html>
    `;
}