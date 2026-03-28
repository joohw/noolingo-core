// @/utils/error.ts
// 把错误转换成提示用户的文本



// 有翻译的标准错误码
export enum ErrorCode {
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
    AUTH_UNAUTHORIZED = 'error.unauthorized',
    AUTH_CONTACT_REQUIRED = 'error.contact_required',
    AUTH_INVALID_PHONE_FORMAT = 'error.invalid_phone_format',
    AUTH_INVALID_EMAIL_FORMAT = 'error.invalid_email_format',
    AUTH_PHONE_ALREADY_BOUND = 'error.phone_bound',
    AUTH_BINDING_SUCCESS = 'error.binding_success',
    GIFT_CARD_NOT_FOUND = 'error.gift_card_not_found',
    GIFT_CARD_ALREADY_USED = 'error.gift_card_already_used',
    GIFT_CARD_INVALID = 'error.gift_card_invalid',
    GIFT_CARD_EXPIRED = 'error.gift_card_expired',
    INVITE_CODE_INVALID = 'error.invite_code_invalid',
    INVITE_CODE_NOT_FOUND = 'error.invite_code_not_found',
    INVITE_CODE_SELF_USE = 'error.invite_code_self_use',
    INVITE_ALREADY_BOUND = 'error.invite_already_bound',
    INVITE_CODE_EXPIRED = 'error.invite_code_expired',
}


// 非标准的错误码
const ERROR_MESSAGE_MAP: Record<string, ErrorCode> = {
    'invalid_username_or_password': ErrorCode.AUTH_LOGIN_FAILED,
    'PHONE_CODE_NOT_MATCHED': ErrorCode.AUTH_PHONE_CODE_INVALID,
    'PHONE_CODE_NOTFOUND_OR_EXPIRED': ErrorCode.AUTH_PHONE_CODE_EXPIRED,
    'EXCEED_REQUEST_LIMIT': ErrorCode.EXCEED_REQUEST_LIMIT,
    'pwd length too short': ErrorCode.AUTH_PASSWORD_TOO_SHORT,
    'mail user exist': ErrorCode.AUTH_EMAIL_HAS_BEEN_BOUND,
    'mail user not exist': ErrorCode.AUTH_EMAIL_NOT_EXISTS,
    'Network request failed': ErrorCode.NETWORK_ERROR,
};



export function convertErrorMessage(message: string): ErrorCode {
    if (Object.values(ErrorCode).includes(message as ErrorCode)) {
        return message as ErrorCode;
    }
    for (const [key, code] of Object.entries(ERROR_MESSAGE_MAP)) {
        if (message.includes(key)) {
            return code;
        }
    }
    return ErrorCode.AUTH_SYSTEM_ERROR;
}
