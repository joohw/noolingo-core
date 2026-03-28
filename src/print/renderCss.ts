


import { katexCSS } from '../render/styles/katexCSS';
import { typographyCSS } from '../render/styles/typography';
import { getThemeCSS } from '../render/styles/theme';
import { hightlightCss } from '../render/styles/hightlight';
import { maskCSS } from '../render/styles/mask';
import { noteCSS } from '../render/styles/note';
import { CustomTheme } from '../constants/themes';


// 获取渲染 CSS
// customTheme: CustomTheme 对象，如果传入则使用完整的主题对象；如果不传，则使用默认的 light 主题
export const getRenderCss = (customTheme?: CustomTheme): string => {
    return `
    ${getThemeCSS(customTheme)}
    ${noteCSS}
    ${katexCSS}
    ${hightlightCss}
    ${typographyCSS}
    ${maskCSS}
    `;
};
