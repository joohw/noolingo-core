// @/stores/authStore.ts


import { create } from 'zustand';
import { UserProfile, defaultUserProfile } from '../types/user_model';


export enum AuthState {
    LOADING = 0,          // 初始加载状态
    LOGGING_IN = 1,       // 添加登录中状态,和服务器交互中
    AUTHENTICATED = 2,    // 登录成功状态
    UNAUTHENTICATED = 3,  // 未登录状态
    OFFLINE = 4,          // 服务器不可用
}


export interface AuthStoreState {
    authState: AuthState;
    userProfile: UserProfile;
    isInitializing: boolean;
    profileUpdating: boolean;
    setAuthState: (state: AuthState) => void;
    setUserProfile: (profile: UserProfile) => void;
    setIsInitializing: (initializing: boolean) => void;
    setProfileUpdating: (updating: boolean) => void;  // 新增
    reset: () => void;
}


export const useAuthStore = create<AuthStoreState>((set, get) => ({
    authState: AuthState.LOADING,
    userProfile: defaultUserProfile,
    isInitializing: false,
    profileUpdating: false,
    setAuthState: (state) => set({ authState: state }),
    setUserProfile: (profile) => set({ userProfile: { ...defaultUserProfile, ...profile } }),
    setIsInitializing: (initializing) => set({ isInitializing: initializing }),
    setProfileUpdating: (updating) => set({ profileUpdating: updating }),
    reset: () => set({
        authState: AuthState.UNAUTHENTICATED,
        userProfile: defaultUserProfile,
        isInitializing: false,
        profileUpdating: false
    })
}));
