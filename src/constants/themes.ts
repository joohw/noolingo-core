// @/types/themes.ts
// 自定义主题相关的类型定义和预设主题
// 使用统一的主题定义系统


import { getThemeDefinition, ThemeColorDefinition } from './themeDefinitions';
import { hslToHex } from '../utils/colorUtils';


export interface CustomTheme {
  background?: string;           // 背景色
  foreground?: string;           // 前景色（文字颜色）
  primary?: string;              // 主题色
  secondary?: string;            // 次要背景色
  muted?: string;                // 静音背景色
  mutedForeground?: string;      // 静音前景色
  border?: string;               // 边框颜色
  success?: string;              // 成功色
  highlight?: string;            // 高亮背景色
  bold?: string;                // 加粗文字颜色
  mask?: string;                // 遮罩颜色
  tableHeaderBg?: string;        // 表头背景色
  tableCellBg?: string;          // 单元格背景色
  tableAlternateCellBg?: string; // 交替行背景色
  codeKeyword?: string;          // 关键字颜色
  codeString?: string;           // 字符串颜色
  codeNumber?: string;           // 数字颜色
  codeComment?: string;          // 注释颜色
  codeFunction?: string;         // 函数颜色
  codeOperator?: string;         // 操作符颜色
  codeVariable?: string;         // 变量颜色
}


// 从统一主题定义转换为 CustomTheme 格式
function createCustomTheme(themeDef: ThemeColorDefinition): CustomTheme {
  const hex = (hsl: any) => hsl ? hslToHex(hsl) : undefined;
  const rgba = (hsl: any, alpha: number) => {
    if (!hsl) return undefined;
    const hexColor = hslToHex(hsl);
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  return {
    background: hex(themeDef.background),
    foreground: hex(themeDef.foreground),
    primary: hex(themeDef.primary),
    secondary: hex(themeDef.secondary),
    muted: hex(themeDef.muted),
    mutedForeground: hex(themeDef.mutedForeground),
    border: hex(themeDef.border),
    success: hex(themeDef.success),
    highlight: '#ffeb99',  // 高亮色保持固定
    bold: hex(themeDef.bold),
    mask: hex(themeDef.mask),
    tableHeaderBg: rgba(themeDef.secondary, 0.8),
    tableCellBg: rgba(themeDef.muted, 0.5),
    tableAlternateCellBg: rgba(themeDef.secondary, 0.4),
    codeKeyword: hex(themeDef.codeKeyword),
    codeString: hex(themeDef.codeString),
    codeNumber: hex(themeDef.codeNumber),
    codeComment: hex(themeDef.codeComment),
    codeFunction: hex(themeDef.codeFunction),
    codeOperator: hex(themeDef.codeOperator),
    codeVariable: hex(themeDef.codeVariable),
  };
}

// 预设的自定义主题 - 从统一主题定义生成
export const lightTheme: CustomTheme = createCustomTheme(getThemeDefinition('light'));
export const darkTheme: CustomTheme = createCustomTheme(getThemeDefinition('dark'));
export const warmTheme: CustomTheme = createCustomTheme(getThemeDefinition('warm'));
export const warmDarkTheme: CustomTheme = createCustomTheme(getThemeDefinition('warmDark'));


// 所有主题映射
const ALL_THEMES: Record<string, CustomTheme> = {
  'light': lightTheme,
  'warm': warmTheme,
  'dark': darkTheme,
  'warmDark': warmDarkTheme,
};


export function getCustomTheme(themeName?: 'light' | 'dark' | 'warm' | 'warmDark'): CustomTheme {
  if (!themeName) {
    return lightTheme;
  }
  const theme = ALL_THEMES[themeName];
  if (!theme) {
    return lightTheme;
  }
  return theme;
}

