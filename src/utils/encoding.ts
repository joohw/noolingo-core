import gbk from 'gbk.js';


export async function decodeBuffer(buffer: ArrayBuffer): Promise<string> {
    let utf8Text: string;
    try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        utf8Text = decoder.decode(buffer);
        if (!utf8Text.includes('�')) {
            return utf8Text.replace(/\r\n/g, '\n');
        }
    } catch (e) {
        console.warn('UTF-8解码失败:', e);
    }
    try {
        const bytes = new Uint8Array(buffer);
        const gbkText = gbk.decode(bytes);
        return gbkText.replace(/\r\n/g, '\n');
    } catch (e) {
        console.warn('GBK解码失败:', e);
    }
    try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const fallbackText = decoder.decode(buffer);
        return fallbackText.replace(/\r\n/g, '\n');
    } catch (e) {
        console.warn('所有解码方式均失败，返回空字符串');
        return '';
    }
}