// 各宿主共用的默认配置；宿主 config 中通过 mergeAppDefaults(overrides) 覆盖


export interface AppDefaults {
    APP_NAME?: string;
    APP_VERSION?: string;
    OSS_CDN_URL: string;
    OSS_ORIGIN_URL: string;
    DAILY_TARGET: number;
    QUIZ_INTERVAL_DAYS: number;
    API_BASE_URL: string;
    API_BASE_URL_CANDIDATES: readonly string[];
}


export const APP_DEFAULTS: AppDefaults = {
    OSS_CDN_URL: 'https://oss.noolingo.com',
    OSS_ORIGIN_URL: 'https://noolingo.oss-cn-shanghai.aliyuncs.com',
    DAILY_TARGET: 20,
    QUIZ_INTERVAL_DAYS: 3,
    API_BASE_URL: 'https://noolingshanghai-owksckamfp.cn-shanghai.fcapp.run',
    API_BASE_URL_CANDIDATES: [
        'https://noolingingapore-kpkjaakthx.ap-southeast-1.fcapp.run',
    ],
};


export function mergeAppDefaults<T extends object>(defaults: T, overrides: Partial<T>): T {
    const result = { ...defaults } as T;
    for (const key of Object.keys(overrides) as (keyof T)[]) {
        const v = overrides[key];
        if (v !== undefined) {
            (result as Record<keyof T, unknown>)[key] = v as T[keyof T];
        }
    }
    return result;
}
