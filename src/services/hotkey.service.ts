// @/services/hotkey.service.ts
import { Service } from './service'
import { configManager, ConfigKey } from 'noolingo-core/storage/configManager';

export type HotKeyType = {
    id: string;
    key: string;
};


export const DEFAULT_HOTKEYS: HotKeyType[] = [
    { id: 'NEXT_CARD', key: 'ARROWRIGHT' },
    { id: 'PREVIOUS_CARD', key: 'ARROWLEFT' },
    { id: 'FLIP_CARD', key: 'ARROWUP' },
    { id: 'FLIP_CARD', key: 'ARROWDOWN' },
    { id: 'REVEAL_OR_RATE', key: 'ARROWDOWN' },
    { id: 'REVEAL_OR_RATE', key: 'ARROWUP' },
    { id: 'SELECT_PREVIOUS', key: 'ARROWLEFT' },
    { id: 'SELECT_NEXT', key: 'ARROWRIGHT' },
];


export class HotKeyService implements Service {
    private static instance: HotKeyService | null = null;
    private hotKeysRef = new Map<string, Array<() => void>>();
    private hotKeysConfigRef = new Map<string, HotKeyType[]>();


    private constructor() {
        this.loadConfig();
        this.initKeyboardListener();
    }

    async init() {
        console.log('HotKeyService 初始化完成');
    }

    public static getInstance(): HotKeyService {
        if (!HotKeyService.instance) {
            HotKeyService.instance = new HotKeyService();
            console.log('快捷键服务初始化完成');
        }
        return HotKeyService.instance;
    }


    private loadConfig() {
        const savedHotKeys = configManager.getConfig<Record<string, HotKeyType>>(ConfigKey.HOTKEY_SET);
        DEFAULT_HOTKEYS.forEach(hotkey => {
            const savedHotKey = savedHotKeys?.[hotkey.id];
            const existingConfigs = this.hotKeysConfigRef.get(hotkey.id) || [];
            this.hotKeysConfigRef.set(hotkey.id, [...existingConfigs, {
                ...hotkey,
                key: savedHotKey?.key || hotkey.key
            }]);
        });
    }


    private initKeyboardListener() {
        window.addEventListener('keydown', this.handleKeyDown);
    }


    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }
        if (!event?.key) return;
        const key = event.key.toLowerCase();
        let keyCombo = key === 'arrowleft' ? 'ARROWLEFT' :
            key === 'arrowright' ? 'ARROWRIGHT' :
                key === 'arrowup' ? 'ARROWUP' :
                    key === 'arrowdown' ? 'ARROWDOWN' :
                        `${event.ctrlKey ? 'CTRL+' : ''}${event.shiftKey ? 'SHIFT+' : ''}${key}`.toUpperCase();

        for (const [id, callbacks] of this.hotKeysRef.entries()) {
            const hotkeys = this.hotKeysConfigRef.get(id) || [];
            const matchedHotkey = hotkeys.find(hotkey => hotkey.key === keyCombo);
            if (matchedHotkey) {
                event.preventDefault(); // 阻止事件继续传播
                event.stopPropagation();
                callbacks.forEach(callback => callback());
            }
        }
    };


    public registerHotKey(id: string, callback: () => void) {
        const callbacks = this.hotKeysRef.get(id) || [];
        this.hotKeysRef.set(id, [...callbacks, callback]);
    }


    public unregisterHotKey(id: string) {
        this.hotKeysRef.delete(id);
    }


    public updateHotKey(id: string, index: number, newKey: string) {
        const hotkeys = this.hotKeysConfigRef.get(id);
        if (hotkeys && hotkeys[index]) {
            const updatedHotkeys = [...hotkeys];
            updatedHotkeys[index] = {
                ...updatedHotkeys[index],
                key: newKey.toUpperCase()
            };
            this.hotKeysConfigRef.set(id, updatedHotkeys);
            this.saveHotKeys();
        }
    }


    public getHotKey(id: string): HotKeyType[] | undefined {
        return this.hotKeysConfigRef.get(id);
    }


    public getRegisteredHotKeys(): HotKeyType[] {
        return Array.from(this.hotKeysRef.keys())
            .flatMap(id => this.hotKeysConfigRef.get(id) || []);
    }

    private saveHotKeys() {
        const hotKeysObject = Array.from(this.hotKeysConfigRef.entries()).reduce(
            (acc, [id, hotkeys]) => ({
                ...acc,
                [id]: hotkeys[0]
            }),
            {}
        );
        configManager.saveConfig(ConfigKey.HOTKEY_SET, hotKeysObject);
    }


    public destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        HotKeyService.instance = null;
    }

    public getRegisteredCallbacks(id: string): Array<() => void> | undefined {
        return this.hotKeysRef.get(id);
    }

}


export const hotKeyService = HotKeyService.getInstance();
export default hotKeyService;