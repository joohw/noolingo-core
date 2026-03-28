// @/services/cloud/auth.ts

import cloud from './core';


export const Auth = {

    async checkLoginState(): Promise<boolean> {
        return cloud.checkLoginState()
    },


    // sendOtp实现
    async sendOtp(identifier: string, international: boolean = false): Promise<boolean> {
        const response = await cloud.fetch<void>('/auth/otp/send', {
            method: 'POST',
            needAuth: false,
            body: JSON.stringify({ identifier, international })
        });
        return response.success;
    },


    // 验证otp
    async verifyOtp(identifier: string, code: string) {
        return await cloud.fetch('/auth/otp/verify', {
            method: 'POST',
            needAuth: false,
            body: JSON.stringify({ identifier, code })
        });
    },



    // 签出
    async signOut(): Promise<void> {
        await cloud.clearTokens()
    },


    //使用共享链接登录
    async signinWithShareToken(shareToken: string): Promise<boolean> {
        return await cloud.signinWithShareToken(shareToken)
    },

    // 获得可以用来登录的token
    async getShareableToken(): Promise<string> {
        return await cloud.getShareableToken()
    },

    async refreshAccessToken(): Promise<boolean> {
        return await cloud.refreshAccessToken();
    },


    // Google登录
    async signInWithGoogle(accessToken: string) {
        return await cloud.fetch('/auth/google', {
            method: 'POST',
            needAuth: false,
            body: JSON.stringify({ accessToken })
        });
    },


    // Apple登录
    async signInWithApple(identityToken: string, authorizationCode?: string) {
        return await cloud.fetch('/auth/apple', {
            method: 'POST',
            needAuth: false,
            body: JSON.stringify({ identityToken, authorizationCode })
        });
    },


    // 微信登录
    async signInWithWeChat(code: string, isMobile: boolean = false) {
        const platform = isMobile ? 'MOBILE' : 'WEB';
        return await cloud.fetch('/auth/wechat', {
            method: 'POST',
            needAuth: false,
            body: JSON.stringify({ code, platform })
        });
    }

};