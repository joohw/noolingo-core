// @/core/utils/language.ts


import { ConfigKey, configManager } from "../storage/configManager";
import { Language, DEFAULT_LANGUAGE } from "../locales/languages";
import { getAdapter } from "../adapter";


// 获取初始语言
export const getSavedLanguage = async (withDefault: boolean = true): Promise<Language | undefined> => {
  const savedLanguage = configManager.getConfig<Language>(ConfigKey.APP_LANGUAGE);
  if (withDefault) {
    return savedLanguage || Language.EN;
  }
  return savedLanguage || undefined;
};


// 获取AI输出语言
export async function getAiLanguage(): Promise<Language> {
  const aiOutputLanguage = configManager.getConfig<Language>(ConfigKey.AI_OUTPUT_LANGUAGE);
  if (aiOutputLanguage) {
    return aiOutputLanguage;
  }
  const savedLanguage = await getSavedLanguage(false);
  if (savedLanguage) {
    return savedLanguage;
  }
  const deviceLanguage = getAdapter().device.getDeviceLanguage();
  return deviceLanguage || DEFAULT_LANGUAGE;
}



// 保存AI输出语言
export function saveAILanguage(language: Language): void {
  configManager.saveConfig(ConfigKey.AI_OUTPUT_LANGUAGE, language);
}


// 清除AI输出语言设置（跟随应用语言）
export function clearAILanguage(): void {
  configManager.removeConfig(ConfigKey.AI_OUTPUT_LANGUAGE);
}

