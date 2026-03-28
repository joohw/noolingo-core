// @/services/image.service.ts
// 图片服务层，图片全部上传到云端


import { cacheManager } from "../storage/cacheManager";
import nooCloud from "../cloud";


export class ImageService {


  async uploadImage(
    blob: Blob | File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; id: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('files', blob);
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.round(progress));
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              const image = response.data[0];
              resolve({
                url: image.cloudUrl || image.url,
                id: image.noolingoId
              });
            } else {
              reject(new Error(response.message || '上传失败'));
            }
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      });
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });
      xhr.open('POST', `${nooCloud.core.getApiBaseUrl()}/image/upload`);
      xhr.send(formData);
    });
  }


  // 获取图片URL - 优先从本地读取，本地不存在则读取云端
  public async getImageUrl(url: string): Promise<string> {
    let blob = await cacheManager.read(`blob:${url}`);
    if (!blob) {
      blob = await nooCloud.media.fetchImageBlob(url);
      await cacheManager.write(`blob:${url}`, blob);
    }
    return await this.blobToBase64(blob);
  }


  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}


const imageService = new ImageService();
export default imageService;