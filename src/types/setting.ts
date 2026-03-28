// @/types/setting.ts
// 用户设置有关的模型
// 增加了用户画像相关的字段




export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
export type FontFamily = string; // 字体族，支持任意字符串。'sans' 和 'prose' 对应系统默认字体
export type Spacing = 'tight' | 'normal' | 'loose';
export type Margin = 'extraNarrow' | 'narrow' | 'normal' | 'wide' | 'extraWide';
export type SpeechMode = 'full' | 'title' | 'content';
export type PlaybackMode = 'single' | 'loop' | 'dictation';


export interface SpeechSettings {
  mode: SpeechMode;  // 朗读模式：全文、仅标题、仅正文
  dictationRepeatCount: number; // 听写模式下的重复次数
  playbackMode: PlaybackMode; // 播放模式：单次、循环、听写
  speed: number; // 播放速度
}

export interface ReadSettings {
  hideContentByDefault: boolean;
  maskOptions: MaskOptions,   // 默认遮盖选项，如果笔记未指定遮盖选项，则使用默认选项
  fontSize: FontSize;
  fontFamily: FontFamily;
  spacing: Spacing;
  speechSettings?: SpeechSettings;  // 朗读设置
}



export const DEFAULT_MASK_OPTIONS: MaskOptions = {
  hideTitle: false,
  hideContent: false,
  enableHighlightedTextMask: true,
  enableBoldTextMask: true,
  enableSyntaxMask: true,
};


// 默认朗读设置
export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  mode: 'full',
  dictationRepeatCount: 3,
  playbackMode: 'single',
  speed: 1.0,
};

// 默认读取设置
export const DEFAULT_READ_SETTINGS: ReadSettings = {
  hideContentByDefault: true,
  fontSize: "base",
  fontFamily: "prose",
  spacing: "normal",
  maskOptions: DEFAULT_MASK_OPTIONS,
  speechSettings: DEFAULT_SPEECH_SETTINGS,
};



// 闪卡的遮盖模式
export interface MaskOptions {
  hideTitle?: boolean;          // 是否隐藏标题
  hideContent?: boolean;        // 是否隐藏正文内容
  enableHighlightedTextMask?: boolean;  // 是否遮盖高亮文本
  enableBoldTextMask?: boolean; // 是否遮盖加粗文本
  enableSyntaxMask?: boolean; // 是否遮盖语法标记
}


export const isValidMaskOptions = (options: any): boolean => {
  return options &&
    typeof options === 'object' &&
    (options.hideTitle === undefined || typeof options.hideTitle === 'boolean') &&
    (options.hideContent === undefined || typeof options.hideContent === 'boolean') &&
    (options.enableHighlightedTextMask === undefined || typeof options.enableHighlightedTextMask === 'boolean') &&
    (options.enableBoldTextMask === undefined || typeof options.enableBoldTextMask === 'boolean') &&
    (options.enableSyntaxMask === undefined || typeof options.enableSyntaxMask === 'boolean');
};


// 验证并规范化 MaskOptions
export const validateMaskOptions = (options: any): MaskOptions => {
  if (!isValidMaskOptions(options)) {
    return DEFAULT_MASK_OPTIONS;
  }
  return {
    hideTitle: options.hideTitle ?? DEFAULT_MASK_OPTIONS.hideTitle,
    hideContent: options.hideContent ?? DEFAULT_MASK_OPTIONS.hideContent,
    enableHighlightedTextMask: options.enableHighlightedTextMask ?? DEFAULT_MASK_OPTIONS.enableHighlightedTextMask,
    enableBoldTextMask: options.enableBoldTextMask ?? DEFAULT_MASK_OPTIONS.enableBoldTextMask,
    enableSyntaxMask: options.enableSyntaxMask ?? DEFAULT_MASK_OPTIONS.enableSyntaxMask,
  };
};


// 验证 SpeechMode
const isValidSpeechMode = (mode: any): mode is SpeechMode => {
  return mode === 'full' || mode === 'title' || mode === 'content';
};


// 验证 PlaybackMode
const isValidPlaybackMode = (mode: any): mode is PlaybackMode => {
  return mode === 'single' || mode === 'loop' || mode === 'dictation';
};


// 验证并规范化 SpeechSettings
export const validateSpeechSettings = (settings: any): SpeechSettings => {
  if (!settings || typeof settings !== 'object') {
    return DEFAULT_SPEECH_SETTINGS;
  }
  const mode = isValidSpeechMode(settings.mode) ? settings.mode : DEFAULT_SPEECH_SETTINGS.mode;
  const dictationRepeatCount = typeof settings.dictationRepeatCount === 'number' &&
    settings.dictationRepeatCount >= 1 && settings.dictationRepeatCount <= 10
    ? settings.dictationRepeatCount
    : DEFAULT_SPEECH_SETTINGS.dictationRepeatCount;
  const playbackMode = isValidPlaybackMode(settings.playbackMode) ? settings.playbackMode : DEFAULT_SPEECH_SETTINGS.playbackMode;
  const speed = typeof settings.speed === 'number' &&
    settings.speed >= 0.5 && settings.speed <= 2.0
    ? settings.speed
    : DEFAULT_SPEECH_SETTINGS.speed;
  return {
    mode,
    dictationRepeatCount,
    playbackMode,
    speed,
  };
};


// 验证 FontSize
const isValidFontSize = (size: any): size is FontSize => {
  return ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].includes(size);
};


// 验证 Spacing
const isValidSpacing = (spacing: any): spacing is Spacing => {
  return spacing === 'tight' || spacing === 'normal' || spacing === 'loose';
};


// 验证并规范化 ReadSettings
export const validateReadSettings = (settings: any): ReadSettings => {
  if (!settings || typeof settings !== 'object') {
    return DEFAULT_READ_SETTINGS;
  }
  const hideContentByDefault = typeof settings.hideContentByDefault === 'boolean'
    ? settings.hideContentByDefault
    : DEFAULT_READ_SETTINGS.hideContentByDefault;
  const fontSize = isValidFontSize(settings.fontSize)
    ? settings.fontSize
    : DEFAULT_READ_SETTINGS.fontSize;
  const fontFamily = typeof settings.fontFamily === 'string' && settings.fontFamily.trim().length > 0
    ? settings.fontFamily.trim()
    : DEFAULT_READ_SETTINGS.fontFamily;
  const spacing = isValidSpacing(settings.spacing)
    ? settings.spacing
    : DEFAULT_READ_SETTINGS.spacing;
  const maskOptions = validateMaskOptions(settings.maskOptions);
  const speechSettings = validateSpeechSettings(settings.speechSettings);
  return {
    hideContentByDefault,
    fontSize,
    fontFamily,
    spacing,
    maskOptions,
    speechSettings,
  };
};

