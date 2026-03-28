// @/services/cloud/user.ts
import cloud, { ApiResponse } from './core';

export const User = {


  // 获取用户资料
  async fetchUserProfile<T>(): Promise<T> {
    const response = await cloud.fetch<T>('/user/profile', {
      method: 'GET'
    });
    if (!response.data) {
      throw new Error('error.profile_not_found');
    }
    return response.data;
  },



  // 更新用户资料
  async updateUserProfile(userInfo: any): Promise<any> {
    const response = await cloud.fetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userInfo)
    });
    if (!response.data) {
      throw new Error('error.profile_update_failed');
    }
    return response.data;
  },



  // 使用邀请码
  async verifyInviteCode(inviteCode: string): Promise<void> {
    const response = await cloud.fetch('/user/invite/verify', {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
    if (!response.success) {
      throw new Error('error.invite_code_invalid');
    }
  },



  // 验证礼物码
  async verifyGiftCode(giftCode: string): Promise<void> {
    const response = await cloud.fetch('/user/gift/verify', {
      method: 'POST',
      body: JSON.stringify({ code: giftCode })
    });
    if (!response.success) {
      throw new Error('error.gift_code_invalid');
    }
  },



  // 获取API Key
  async refreshApiKey(): Promise<string> {
    const response = await cloud.fetch<{ apiKey: string }>('/user/apikey/refresh', {
      method: 'POST'
    });
    if (!response.data?.apiKey) {
      throw new Error('error.api_key_refresh_failed');
    }
    return response.data.apiKey;
  },


  // 发送绑定OTP
  async sendBindOtp(identifier: string, type: 'phone' | 'email'): Promise<boolean> {
    const response = await cloud.fetch<void>('/auth/bind/send', {
      method: 'POST',
      needAuth: true,
      body: JSON.stringify({ identifier, type })
    });
    if (!response.success && response.message) {
      throw new Error(response.message);
    }
    return response.success;
  },


  // 绑定标识符
  async bindIdentifier(identifier: string, type: 'phone' | 'email', code: string) {
    return await cloud.fetch('/auth/bind', {
      method: 'POST',
      body: JSON.stringify({ identifier, type, code }),
      needAuth: true
    });
  },


  // 解绑标识符
  async unbindIdentifier(type: 'phone' | 'email') {
    return await cloud.fetch('/auth/unbind', {
      method: 'POST',
      body: JSON.stringify({ type }),
      needAuth: true
    });
  },


  // 发送邮箱绑定邮件
  async sendEmailBindingEmail(email: string): Promise<boolean> {
    const response = await cloud.fetch<void>('/auth/email/bind/send', {
      method: 'POST',
      needAuth: true,
      body: JSON.stringify({ email })
    });
    if (!response.success && response.message) {
      throw new Error(response.message);
    }
    return response.success;
  },


  // 发送反馈
  async postFeedback(message: string): Promise<ApiResponse<any>> {
    return cloud.fetch(`/feedback/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      needAuth: false
    });
  },

};