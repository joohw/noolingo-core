// @/services/auth.service.ts
// 处理用户认证相关的服务
// 兼容react-native

import { Service } from './service'
import nooCloud from "../cloud";
import { AuthState, useAuthStore } from '../stores/authStore';
import { UserProfile, defaultUserProfile } from '../types/user_model';
import { ConfigKey, configManager } from '../storage/configManager';
import { useStatsStore } from '../stores/statsStore';
import { useStudyStore } from '../stores/studyStore';
import userRepo from '../repo/UserRepository';


interface LastOtpInfo {
    identifier: string;
    timestamp: number;
}


export class AuthService implements Service {

    private initialized: boolean = false;
    private onLoginSuccessCallbacks: Array<() => void> = [];
    private onLogoutCallbacks: Array<() => void> = [];
    private userProfile: UserProfile | null = null;


    lastOtpInfo: LastOtpInfo | null;


    constructor() {
        this.lastOtpInfo = null;
        this.userProfile = configManager.getConfig(ConfigKey.LOCAL_USER) || defaultUserProfile;
        useAuthStore.getState().setUserProfile(this.userProfile);
        this.onLogout(() => {
            useStatsStore.getState().reset();
            useStudyStore.getState().reset();
            userRepo.clearStats();
        });
    }


    async init(): Promise<void> {
        if (this.initialized) return;
        const authStore = useAuthStore.getState();
        authStore.setIsInitializing(true);
        try {
            this.checkLoginState();
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            this.resetAuthState();
            throw error;
        } finally {
            this.initialized = true;
            authStore.setIsInitializing(false);
        }
    }


    private async handleLoginSuccess() {
        try {
            const profile = await this.fetchUserProfile();
            const authStore = useAuthStore.getState();
            authStore.setUserProfile(profile);
            authStore.setAuthState(AuthState.AUTHENTICATED);
            this.onLoginSuccessCallbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Failed to handle login success:', error);
            const authStore = useAuthStore.getState();
            authStore.setAuthState(AuthState.UNAUTHENTICATED);
            this.resetAuthState();
            throw error;
        }
    }


    async refreshUserProfile(): Promise<void> {
        const authStore = useAuthStore.getState();
        authStore.setProfileUpdating(true);
        try {
            const profile = await this.fetchUserProfile();
            authStore.setUserProfile(profile);
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            throw error;
        } finally {
            authStore.setProfileUpdating(false);
        }
    }


    async requestDeleteAccount(): Promise<void> {
        try {
            await this.updateUserProfile({
                deleted_at: Date.now()
            });
            console.log('Delete account requested');
        } catch (error) {
            console.error('Request delete account failed:', error);
            throw error;
        }
    }


    async cancelDeleteAccount(): Promise<void> {
        try {
            await this.updateUserProfile({
                deleted_at: null
            });
            console.log('Delete account cancelled');
        } catch (error) {
            console.error('Cancel delete account failed:', error);
            throw error;
        }
    }


