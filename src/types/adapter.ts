// @/core/types/adapter.ts
// 适配器相关的类型定义

import type { DatabaseAdapter } from 'delta-sync';
import type { Language } from '../locales/languages';
import type { NoolingoPlatform } from './platform';

// 音频适配器相关类型
export type VibrationType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'pattern';
export type SoundType = 'correct' | 'wrong';


export interface AudioAdapter {
    init(): Promise<boolean>;
    getCurrentLanguage(): string;
    on(event: string, callback: Function): void;
    off(event: string): void;
    vibrate(vibrationType: VibrationType): Promise<void>;
    playSound(soundId: SoundType): Promise<boolean>;
    speak(text: string, onDone: () => void): Promise<void>;
    setTextSpeechRate(speed: number): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
}


// 文件适配器相关类型
export interface FileInfo {
    exists: boolean;
    uri?: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
}


export interface FileAdapter {
    // 获取缓存目录路径
    getCacheDirectory(): string;
    
    // 获取文档目录路径
    getDocumentDirectory(): string;
    
    // 检查文件/目录是否存在
    getInfo(path: string): Promise<FileInfo>;
    
    // 创建目录
    makeDirectory(path: string, options?: { intermediates?: boolean }): Promise<void>;
    
    // 读取文件内容
    readAsString(path: string, encoding?: 'utf8' | 'base64'): Promise<string>;
    
    // 写入文件内容
    writeAsString(path: string, content: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
    
    // 删除文件/目录
    delete(path: string, options?: { idempotent?: boolean }): Promise<void>;
    
    // 列出目录内容
    readDirectory(path: string): Promise<string[]>;
}




// 配置存储适配器接口
export interface ConfigAdapter {
    set(key: string, value: any): void;
    get(key: string): any;
    delete(key: string): void;
}



// 通知适配器接口
export interface NotificationAdapter {
    configureNotifications(): Promise<void>;
    checkNotificationPermission(): Promise<boolean>;
    requestNotificationPermission(): Promise<boolean>;
    showInstantNotification(title: string, body: string, data?: Record<string, any>): Promise<boolean>;
    scheduleNotification(title: string, body: string, date: Date, data?: Record<string, any>): Promise<boolean>;
    cancelAllScheduledNotifications(): Promise<void>;
}


/** 设备能力（系统语言、分发平台标识、剪贴板等，与平台 API 解耦，由应用启动时注入） */
export interface DeviceAdapter {
    getDeviceLanguage(): Language;
    getPlatform(): NoolingoPlatform;
    copyToClipboard(text: string): Promise<void>;
}


/** 构建期/环境常量（版本号、后端与 OSS 基址、业务参数等，由应用启动时注入） */
export interface AppConfigAdapter {
    appVersion: string;
    appName: string;
    appPlatform: string;
    ossOriginUrl: string;
    ossCdnUrl: string;
    apiBaseUrl: string;
    apiBaseUrlCandidates?: string[];
    apiProbePath?: string;
    dailyTarget: number;
}


/** 注入到 core 的平台适配器集合（noolingo 构造参数） */
export interface NoolingoAdapter {
    audio: AudioAdapter;
    file: FileAdapter;
    config: ConfigAdapter;
    notification: NotificationAdapter;
    localDatabase: DatabaseAdapter;
    device: DeviceAdapter;
    appConfig: AppConfigAdapter;
}
