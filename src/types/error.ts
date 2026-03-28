// @/types/error.ts


export enum AuthErrorCode {
    AUTH_LOGIN_FAILED = 'error.login_failed',
    AUTH_INVALID_CUSTOM_LOGIN_TICKET = 'error.invalid_login_ticket',
    AUTH_WX_OAUTH_FAILED = 'error.wx_oauth_failed', 
    AUTH_CUSTOM_USER_ID_HAS_BEEN_BOUND = 'error.custom_user_id_bound',
    AUTH_OPEN_ID_HAS_BEEN_BOUND = 'error.openid_bound',
    AUTH_UNION_ID_HAS_BEEN_BOUND = 'error.unionid_bound',
    AUTH_EMAIL_HAS_BEEN_BOUND = 'error.email_exists',
    INVALID_EMAIL_TOKEN = 'error.invalid_email_token',
    AUTH_EMAIL_PASSWORD_INVALID = 'error.invalid_credentials',
    AUTH_EMAIL_NOT_EXISTS = 'error.email_not_exist',
    AUTH_PHONE_CODE_INVALID = 'error.invalid_code',
    AUTH_SYSTEM_ERROR = 'error.default',
    AUTH_NOT_INITIALIZED = 'error.not_initialized',
    EXCEED_REQUEST_LIMIT = 'error.exceed_request_limit',
    AUTH_PASSWORD_TOO_SHORT = 'error.password_too_short',
    NETWORK_ERROR = 'error.network_error',
    AUTH_PHONE_CODE_EXPIRED = 'error.phone_code_expired',
    AUTH_PASSWORD_TOO_WEAK = 'error.weak_password',
 }


export class AppError extends Error {
    constructor(
        message: string,
        public code: AuthErrorCode,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}