    //检查登录态
    private async checkLoginState() {
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOADING);
        try {
            const isLoggedIn = await nooCloud.auth.checkLoginState();
            if (!isLoggedIn) {
                this.resetAuthState();
                return;
            }
            await this.handleLoginSuccess();
        } catch (error) {
            if (this.isNetworkError(error)) {
                authStore.setAuthState(AuthState.OFFLINE);
            } else {
                this.resetAuthState();
            }
        }
    }

    // 辅助方法：判断是否为网络错误
    private isNetworkError(error: any): boolean {
        return (
            error?.message === 'error.network_error' ||
            error?.message?.includes('network') ||
            error?.message?.includes('Network') ||
            error?.name === 'NetworkError' ||
            error?.code === 'NETWORK_ERROR'
        );
    }


    async sendOtp(contactInfo: { email?: string; phoneNumber?: string; isInternational?: boolean }): Promise<void> {
        const identifier = contactInfo.email || contactInfo.phoneNumber;
        if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
            throw new Error('error.contact_required');
        }
        const now = Date.now();
        if (this.lastOtpInfo &&
            this.lastOtpInfo.identifier === identifier &&
            now - this.lastOtpInfo.timestamp < 30000) {
            throw new Error('error.otp_sent_too_frequently');
        }
        const result = await nooCloud.auth.sendOtp(
            identifier,
            contactInfo.isInternational || false
        );
        if (!result) {
            throw new Error('error.otp_send_failed');
        }
        this.lastOtpInfo = { identifier, timestamp: now };
    }





    async verifyOtp(verificationInfo: { email?: string; phoneNumber?: string; code: string }): Promise<boolean> {
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOGGING_IN);
        try {
            const identifier = verificationInfo.email || verificationInfo.phoneNumber;
            if (!identifier) {
                this.resetAuthState();
                return false;
            }
            const response = await nooCloud.auth.verifyOtp(identifier, verificationInfo.code);
            if (response && response.success) {
                await this.handleLoginSuccess();
                this.lastOtpInfo = null;
                return true;
            }
            this.resetAuthState();
            this.lastOtpInfo = null;
            return false;
        } catch (error) {
            this.resetAuthState();
            this.lastOtpInfo = null;
            return false;
        }
    }



    async sendBindOtp(contactInfo: { email?: string; phoneNumber?: string }): Promise<void> {
        const identifier = contactInfo.email || contactInfo.phoneNumber;
        const type = contactInfo.email ? 'email' : 'phone';
        if (!identifier) {
            throw new Error('error.contact_required');
        }
        const result = await nooCloud.user.sendBindOtp(identifier, type);
        if (!result) {
            throw new Error('error.otp_send_failed');
        }
    }


    // 验证并绑定标识符
    async bindIdentifier(bindInfo: { email?: string; phoneNumber?: string; code: string }): Promise<void> {
        const identifier = bindInfo.email || bindInfo.phoneNumber;
        const type = bindInfo.email ? 'email' : 'phone';
        if (!identifier) {
            throw new Error('error.contact_required');
        }
        const result = await nooCloud.user.bindIdentifier(identifier, type, bindInfo.code);
        if (!result.success) {
            throw new Error(result.message || 'error.bind_failed');
        }
        await this.refreshUserProfile();
    }


    // 解绑标识符
    async unbindIdentifier(type: 'phone' | 'email'): Promise<void> {
        const result = await nooCloud.user.unbindIdentifier(type);
        if (!result.success) {
            throw new Error(result.message || 'error.unbind_failed');
        }
        await this.refreshUserProfile();
    }


    // 发送邮箱绑定邮件
    async sendEmailBindingEmail(email: string): Promise<void> {
        const result = await nooCloud.user.sendEmailBindingEmail(email);
        if (!result) {
            throw new Error('error.email_binding_send_failed');
        }
    }


    async fetchUserProfile(): Promise<UserProfile> {
        const userProfile = await nooCloud.user.fetchUserProfile<UserProfile>();
        return { ...defaultUserProfile, ...userProfile }
    }



    // 直接调用云函数更新用户资料 - 乐观更新版本
    async updateUserProfile(userInfo: Partial<UserProfile>): Promise<void> {
        const authStore = useAuthStore.getState();
        const currentProfile = authStore.userProfile;
        if (!currentProfile) {
            throw new Error('User profile not found');
        }
        const optimisticProfile: UserProfile = {
            ...currentProfile,
            ...userInfo,
        };
        authStore.setUserProfile(optimisticProfile);
        authStore.setProfileUpdating(true);
        if (this.isAuthenticated()) {
            try {
                await nooCloud.user.updateUserProfile(userInfo);
            } finally {
                authStore.setProfileUpdating(false);
            }
        }
    }





    async refreshApiKey(): Promise<void> {
        const authStore = useAuthStore.getState();
        authStore.setProfileUpdating(true);
        try {
            await nooCloud.user.refreshApiKey();
            await this.refreshUserProfile();
        } finally {
            authStore.setProfileUpdating(false);
        }
    }



    async verifyInviteCode(inviteCode: string): Promise<void> {
        const authStore = useAuthStore.getState();
        authStore.setProfileUpdating(true);
        try {
            await nooCloud.user.verifyInviteCode(inviteCode);
            await this.refreshUserProfile();
        } finally {
            authStore.setProfileUpdating(false);
        }
    }


    // 是否是永久会员
    public isLifeTimeMember(): boolean {
        const userProfile = useAuthStore.getState().userProfile;
        if (!userProfile?.expire_at) return false;
        const expireDate = new Date(userProfile.expire_at);
        const currentDate = new Date();
        return expireDate.getFullYear() - currentDate.getFullYear() >= 50;
    }

    public isEarlyBirdMember(): boolean {
        const userProfile = useAuthStore.getState().userProfile;
        return new Date().getFullYear() < 2026;
    }


    public isProMember(): boolean {
        const userProfile = useAuthStore.getState().userProfile;
        const isExpired = userProfile?.expire_at && userProfile.expire_at < Date.now();
        return userProfile?.membership_tier === 1 && !isExpired;
    }


    async verifyGiftCode(giftCode: string): Promise<void> {
        const authStore = useAuthStore.getState();
        authStore.setProfileUpdating(true);
        try {
            await nooCloud.user.verifyGiftCode(giftCode);
            await this.refreshUserProfile();
        } catch (error) {
            throw new Error('error.invalid_gift_code');
        }
        finally {
            authStore.setProfileUpdating(false);
        }
    }


    async getShareableLoginUrl(baseUrl: string): Promise<string> {
        try {
            const token = await nooCloud.auth.getShareableToken();
            const url = new URL(baseUrl);
            url.searchParams.set('share_token', token);
            return url.toString();
        } catch (error) {
            console.error('Failed to generate shareable login URL:', error);
            throw error;
        }
    }


    async loginWithShareToken(shareToken: string): Promise<boolean> {
        if (this.isAuthenticated()) {
            return true;
        }
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOGGING_IN);
        try {
            const success = await nooCloud.auth.signinWithShareToken(shareToken);
            if (!success) {
                this.resetAuthState();
                return false;
            }
            await this.handleLoginSuccess();
            return true;
        } catch (error) {
            console.error('Login with share token failed:', error);
            this.resetAuthState();
            return false;
        }
    }


    async signInWithApple(identityToken: string, authorizationCode?: string): Promise<boolean> {
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOGGING_IN);
        try {
            const success = await nooCloud.auth.signInWithApple(identityToken, authorizationCode);
            if (!success) {
                this.resetAuthState();
                return false;
            }
            await this.handleLoginSuccess();
            return true;
        } catch (error) {
            this.resetAuthState();
            throw error;
        }
    }


    async signInWithWeChat(code: string, isMobile: boolean = false): Promise<boolean> {
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOGGING_IN);
        try {
            const success = await nooCloud.auth.signInWithWeChat(code, isMobile);
            if (success) {
                await this.handleLoginSuccess();
                return true;
            }
            else {
                this.resetAuthState();
                return false;
            }
        } catch (error) {
            this.resetAuthState();
            throw error;
        }
    }


    async signInWithGoogle(accessToken: string): Promise<boolean> {
        const authStore = useAuthStore.getState();
        authStore.setAuthState(AuthState.LOGGING_IN);
        try {
            const success = await nooCloud.auth.signInWithGoogle(accessToken);
            if (!success) {
                this.resetAuthState();
                return false;
            }
            await this.handleLoginSuccess();
            return true;
        } catch (error) {
            this.resetAuthState();
            throw error;
        }
    }


    async logout(): Promise<void> {
        try {
            await nooCloud.auth.signOut();
            this.resetAuthState();
            this.onLogoutCallbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }


    public onLoginSuccess(callback: () => void) {
        this.onLoginSuccessCallbacks.push(callback);
    }


    public onLogout(callback: () => void) {
        this.onLogoutCallbacks.push(callback);
    }


    public isAuthenticated(): boolean {
        return useAuthStore.getState().authState === AuthState.AUTHENTICATED;
    }


    // 获取用户显示名称
    public getUserDisplayName(userProfile: UserProfile | null, isOffline: boolean, t: (key: string) => string): string {
        if (isOffline) {
            return t('auth.offline');
        }
        return userProfile?.nickname || userProfile?.email || userProfile?.phone || t('auth.anonymous');
    }


    private resetAuthState() {
        try {
            console.log('resetAuthState');
            this.lastOtpInfo = null;
            const authStore = useAuthStore.getState();
            authStore.reset();
        } catch (error) {
            console.error('重置状态失败:', error);
        }
    }
}


export const authService = new AuthService();
export default authService;