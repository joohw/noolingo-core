// @/core/cloud/core
// 访问noolingo clound的核心服务，集成了token管理

import { getAdapter } from "../adapter";
import { ConfigKey, configManager } from "../storage/configManager"
import { convertErrorMessage } from "../utils/error";



function normalizeApiBase(s: string): string {
    const t = s.trim();
    if (!t) return '';
    return t.endsWith('/') ? t.slice(0, -1) : t;
}


function dedupeApiBases(bases: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const b of bases) {
        const n = normalizeApiBase(b);
        if (!n || seen.has(n)) continue;
        seen.add(n);
        out.push(n);
    }
    return out;
}


function createFetchTimeoutMs(ms: number): { signal: AbortSignal; clear: () => void } {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    return { signal: c.signal, clear: () => clearTimeout(t) };
}


function perfNow(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
}


// 通用的API响应接口
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    tokens?:
    {
        accessToken: string;
        refreshToken: string;
    }
}


export class NooCore {


    protected accessToken: string | null = null;
    protected refreshToken: string | null = null;
    private resolvedApiBase: string | null = null;
    private resolvingApiBase: Promise<void> | null = null;


    /** 从持久化恢复 refreshToken；须在适配器注入之后调用，由 `initServices()` 统一执行 */
    init(): void {
        this.restoreRefreshToken();
    }


    /** 解析并缓存当前应使用的 API 根地址（多候选时并行测延迟选最快） */
    public async resolveApiBaseUrl(): Promise<void> {
        if (this.resolvedApiBase !== null) {
            return;
        }
        if (this.resolvingApiBase) {
            await this.resolvingApiBase;
            return;
        }
        const cfg = getAdapter().appConfig;
        const primary = normalizeApiBase(cfg.apiBaseUrl);
        if (!primary) {
            return;
        }
        const all = dedupeApiBases([primary, ...(cfg.apiBaseUrlCandidates ?? [])]);
        if (all.length <= 1) {
            this.resolvedApiBase = primary;
            return;
        }
        const probeRaw = cfg.apiProbePath ?? '/health';
        const probePath = probeRaw.startsWith('/') ? probeRaw : `/${probeRaw}`;
        this.resolvingApiBase = (async () => {
            const results = await Promise.all(
                all.map(async (base) => {
                    const t0 = perfNow();
                    const { signal, clear } = createFetchTimeoutMs(8000);
                    try {
                        await fetch(`${base}${probePath}`, { method: 'GET', signal, cache: 'no-store' });
                        clear();
                        return { base, ms: perfNow() - t0, ok: true as const };
                    } catch {
                        clear();
                        return { base, ms: Number.POSITIVE_INFINITY, ok: false as const };
                    }
                })
            );
            const successes = results.filter((r) => r.ok && Number.isFinite(r.ms));
            successes.sort((a, b) => a.ms - b.ms);
            this.resolvedApiBase = successes.length > 0 ? successes[0].base : primary;
        })();
        try {
            await this.resolvingApiBase;
        } finally {
            this.resolvingApiBase = null;
        }
    }


    /** 当前生效的 API 根地址（未探测完成前为主配置 apiBaseUrl） */
    public getApiBaseUrl(): string {
        const primary = normalizeApiBase(getAdapter().appConfig.apiBaseUrl);
        return this.resolvedApiBase ?? primary;
    }


    public async checkLoginState(): Promise<boolean> {
        try {
            if (!this.refreshToken) {
                return false;
            }
            return await this.refreshAccessToken();
        } catch (error) {
            console.error('Check login state failed:', error);
            return false;
        }
    }


