// @/types/user_model.ts
// 内置的用户类型



export enum MembershipTier {
    Free = 0,           // 免费用户
    Pro = 1,
}


export interface IUser {
    _id?: string;
    _openid?: string;
    phone: string
    email: string;
    admin?: boolean;
    hasPassword: boolean;
    deleted_at?: number | null;
    invite_code: string;
    invite_by: string | null;
    invite_count: number;
    created_at: number;
    updated_at: number;
}


// 用户的详细信息
export interface UserProfile extends IUser {
    nickname: string;
    gender: string;
    avatarUrl: string;
    api_key: string | null;
    early_bird: boolean;
    membership_tier: MembershipTier;
    expire_at?: number;
    cloud_note_quota: number;
    coin_balance: number;
}


// 默认资料，用于显示临时账户
export const defaultUserProfile: UserProfile = {
    _id: 'anonymous',
    _openid: '_anonymous',
    nickname: '',
    gender: 'unknown',
    avatarUrl: '',
    phone: '',
    email: '',
    admin: false,
    hasPassword: false,
    deleted_at: null,
    invite_code: 'ANONYMOUS',
    invite_by: null,
    invite_count: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
    api_key: null,
    early_bird: false,
    membership_tier: MembershipTier.Free,
    expire_at: undefined,
    cloud_note_quota: 0,
    coin_balance: 0,
};


export const validateUserProfile = (user: Partial<UserProfile>): UserProfile => {
    return { ...defaultUserProfile, ...user }
}

export default UserProfile;