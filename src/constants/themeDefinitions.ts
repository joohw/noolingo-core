// @/core/constants/themeDefinitions.ts
// 统一的主题定义文件，使用 HSL 格式
// 这个文件是所有平台（web、expo）的主题源文件


// HSL 颜色定义接口
export interface HSLColor {
  h: number;  // 色相 0-360
  s: number;  // 饱和度 0-100
  l: number;  // 亮度 0-100
}


// 主题颜色定义接口
export interface ThemeColorDefinition {
  background: HSLColor;
  foreground: HSLColor;
  primary: HSLColor;
  primaryForeground: HSLColor;
  secondary: HSLColor;
  secondaryForeground: HSLColor;
  muted: HSLColor;
  mutedForeground: HSLColor;
  accent: HSLColor;
  accentForeground: HSLColor;
  border: HSLColor;
  borderLight: HSLColor;
  input: HSLColor;
  ring: HSLColor;
  card: HSLColor;
  cardForeground: HSLColor;
  popover: HSLColor;
  popoverForeground: HSLColor;
  mask: HSLColor;
  syntax: HSLColor;
  bold: HSLColor;
  destructive: HSLColor;
  destructiveForeground: HSLColor;
  success: HSLColor;
  successForeground: HSLColor;
  warning: HSLColor;
  warningForeground: HSLColor;
  // 扩展颜色
  surface?: HSLColor;
  surfaceVariant?: HSLColor;
  surfaceContainer?: HSLColor;
  onBackground?: HSLColor;
  onSurface?: HSLColor;
  onSurfaceVariant?: HSLColor;
  onPrimary?: HSLColor;
  outline?: HSLColor;
  outlineVariant?: HSLColor;
  error?: HSLColor;
  info?: HSLColor;
  linkIncoming?: HSLColor;
  linkOutgoing?: HSLColor;
  chart1?: HSLColor;
  chart2?: HSLColor;
  // 代码高亮颜色
  codeKeyword?: HSLColor;
  codeString?: HSLColor;
  codeNumber?: HSLColor;
  codeComment?: HSLColor;
  codeFunction?: HSLColor;
  codeOperator?: HSLColor;
  codeVariable?: HSLColor;
  // 引用颜色
  referenceToBg?: HSLColor;
  referenceToText?: HSLColor;
  referenceFromBg?: HSLColor;
  referenceFromText?: HSLColor;
}


