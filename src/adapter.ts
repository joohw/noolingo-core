// @/core/adapter.ts
// 统一管理外部适配器，实现依赖注入和解耦

import type { NoolingoAdapter } from './types/adapter';

let _adapter: NoolingoAdapter | null = null;

export function setAdapter(next: NoolingoAdapter): void {
    _adapter = next;
}

export function getAdapter(): NoolingoAdapter {
    if (!_adapter) {
        throw new Error(
            '[noolingo] Adapter not set. Construct `new Noolingo(adapter)` in app bootstrap (import bootstrap before other app modules).',
        );
    }
    return _adapter;
}

/** 与历史代码兼容：在 `new Noolingo(adapter)` 之后通过 getter 访问已注入的适配器 */
export const adapter: NoolingoAdapter = {
    get audio() {
        return getAdapter().audio;
    },
    get file() {
        return getAdapter().file;
    },
    get config() {
        return getAdapter().config;
    },
    get notification() {
        return getAdapter().notification;
    },
    get localDatabase() {
        return getAdapter().localDatabase;
    },
    get device() {
        return getAdapter().device;
    },
    get appConfig() {
        return getAdapter().appConfig;
    },
};
