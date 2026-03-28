// @/types/languages.ts
// 语言类型声明,更安全的语言枚举



// 定义语言枚举类型
export enum Language {
  ZH = 'zh',
  TW = 'tw',
  EN = 'en',
  US = 'us',
  JA = 'ja',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  KO = 'ko',
  PT = 'pt',
  BR = 'br',
  RU = 'ru',
}

export const DEFAULT_LANGUAGE = Language.ZH;


// 定义语言基础映射表
export const LANGUAGE_BASE_MAP: Record<Language, string> = {
  [Language.ZH]: 'zh-CN',     // 简体中文
  [Language.TW]: 'zh-TW',     // 繁体中文
  [Language.EN]: 'en-GB',     // 英式英语
  [Language.US]: 'en-US',     // 美式英语
  [Language.JA]: 'ja-JP',     // 日语
  [Language.ES]: 'es-ES',     // 西班牙语（西班牙）
  [Language.FR]: 'fr-FR',     // 法语（法国）
  [Language.DE]: 'de-DE',     // 德语
  [Language.KO]: 'ko-KR',     // 韩语
  [Language.PT]: 'pt-PT',     // 葡萄牙语（欧洲）
  [Language.BR]: 'pt-BR',     // 葡萄牙语（巴西）
  [Language.RU]: 'ru-RU',     // 俄语
};


// 定义语言基础映射表
export const LANGUAGE_TEXT_MAP: Record<Language, string> = {
  [Language.DE]: 'Deutsch',        // German
  [Language.EN]: 'English',        // English (British)
  [Language.US]: 'English (US)',   // English (American)
  [Language.ES]: 'Español',        // Spanish
  [Language.FR]: 'Français',       // French
  [Language.JA]: '日本語',         // Japanese
  [Language.KO]: '한국어',         // Korean
  [Language.PT]: 'Português',      // Portuguese (European)
  [Language.BR]: 'Português (BR)', // Portuguese (Brazilian)
  [Language.RU]: 'Русский',        // Russian
  [Language.TW]: '中文（繁體）',       // Chinese (Traditional)
  [Language.ZH]: '中文（简体）',           // Chinese (Simplified)
};


// 定义可用语言列表（按字母顺序排序，避免政治表达）
export const AVAILABLE_LANGUAGES: Language[] = [
  Language.DE,  // Deutsch
  Language.EN,  // English
  Language.US,  // English (US)
  Language.ES,  // Español
  Language.FR,  // Français
  Language.JA,  // 日本語
  Language.KO,  // 한국어
  Language.PT,  // Português
  Language.BR,  // Português (BR)
  Language.RU,  // Русский
  Language.TW,  // 繁體中文
  Language.ZH,  // 中文
];



// 获取语言对应的默认国家代码
export function getDefaultCountryCodeByLanguage(language: string): string {
  const languageToCountryCode: Record<string, string> = {
    [Language.ZH]: "+86", // Chinese -> China
    [Language.TW]: "+886", // Traditional Chinese -> Taiwan
    [Language.EN]: "+44",  // English -> UK
    [Language.US]: "+1",  // English (US) -> US
    [Language.JA]: "+81", // Japanese -> Japan
    [Language.KO]: "+82", // Korean -> South Korea
    [Language.ES]: "+34", // Spanish -> Spain
    [Language.FR]: "+33", // French -> France
    [Language.DE]: "+49", // German -> Germany
    [Language.PT]: "+351", // Portuguese -> Portugal
    [Language.BR]: "+55",  // Portuguese (Brazil) -> Brazil
    [Language.RU]: "+7",   // Russian -> Russia
  };
  return languageToCountryCode[language] || "+1"; // Default to US if language not found
}


// 使用电话号码作为登录方式的国家
export const COUNTRY_CODES = [
  { code: "+86", flag: "🇨🇳", nameKey: "China" },
  { code: "+852", flag: "🇭🇰", nameKey: "China Hongkong" },
  { code: "+853", flag: "🇲🇴", nameKey: "China Macau" },
  { code: "+886", flag: "🇹🇼", nameKey: "China Taiwan" },
  { code: "+1", flag: "🇺🇸", nameKey: "USA" },
  { code: "+1", flag: "🇨🇦", nameKey: "Canada" },
  { code: "+44", flag: "🇬🇧", nameKey: "UK" },
  { code: "+81", flag: "🇯🇵", nameKey: "Japan" },
  { code: "+82", flag: "🇰🇷", nameKey: "korea" },
  { code: "+65", flag: "🇸🇬", nameKey: "Singapore" },
  { code: "+61", flag: "🇦🇺", nameKey: "Australia" },
  { code: "+49", flag: "🇩🇪", nameKey: "Germany" },
  { code: "+33", flag: "🇫🇷", nameKey: "France" },
];


export function getLanguageCode(language: Language): string {
  const languageMap: Record<string, string> = {
    [Language.ZH]: 'zh-CN',
    [Language.TW]: 'zh-TW',
    [Language.EN]: 'en-GB',
    [Language.US]: 'en-US',
    [Language.JA]: 'ja-JP',
    [Language.ES]: 'es-ES',
    [Language.FR]: 'fr-FR',
    [Language.DE]: 'de-DE',
    [Language.KO]: 'ko-KR',
    [Language.PT]: 'pt-PT',
    [Language.BR]: 'pt-BR',
    [Language.RU]: 'ru-RU',
  };
  return languageMap[language] || 'en-US';
}




