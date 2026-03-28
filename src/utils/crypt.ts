// @/utils/crypt.ts


export function simpleEncrypt(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text).toString('base64');
  } else {
    return btoa(unescape(encodeURIComponent(text)));
  }
}


export function simpleDecrypt(cipherText: string): string {
  if (!cipherText) return '';
  const cleaned = cipherText.replace(/[^A-Za-z0-9+/=]/g, '');
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(cleaned, 'base64').toString();
    } catch (e) {
      console.error('Node解密失败:', e);
      return '';
    }
  } else {
    try {
      return decodeURIComponent(escape(atob(cleaned)));
    } catch (e) {
      console.error('浏览器解密失败:', e);
      return '';
    }
  }
}