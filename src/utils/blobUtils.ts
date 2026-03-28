// @/utils/blobUtils.ts



// 辅助函数：转换为 Data URL
export async function convertToDataUrl(data: Uint8Array): Promise<string> {
    const base64 = safeBase64Encode(data);
    const mimeType = detectMimeType(data) || 'image/jpeg';
    const originalBase64 = `data:${mimeType};base64,${base64}`;
    try {
        return  originalBase64;
    } catch (error) {
        console.warn('图片压缩失败，使用原图:', error);
        return originalBase64;
    }
}


// 安全地进行base64编码
function safeBase64Encode(uint8Array: Uint8Array): string {
    const chunkSize = 8192;
    let result = '';
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        result += String.fromCharCode.apply(null, Array.from(chunk));
    }
    try {
        return btoa(result);
    } catch (e) {
        console.error('Base64编码失败:', e);
        return uint8Array.reduce((data, byte) => {
            return data + String.fromCharCode(byte);
        }, '');
    }
}




// 检查文件头部特征来确定 MIME 类型
function detectMimeType(data: Uint8Array): string | null {
    if (data.length < 4) return null;
    if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
        return 'image/jpeg';
    }
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
        return 'image/png';
    }
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) {
        return 'image/gif';
    }
    if (data.length > 12 && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) {
        return 'image/webp';
    }
    return 'image/jpeg';
}