// Light 主题定义
export const lightThemeDefinition: ThemeColorDefinition = {
  background: { h: 0, s: 0, l: 97 },
  foreground: { h: 0, s: 0, l: 7 },
  primary: { h: 15, s: 50, l: 58 },
  primaryForeground: { h: 0, s: 0, l: 100 },
  secondary: { h: 0, s: 0, l: 96 },
  secondaryForeground: { h: 0, s: 0, l: 25 },
  muted: { h: 0, s: 0, l: 96 },
  mutedForeground: { h: 0, s: 0, l: 45 },
  accent: { h: 0, s: 0, l: 94 },
  accentForeground: { h: 0, s: 0, l: 25 },
  border: { h: 0, s: 0, l: 85 },
  borderLight: { h: 0, s: 0, l: 80 },
  input: { h: 0, s: 0, l: 95 },
  ring: { h: 15, s: 50, l: 58 },
  card: { h: 0, s: 0, l: 100 },
  cardForeground: { h: 0, s: 0, l: 25 },
  popover: { h: 0, s: 0, l: 97 },
  popoverForeground: { h: 0, s: 0, l: 25 },
  mask: { h: 0, s: 0, l: 90 },
  syntax: { h: 215, s: 85, l: 50 },
  bold: { h: 0, s: 0, l: 7 },
  destructive: { h: 0, s: 100, l: 65 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 150, s: 58, l: 38 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 45, s: 100, l: 45 },
  warningForeground: { h: 0, s: 0, l: 100 },
  // 扩展颜色
  surface: { h: 0, s: 0, l: 100 },
  surfaceVariant: { h: 30, s: 8, l: 89 },
  surfaceContainer: { h: 30, s: 8, l: 92 },
  onBackground: { h: 0, s: 0, l: 7 },
  onSurface: { h: 0, s: 0, l: 29 },
  onSurfaceVariant: { h: 0, s: 0, l: 47 },
  onPrimary: { h: 0, s: 0, l: 100 },
  outline: { h: 0, s: 0, l: 80 },
  outlineVariant: { h: 30, s: 8, l: 75 },
  error: { h: 0, s: 100, l: 65 },
  info: { h: 210, s: 100, l: 56 },
  linkIncoming: { h: 215, s: 50, l: 50 },
  linkOutgoing: { h: 150, s: 50, l: 38 },
  chart1: { h: 18, s: 100, l: 60 },
  chart2: { h: 20, s: 100, l: 73 },
  // 代码高亮
  codeKeyword: { h: 210, s: 100, l: 56 },
  codeString: { h: 150, s: 58, l: 38 },
  codeNumber: { h: 15, s: 50, l: 58 },
  codeComment: { h: 0, s: 0, l: 47 },
  codeFunction: { h: 15, s: 50, l: 58 },
  codeOperator: { h: 0, s: 0, l: 47 },
  codeVariable: { h: 215, s: 50, l: 50 },
  // 引用颜色
  referenceToBg: { h: 210, s: 35, l: 94 },
  referenceToText: { h: 210, s: 35, l: 40 },
  referenceFromBg: { h: 140, s: 35, l: 94 },
  referenceFromText: { h: 140, s: 35, l: 40 },
};


// Warm 主题定义
export const warmThemeDefinition: ThemeColorDefinition = {
  background: { h: 30, s: 8, l: 95 },
  foreground: { h: 0, s: 0, l: 7 },
  primary: { h: 15, s: 50, l: 58 },
  primaryForeground: { h: 0, s: 0, l: 100 },
  secondary: { h: 30, s: 8, l: 91 },
  secondaryForeground: { h: 0, s: 0, l: 25 },
  muted: { h: 30, s: 8, l: 91 },
  mutedForeground: { h: 0, s: 0, l: 45 },
  accent: { h: 30, s: 8, l: 87 },
  accentForeground: { h: 0, s: 0, l: 25 },
  border: { h: 0, s: 0, l: 80 },
  borderLight: { h: 30, s: 8, l: 77 },
  input: { h: 0, s: 0, l: 90 },
  ring: { h: 15, s: 50, l: 58 },
  card: { h: 30, s: 8, l: 98 },
  cardForeground: { h: 0, s: 0, l: 25 },
  popover: { h: 30, s: 8, l: 98 },
  popoverForeground: { h: 0, s: 0, l: 25 },
  mask: { h: 0, s: 0, l: 85 },
  syntax: { h: 215, s: 85, l: 50 },
  bold: { h: 0, s: 0, l: 7 },
  destructive: { h: 0, s: 100, l: 65 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 150, s: 58, l: 38 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 45, s: 100, l: 45 },
  warningForeground: { h: 0, s: 0, l: 100 },
  // 扩展颜色
  surface: { h: 30, s: 8, l: 98 },
  surfaceVariant: { h: 30, s: 8, l: 87 },
  surfaceContainer: { h: 30, s: 8, l: 91 },
  onBackground: { h: 0, s: 0, l: 7 },
  onSurface: { h: 0, s: 0, l: 29 },
  onSurfaceVariant: { h: 0, s: 0, l: 45 },
  onPrimary: { h: 0, s: 0, l: 100 },
  outline: { h: 0, s: 0, l: 80 },
  outlineVariant: { h: 30, s: 8, l: 77 },
  error: { h: 0, s: 100, l: 65 },
  info: { h: 210, s: 100, l: 56 },
  linkIncoming: { h: 215, s: 50, l: 50 },
  linkOutgoing: { h: 150, s: 50, l: 38 },
  chart1: { h: 18, s: 100, l: 60 },
  chart2: { h: 20, s: 100, l: 73 },
  // 代码高亮
  codeKeyword: { h: 210, s: 100, l: 56 },
  codeString: { h: 150, s: 58, l: 38 },
  codeNumber: { h: 15, s: 50, l: 58 },
  codeComment: { h: 0, s: 0, l: 45 },
  codeFunction: { h: 15, s: 50, l: 58 },
  codeOperator: { h: 0, s: 0, l: 45 },
  codeVariable: { h: 215, s: 50, l: 50 },
  // 引用颜色
  referenceToBg: { h: 210, s: 35, l: 94 },
  referenceToText: { h: 210, s: 35, l: 40 },
  referenceFromBg: { h: 140, s: 35, l: 94 },
  referenceFromText: { h: 140, s: 35, l: 40 },
};


