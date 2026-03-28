// @/lib/rnCacheAdapter.ts

import { adapter } from '../adapter';

interface CacheItem {
    id: string;
    data: any;
    ts: number;
    type: string;
}


export class RNCacheAdapter {

    private _cacheDir: string | null = null;
    private isInitialized: boolean = false;

    /** 首次访问时解析（须在 `new Noolingo(adapter)` 之后） */
    private get cacheDir(): string {
        if (!this._cacheDir) {
            this._cacheDir = `${adapter.file.getCacheDirectory()}noolingo_cache/`;
        }
        return this._cacheDir;
    }


    /** 初始化缓存目录 */
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) return;
        try {
            const dirInfo = await adapter.file.getInfo(this.cacheDir);
            if (!dirInfo.exists) {
                await adapter.file.makeDirectory(this.cacheDir, {
                    intermediates: true,
                });
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize cache directory:', error);
            throw error;
        }
    }



    /** 获取缓存文件路径 */
    private getFilePath(id: string): string {
        // 对ID进行简单编码，避免非法文件名字符
        const encodedId = encodeURIComponent(id);
        return `${this.cacheDir}${encodedId}.json`;
    }


    /** 写/覆盖一条缓存 */
    async write(id: string, data: any): Promise<void> {
        await this.ensureInitialized();
        const filePath = this.getFilePath(id);
        const cacheItem: CacheItem = {
            id,
            data,
            ts: Date.now(),
            type: this.getDataType(data),
        };
        try {
            // 如果是Blob类型，需要特殊处理
            if (data instanceof Blob) {
                await this.writeBlobData(id, data, cacheItem);
                return;
            }
            // 对于其他类型，直接存储为JSON
            await adapter.file.writeAsString(
                filePath,
                JSON.stringify(cacheItem)
            );
        } catch (error) {
            console.error(`Failed to write cache for id: ${id}`, error);
            throw error;
        }
    }


    /** 处理Blob数据的写入 */
    private async writeBlobData(id: string, blob: Blob, cacheItem: CacheItem): Promise<void> {
        const jsonFilePath = this.getFilePath(id);
        const blobFilePath = `${this.cacheDir}${encodeURIComponent(id)}_blob`;
        try {
            // 将Blob转换为base64存储
            const base64Data = await this.blobToBase64(blob);
            cacheItem.data = base64Data; // 将data替换为base64字符串
            // 存储元数据
            await adapter.file.writeAsString(
                jsonFilePath,
                JSON.stringify(cacheItem)
            );
        } catch (error) {
            console.error(`Failed to write blob data for id: ${id}`, error);
            throw error;
        }
    }

    
    /** Blob转base64 */
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // 移除data URL前缀
                const base64 = base64data.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /** base64转Blob */
    private base64ToBlob(base64: string, contentType: string = ''): Blob {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }

    /** 读缓存，不存在返回 null */
    async read(id: string): Promise<any | null> {
        await this.ensureInitialized();

        const filePath = this.getFilePath(id);

        try {
            const fileInfo = await adapter.file.getInfo(filePath);
            if (!fileInfo.exists) {
                return null;
            }

            const fileContent = await adapter.file.readAsString(filePath);
            const cacheItem: CacheItem = JSON.parse(fileContent);

            // 处理Blob类型的数据
            if (cacheItem.type === 'blob' && typeof cacheItem.data === 'string') {
                cacheItem.data = this.base64ToBlob(cacheItem.data);
            }

            return cacheItem.data;
        } catch (error) {
            console.error(`Failed to read cache for id: ${id}`, error);
            return null;
        }
    }

    /** 删除一条缓存 */
    async delete(id: string): Promise<void> {
        await this.ensureInitialized();

        const filePath = this.getFilePath(id);

        try {
            const fileInfo = await adapter.file.getInfo(filePath);
            if (fileInfo.exists) {
                await adapter.file.delete(filePath);
            }
        } catch (error) {
            console.error(`Failed to delete cache for id: ${id}`, error);
            throw error;
        }
    }



    /** 清理过期条目（默认 30 天） */
    async evict(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
        await this.ensureInitialized();
        try {
            const files = await adapter.file.readDirectory(this.cacheDir);
            const now = Date.now();
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = `${this.cacheDir}${file}`;
                    try {
                        const fileContent = await adapter.file.readAsString(filePath);
                        const cacheItem: CacheItem = JSON.parse(fileContent);
                        if (now - cacheItem.ts > maxAge) {
                            await adapter.file.delete(filePath);
                            // 如果是Blob数据，删除对应的blob文件
                            if (cacheItem.type === 'blob') {
                                const blobFilePath = filePath.replace('.json', '_blob');
                                const blobFileInfo = await adapter.file.getInfo(blobFilePath);
                                if (blobFileInfo.exists) {
                                    await adapter.file.delete(blobFilePath);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to process cache file: ${file}`, error);
                        // 继续处理其他文件
                    }
                }
            }
        } catch (error) {
            console.error('Failed to evict expired cache:', error);
            throw error;
        }
    }


    /** 获取所有缓存键 */
    async keys(): Promise<string[]> {
        await this.ensureInitialized();
        try {
            const files = await adapter.file.readDirectory(this.cacheDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const encodedId = file.replace('.json', '');
                    return decodeURIComponent(encodedId);
                });
        } catch (error) {
            console.error('Failed to get cache keys:', error);
            return [];
        }
    }


    /** 清空所有缓存 */
    async clear(): Promise<void> {
        await this.ensureInitialized();
        try {
            await adapter.file.delete(this.cacheDir, { idempotent: true });
            await adapter.file.makeDirectory(this.cacheDir, {
                intermediates: true,
            });
        } catch (error) {
            console.error('Failed to clear cache:', error);
            throw error;
        }
    }


    /** 获取缓存大小（字节） */
    async getCacheSize(): Promise<number> {
        await this.ensureInitialized();
        try {
            const files = await adapter.file.readDirectory(this.cacheDir);
            let totalSize = 0;

            for (const file of files) {
                const filePath = `${this.cacheDir}${file}`;
                const fileInfo = await adapter.file.getInfo(filePath);
                if (fileInfo.exists && fileInfo.size !== undefined) {
                    totalSize += fileInfo.size;
                }
            }
            return totalSize;
        } catch (error) {
            console.error('Failed to get cache size:', error);
            return 0;
        }
    }


    /** 获取数据类型 */
    private getDataType(data: any): string {
        if (data instanceof Blob) return 'blob';
        if (typeof data === 'string') return 'string';
        if (typeof data === 'number') return 'number';
        if (typeof data === 'boolean') return 'boolean';
        if (data === null) return 'null';
        if (Array.isArray(data)) return 'array';
        if (typeof data === 'object') return 'object';
        return 'unknown';
    }
}


// 创建单例实例
export const cacheManager = new RNCacheAdapter();
export default cacheManager;