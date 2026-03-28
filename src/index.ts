import { setAdapter } from './adapter';
import { initServices, service } from './services';
import { stores } from './stores';
import { initSettingStoreFromConfig } from './stores/settingStore';
import { configManager } from './storage/configManager';
import { visitManager } from './storage/visitManager';
import type { NoolingoAdapter } from './types/adapter';



export { APP_DEFAULTS, mergeAppDefaults } from './constants/appDefaults';
export type { AppDefaults } from './constants/appDefaults';
export type { NoolingoStores } from './stores';
export { initSettingStoreFromConfig } from './stores/settingStore';
export * from './note';
export * from './deck';
export * from './quiz';
export * from './fsrs';
export * from './locales/languages';
export { getAdapter, adapter } from './adapter';
export * from './types';



/** 应用入口用平台适配器；服务、stores、config、visit 与 init 仅通过实例访问，见宿主 bootstrap */
export class Noolingo {
    static instance: Noolingo | null = null;
    readonly adapter: NoolingoAdapter;
    readonly service = service;
    readonly stores = stores;
    readonly config = configManager;
    readonly visit = visitManager;
    readonly init = initServices;

    constructor(platformAdapter: NoolingoAdapter) {
        setAdapter(platformAdapter);
        this.adapter = platformAdapter;
        Noolingo.instance = this;
        initSettingStoreFromConfig();
    }
}

export default Noolingo;