    // 核心fetch方法
    public async fetch<T = any>(
        path: string,
        options: RequestInit & {
            needAuth?: boolean;
        } = {}
    ): Promise<ApiResponse<T>> {
        const {
            needAuth = true,
            headers: customHeaders,
            ...fetchOptions
        } = options;
        const cfg = getAdapter().appConfig;
        let mergedHeaders: Record<string, string> = {
            ...(customHeaders as Record<string, string> || {}),
            'X-Client-Platform': cfg.appPlatform,
            'X-Client-Version': cfg.appVersion,
            'X-Client-Name': cfg.appName
        };
        if (!('Content-Type' in mergedHeaders) && !(fetchOptions.body instanceof FormData)) {
            mergedHeaders['Content-Type'] = 'application/json';
        }
        if (needAuth) {
            mergedHeaders = await this.ensureAccessToken(mergedHeaders);
        }
        const fullUrl = this.getFullUrl(path);
        try {
            const response = await fetch(
                fullUrl,
                {
                    headers: mergedHeaders,
                    ...fetchOptions
                }
            );
            const result: ApiResponse<T> = await response.json();
            if (result.tokens) {
                const { accessToken, refreshToken } = result.tokens;
                this.saveRefreshToken(refreshToken);
                this.accessToken = accessToken;
                this.refreshToken = refreshToken;
            }
            if (!response.ok || !result.success) {
                throw new Error(result.message || `请求失败: ${response.status}`);
            }
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                const errorCode = convertErrorMessage(error.message);
                return {
                    success: false,
                    message: errorCode
                };
            }
            return {
                success: false,
                message: 'Unknown error'
            };
        }
    }


    // 清除token
    public clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
        this.saveRefreshToken(null);
    }


    // token管理方法
    private saveRefreshToken(token: string | null) {
        try {
            if (token) {
                configManager.saveConfig(ConfigKey.REFRESH_TOKEN, token);
            } else {
                configManager.removeConfig(ConfigKey.REFRESH_TOKEN);
            }
        } catch (error) {
            console.error('Failed to save refresh token:', error);
        }
    }


    // 保存refreshToken
    private restoreRefreshToken() {
        try {
            const savedToken = configManager.getConfig<string>(ConfigKey.REFRESH_TOKEN);
            if (savedToken) {
                this.refreshToken = savedToken;
            }
        } catch (error) {
            console.error('Failed to restore refresh token:', error);
        }
    }


    // 在请求头中添加访问token
    private async ensureAccessToken(headers: Record<string, string> = {}): Promise<Record<string, string>> {
        if (!this.accessToken) {
            if (this.refreshToken) {
                try {
                    const success = await this.refreshAccessToken();
                    if (!success) {
                        throw new Error('error.token_refresh_failed');
                    }
                } catch (error) {
                    console.error('Failed to refresh access token:', error);
                    if (error instanceof Error) {
                        throw new Error(error.message);
                    }
                    throw new Error('error.token_refresh_failed');
                }
            } else {
                throw new Error('error.not_logged_in');
            }
        }
        return {
            ...headers,
            'Authorization': `Bearer ${this.accessToken}`
        };
    }



    // 刷新accessToken
    async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            throw new Error('error.no_refresh_token');
        }
        try {
            const cfg = getAdapter().appConfig;
            const response = await fetch(this.getFullUrl('/auth/refresh'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`,
                    'X-Client-Platform': cfg.appPlatform,
                    'X-Client-Version': cfg.appVersion,
                    'X-Client-Name': cfg.appName
                },
                body: JSON.stringify({})
            });
            const result = await response.json();
            if (response.ok && result.success && result.tokens) {
                const { accessToken, refreshToken } = result.tokens;
                this.saveRefreshToken(refreshToken);
                this.accessToken = accessToken;
                this.refreshToken = refreshToken;
                return true;
            }
            const errorMessage = result.message || `Token refresh failed with status: ${response.status}`;
            throw new Error(errorMessage);
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('error.network_error');
            }
            throw error;
        }
    }


    // 使用生成的共享token进行登录
    public async signinWithShareToken(shareToken: string): Promise<boolean> {
        try {
            if (!shareToken || !shareToken.endsWith('.share')) {
                throw new Error('Invalid share token format');
            }
            const encoded = shareToken.slice(0, -6).split('').reverse().join('');
            const jsonStr = atob(encoded);
            const tokenData = JSON.parse(jsonStr);
            const tokenAge = Date.now() - tokenData.timestamp;
            if (tokenAge > 1 * 60 * 60 * 1000) { // 1小时过期
                throw new Error('Share token expired');
            }
            this.refreshToken = tokenData.token;
            this.saveRefreshToken(tokenData.token);
            const success = await this.refreshAccessToken();
            if (!success) {
                throw new Error('Failed to refresh access token');
            }
            return true;
        } catch (error) {
            console.error('Failed to signin with share token:', error);
            this.clearTokens();
            return false;
        }
    }


    // 获得可用于在多个站点登录的token
    public async getShareableToken(): Promise<string> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        try {
            const tokenData = {
                token: this.refreshToken,
                timestamp: Date.now(),
            };
            const jsonStr = JSON.stringify(tokenData);
            const encoded = btoa(jsonStr);
            return encoded.split('').reverse().join('') + '.share';
        } catch (error) {
            console.error('Failed to generate shareable token:', error);
            throw new Error('Failed to generate shareable token');
        }
    }


    // 在请求时追加完整链接
    public getFullUrl(path: string): string {
        const baseUrl = this.getApiBaseUrl();
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const fullUrl = `${baseUrl}${normalizedPath}`;
        return fullUrl;
    }



    async uploadFile(
        file: File | Blob | { uri: string; type?: string; name?: string; size?: number },
    ): Promise<ApiResponse<{ url: string }>> {
        try {
            const formData = new FormData();
            const isUriObject = !(file instanceof File) && !(file instanceof Blob) && 'uri' in file;
            if (isUriObject) {
                const uriFile = file as { uri: string; type?: string; name?: string; };
                formData.append('file', {
                    uri: uriFile.uri,
                    type: uriFile.type || 'image/jpeg',
                    name: uriFile.name || `image_${Date.now()}.jpg`,
                } as any);
            } else {
                let blob: Blob;
                let fileName = `image_${Date.now()}.jpg`;
                if (file instanceof File) {
                    blob = file;
                    fileName = file.name || fileName;
                } else {
                    blob = file;
                }
                formData.append('file', blob, fileName);
            }
            const response = await this.fetch('/image/upload', {
                method: 'POST',
                body: formData,
            });
            console.log('Upload response:', response);
            return response;
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }


}

export const Core = new NooCore();
export default Core;