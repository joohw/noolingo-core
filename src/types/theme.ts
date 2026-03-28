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
  