/**
 * 最小空实现：供本地试验 / 单元测试接线，不保证 init 全流程成功。
 */
import type { DatabaseAdapter } from 'delta-sync';
import type {
    AppConfigAdapter,
    AudioAdapter,
    ConfigAdapter,
    DeviceAdapter,
    FileAdapter,
    NotificationAdapter,
    NoolingoAdapter,
} from '../src/types/adapter';
import { Language } from '../src/locales/languages';

export function createStubDatabaseAdapter(): DatabaseAdapter {
    return {
        async listStoreItems() {
            return { items: [], hasMore: false, offset: 0 };
        },
        async readStore() {
            return { items: [], hasMore: false };
        },
        async readBulk() {
            return [];
        },
        async putBulk(_storeName, items) {
            return items;
        },
        async deleteBulk() {},
        async clearStore() {
            return true;
        },
    };
}

export const stubAudioAdapter: AudioAdapter = {
    async init() {
        return true;
    },
    getCurrentLanguage() {
        return '';
    },
    on() {},
    off() {},
    async vibrate() {},
    async playSound() {
        return true;
    },
    async speak(_text, onDone) {
        onDone();
    },
    async setTextSpeechRate() {},
    async pause() {},
    async stop() {},
};

export const stubFileAdapter: FileAdapter = {
    getCacheDirectory() {
        return '/tmp/noolingo-example-cache';
    },
    getDocumentDirectory() {
        return '/tmp/noolingo-example-docs';
    },
    async getInfo() {
        return { exists: false };
    },
    async makeDirectory() {},
    async readAsString() {
        return '';
    },
    async writeAsString() {},
    async delete() {},
    async readDirectory() {
        return [];
    },
};

const stubConfigStore = new Map<string, unknown>();

export const stubConfigAdapter: ConfigAdapter = {
    set(key, value) {
        stubConfigStore.set(key, value);
    },
    get(key) {
        return stubConfigStore.get(key);
    },
    delete(key) {
        stubConfigStore.delete(key);
    },
};

export const stubNotificationAdapter: NotificationAdapter = {
    async configureNotifications() {},
    async checkNotificationPermission() {
        return false;
    },
    async requestNotificationPermission() {
        return false;
    },
    async showInstantNotification() {
        return false;
    },
    async scheduleNotification() {
        return false;
    },
    async cancelAllScheduledNotifications() {},
};

export const stubDeviceAdapter: DeviceAdapter = {
    getDeviceLanguage() {
        return Language.ZH;
    },
    getPlatform() {
        return 'web';
    },
    async copyToClipboard() {},
};

export const stubAppConfigAdapter: AppConfigAdapter = {
    appVersion: '0.0.0-example',
    appName: 'NoolingoExample',
    appPlatform: 'web',
    ossOriginUrl: '',
    ossCdnUrl: '',
    apiBaseUrl: 'http://localhost',
    dailyTarget: 0,
};

export function createStubNoolingoAdapter(): NoolingoAdapter {
    return {
        audio: stubAudioAdapter,
        file: stubFileAdapter,
        config: stubConfigAdapter,
        notification: stubNotificationAdapter,
        localDatabase: createStubDatabaseAdapter(),
        device: stubDeviceAdapter,
        appConfig: stubAppConfigAdapter,
    };
}
