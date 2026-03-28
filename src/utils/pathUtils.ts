// @/core/utils/pathUtils.ts


/**
 * 计算路径的 key，用于比较和存储
 * @param path 路径数组，可以是空数组 []
 * @returns 路径的 JSON 字符串表示
 */
export function getPathKey(path: string[] | null | undefined): string {
    if (path === null || path === undefined) {
        return JSON.stringify([]);
    }
    return JSON.stringify(path);
}


/**
 * 计算完整的选中 key（包含 deckId 和 path）
 * @param deckId deck ID
 * @param path 路径数组，可以是 null（表示选择整个 deck）
 * @returns 完整的选中 key，格式为 "deckId:pathKey"
 */
export function getSelectedPathKey(deckId: string | undefined, path: string[] | null | undefined): string | undefined {
    if (!deckId) return undefined;
    const pathKey = getPathKey(path);
    return `${deckId}:${pathKey}`;
}