// Dark 主题定义
export const darkThemeDefinition: ThemeColorDefinition = {
  background: { h: 0, s: 0, l: 13 },
  foreground: { h: 0, s: 0, l: 95 },
  primary: { h: 15, s: 45, l: 51 },
  primaryForeground: { h: 0, s: 0, l: 100 },
  secondary: { h: 0, s: 0, l: 14 },
  secondaryForeground: { h: 0, s: 0, l: 90 },
  muted: { h: 0, s: 0, l: 12 },
  mutedForeground: { h: 0, s: 0, l: 65 },
  accent: { h: 0, s: 0, l: 20 },
  accentForeground: { h: 0, s: 0, l: 90 },
  border: { h: 0, s: 0, l: 20 },
  borderLight: { h: 0, s: 0, l: 25 },
  input: { h: 0, s: 0, l: 25 },
  ring: { h: 224, s: 60, l: 58 },
  card: { h: 0, s: 0, l: 16 },
  cardForeground: { h: 0, s: 0, l: 90 },
  popover: { h: 0, s: 0, l: 13 },
  popoverForeground: { h: 0, s: 0, l: 90 },
  mask: { h: 0, s: 0, l: 25 },
  syntax: { h: 210, s: 95, l: 65 },
  bold: { h: 25, s: 70, l: 50 },
  destructive: { h: 0, s: 85, l: 60 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 142, s: 70, l: 45 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 38, s: 85, l: 55 },
  warningForeground: { h: 0, s: 0, l: 100 },
  // 扩展颜色
  surface: { h: 0, s: 0, l: 9 },
  surfaceVariant: { h: 0, s: 0, l: 20 },
  surfaceContainer: { h: 0, s: 0, l: 10 },
  onBackground: { h: 0, s: 0, l: 100 },
  onSurface: { h: 0, s: 0, l: 76 },
  onSurfaceVariant: { h: 0, s: 0, l: 64 },
  onPrimary: { h: 0, s: 0, l: 100 },
  outline: { h: 0, s: 0, l: 18 },
  outlineVariant: { h: 0, s: 0, l: 23 },
  error: { h: 0, s: 85, l: 60 },
  info: { h: 210, s: 95, l: 65 },
  linkIncoming: { h: 215, s: 50, l: 65 },
  linkOutgoing: { h: 150, s: 50, l: 55 },
  chart1: { h: 18, s: 100, l: 60 },
  chart2: { h: 20, s: 100, l: 73 },
  // 代码高亮
  codeKeyword: { h: 210, s: 95, l: 65 },
  codeString: { h: 142, s: 70, l: 45 },
  codeNumber: { h: 15, s: 45, l: 51 },
  codeComment: { h: 0, s: 0, l: 64 },
  codeFunction: { h: 15, s: 45, l: 51 },
  codeOperator: { h: 0, s: 0, l: 64 },
  codeVariable: { h: 215, s: 50, l: 65 },
  // 引用颜色
  referenceToBg: { h: 210, s: 30, l: 25 },
  referenceToText: { h: 210, s: 100, l: 85 },
  referenceFromBg: { h: 140, s: 30, l: 25 },
  referenceFromText: { h: 140, s: 100, l: 85 },
};


