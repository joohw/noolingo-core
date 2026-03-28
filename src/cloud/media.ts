// @/services/cloud/media.ts

import cloud, { ApiResponse } from './core';



export const Media = {



  async fetchImageBlob(remoteUrl: string): Promise<Blob> {
    const response = await cloud.fetch("/image/proxy?url=" + remoteUrl, {
      method: 'GET',
      needAuth: false,
    });
    if (!response.success) throw new Error('FETCH_ERROR');
    return response.data;
  },

  
  // 上传图片
  async uploadImage(file: File | Blob): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return cloud.fetch('/image/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // 上传图片
  async uploadImageBase64(
    base64: string,
    fileName?: string,
    mimeType?: string
  ): Promise<string> {
    const response = await cloud.fetch(`/image/upload-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      needAuth: true,
      body: JSON.stringify({
        image: base64,
        fileName: fileName || `image_${Date.now()}.jpg`,
        mimeType: mimeType || 'image/jpeg'
      }),
    });
    if (!response.success) {
      throw new Error(`上传失败: ${response.message}`);
    }
    const imageData = response.data[0];
    if (!imageData?.url) {
      throw new Error('服务器返回数据格式错误');
    }
    return imageData.url;
  },




  // 删除图片
  async deleteImage(noolingoId: string): Promise<ApiResponse<void>> {
    return cloud.fetch('/image/delete', {
      method: 'POST',
      body: JSON.stringify({ noolingoId })
    });
  }


};