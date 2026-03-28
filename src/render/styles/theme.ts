// @/styles/theme.ts
// 主题颜色和全局的颜色设置


export type Theme = 'light' | 'cool' | 'dark';
import { CustomTheme } from '../../constants/themes';



export const getThemeCSS = (customTheme?: CustomTheme): string => {
  const colors = globalColors.light;
  const background = customTheme?.background || colors.background;
  const foreground = customTheme?.foreground || colors.foreground;
  const primary = customTheme?.primary || colors.primary;
  const secondary = customTheme?.secondary || colors.secondary;
  const muted = customTheme?.muted || colors.muted;
  const mutedForeground = customTheme?.mutedForeground || colors.mutedForeground;
  const border = customTheme?.border || colors.border;
  const success = customTheme?.success || colors.success;
  const highlight = customTheme?.highlight || colors.highlight;
  const bold = customTheme?.bold || colors.bold;
  const mask = customTheme?.mask || colors.mask;
  const tableHeaderBg = customTheme?.tableHeaderBg || colors.tableHeaderBg;
  const tableCellBg = customTheme?.tableCellBg || colors.tableCellBg;
  const tableAlternateCellBg = customTheme?.tableAlternateCellBg || colors.tableAlternateCellBg;
  const codeKeyword = customTheme?.codeKeyword || colors.codeKeyword;
  const codeString = customTheme?.codeString || colors.codeString;
  const codeNumber = customTheme?.codeNumber || colors.codeNumber;
  const codeComment = customTheme?.codeComment || colors.codeComment;
  const codeFunction = customTheme?.codeFunction || colors.codeFunction;
  const codeOperator = customTheme?.codeOperator || colors.codeOperator;
  const codeVariable = customTheme?.codeVariable || colors.codeVariable;


  return `
      :root {
        --primary: ${primary};
        --background: ${background};
        --foreground: ${foreground};
        --secondary: ${secondary};
        --muted: ${muted};
        --muted-foreground: ${mutedForeground};
        --border: ${border};
        --success: ${success};
        --highlight: ${highlight}; 
        --bold: ${bold};
        --mask: ${mask};
        --table-header-bg: ${tableHeaderBg};
        --table-cell-bg: ${tableCellBg};
        --table-alternate-cell-bg: ${tableAlternateCellBg};
        --code-keyword: ${codeKeyword};
        --code-string: ${codeString};
        --code-number: ${codeNumber};
        --code-comment: ${codeComment};
        --code-function: ${codeFunction};
        --code-operator: ${codeOperator};
        --code-variable: ${codeVariable};
      } 
    `;
};



export const globalColors = {
  light: {
    background: '#F5F3F0',
    foreground: '#37332f',
    primary: '#7A3D17',
    secondary: '#F7F4F1',
    muted: '#ebebeb',
    mutedForeground: '#737373',
    border: '#e0d8d2',
    cardForeground: '#37332f',
    success: '#33cc99',
    info: '#6B7C93',
    highlight: '#ffeb99',
    bold: '#8B4A1F',
    syntax: '#1a75d2',
    mask: '#e4e4e4',
    codeKeyword: '#07a',
    codeString: '#690',
    codeNumber: '#905',
    codeComment: '#708090',
    codeFunction: '#DD4A68',
    codeOperator: '#9a6e3a',
    codeVariable: '#e90',
    buttonHoverBg: 'rgba(122, 61, 23, 0.2)',
    tableCellBg: 'rgba(247, 244, 241, 0.2)',
    tableAlternateCellBg: 'rgba(247, 244, 241, 0.3)',
    tableHeaderBg: 'rgba(247, 244, 241, 0.6)',
    completedTaskBg: 'rgba(51, 204, 153, 0.5)',
  },

  dark: {
    background: '#000000',
    foreground: '#e2e2e2',
    primary: '#ff7f2a',
    secondary: '#242424',
    muted: '#1f1f1f',
    mutedForeground: '#a6a6a6',
    border: '#333333',
    cardForeground: '#e6e6e6',
    success: '#33cc99',
    info: '#a6a6a6',
    highlight: '#ffeb99',
    bold: '#ff9040',
    syntax: '#4a9eff',
    mask: '#2f2f2f',
    codeKeyword: '#569CD6',
    codeString: '#CE9178',
    codeNumber: '#B5CEA8',
    codeComment: '#6A9955',
    codeFunction: '#DCDCAA',
    codeOperator: '#D4D4D4',
    codeVariable: '#9CDCFE',
    buttonHoverBg: 'rgba(255, 127, 42, 0.2)',
    tableCellBg: 'rgba(36, 36, 36, 0.2)',
    tableAlternateCellBg: 'rgba(36, 36, 36, 0.3)',
    tableHeaderBg: 'rgba(36, 36, 36, 0.6)',
    completedTaskBg: 'rgba(51, 204, 153, 0.5)',
  }
};