// WarmDark 主题定义
export const warmDarkThemeDefinition: ThemeColorDefinition = {
  background: { h: 15, s: 20, l: 10 },
  foreground: { h: 15, s: 10, l: 95 },
  primary: { h: 15, s: 55, l: 55 },
  primaryForeground: { h: 0, s: 0, l: 100 },
  secondary: { h: 15, s: 15, l: 15 },
  secondaryForeground: { h: 15, s: 10, l: 90 },
  muted: { h: 15, s: 12, l: 12 },
  mutedForeground: { h: 15, s: 10, l: 65 },
  accent: { h: 15, s: 18, l: 18 },
  accentForeground: { h: 15, s: 10, l: 90 },
  border: { h: 15, s: 15, l: 20 },
  borderLight: { h: 15, s: 15, l: 25 },
  input: { h: 15, s: 15, l: 25 },
  ring: { h: 15, s: 55, l: 55 },
  card: { h: 15, s: 18, l: 14 },
  cardForeground: { h: 15, s: 10, l: 90 },
  popover: { h: 15, s: 20, l: 10 },
  popoverForeground: { h: 15, s: 10, l: 90 },
  mask: { h: 15, s: 15, l: 25 },
  syntax: { h: 20, s: 80, l: 65 },
  bold: { h: 15, s: 60, l: 55 },
  destructive: { h: 0, s: 85, l: 60 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 142, s: 70, l: 45 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 38, s: 85, l: 55 },
  warningForeground: { h: 0, s: 0, l: 100 },
  // 扩展颜色
  surface: { h: 15, s: 18, l: 14 },
  surfaceVariant: { h: 15, s: 15, l: 15 },
  surfaceContainer: { h: 15, s: 12, l: 12 },
  onBackground: { h: 15, s: 10, l: 95 },
  onSurface: { h: 15, s: 10, l: 90 },
  onSurfaceVariant: { h: 15, s: 10, l: 65 },
  onPrimary: { h: 0, s: 0, l: 100 },
  outline: { h: 15, s: 15, l: 20 },
  outlineVariant: { h: 15, s: 15, l: 25 },
  error: { h: 0, s: 85, l: 60 },
  info: { h: 20, s: 80, l: 65 },
  linkIncoming: { h: 215, s: 50, l: 65 },
  linkOutgoing: { h: 150, s: 50, l: 55 },
  chart1: { h: 15, s: 80, l: 60 },
  chart2: { h: 20, s: 80, l: 65 },
  // 代码高亮
  codeKeyword: { h: 20, s: 80, l: 65 },
  codeString: { h: 142, s: 70, l: 45 },
  codeNumber: { h: 15, s: 55, l: 55 },
  codeComment: { h: 15, s: 10, l: 65 },
  codeFunction: { h: 15, s: 55, l: 55 },
  codeOperator: { h: 15, s: 10, l: 65 },
  codeVariable: { h: 215, s: 50, l: 65 },
  // 引用颜色
  referenceToBg: { h: 15, s: 25, l: 20 },
  referenceToText: { h: 15, s: 60, l: 75 },
  referenceFromBg: { h: 10, s: 25, l: 20 },
  referenceFromText: { h: 10, s: 60, l: 75 },
};


// 所有主题定义映射
export const THEME_DEFINITIONS: Record<'light' | 'warm' | 'dark' | 'warmDark', ThemeColorDefinition> = {
  light: lightThemeDefinition,
  warm: warmThemeDefinition,
  dark: darkThemeDefinition,
  warmDark: warmDarkThemeDefinition,
};


// 获取主题定义
export function getThemeDefinition(themeName: 'light' | 'warm' | 'dark' | 'warmDark'): ThemeColorDefinition {
  return THEME_DEFINITIONS[themeName] || lightThemeDefinition;
}

