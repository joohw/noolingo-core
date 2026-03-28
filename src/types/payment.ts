// @/types/payment.ts
// 会员计划信息接口




// 会员计划配置接口
export interface MembershipPlan {
  id: string;
  name: string;
  days: number;
  tier: number;
  quota: number;
  price: number;
  earlyBirdPrice: number;
  originalPrice: number;
}

// 创建支付请求参数接口
export interface CreatePaymentParams {
  planId: string;
  amount: number;
  planInfo: PlanInfo;
}

// 创建支付响应接口
export interface CreatePaymentResponse {
  code: number;
  data?: {
    code_url: string;
    orderId: string;
    planInfo: PlanInfo;
  };
  message?: string;
  details?: string;
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'PENDING',      // 待支付
  PAID = 'PAID',           // 已支付
  CANCELLED = 'CANCELLED', // 已取消
  REFUNDED = 'REFUNDED',   // 已退款
  FAILED = 'FAILED'        // 支付失败
}

// 订单接口
export interface Order {
  orderId: string;
  userId: string;
  planId: string;
  planInfo: PlanInfo;
  amount: number;
  status: OrderStatus;
  description: string;
  createTime: Date;
  updateTime: Date;
  paymentCreated: boolean;
  code_url?: string;
  paidTime?: Date;
  refundTime?: Date;
  cancelTime?: Date;
  transactionId?: string;
  paymentInfo?: any;
}

// 微信支付配置接口
export interface WechatPayConfig {
  appId: string;
  mchId: string;
  privateKey: string;
  serialNo: string;
  apiV3Key: string;
}

// 微信支付Native下单参数接口
export interface WechatPayNativeParams {
  description: string;
  out_trade_no: string;
  notify_url: string;
  amount: {
    total: number;
    currency: string;
  };
}

// 微信支付通知回调数据接口
export interface WechatPayNotification {
  id: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: {
    original_type: string;
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
  };
}

// 会员计划配置
export const MembershipPlans = {
  STANDARD_YEARLY: {
    id: 'standard_yearly',
    name: 'Noolingo 年度会员',
    days: 365,
    tier: 1,
    quota: 50000,
    price: 98,
    earlyBirdPrice: 68,
    originalPrice: 128,
  },
  STANDARD_LIFETIME: {
    id: 'standard_lifetime',
    name: 'Noolingo 永久会员',
    days: 36500,
    tier: 1,
    quota: 50000,
    price: 298,
    earlyBirdPrice: 128,
    originalPrice: 128,
  }
} as const;



// 支付方式枚举
export enum PaymentMethod {
  WECHAT = "wechat",     // 微信支付
  WECHAT_APP = "wechat_app", // 微信APP支付
  ALIPAY = "alipay",     // 支付宝PC支付
  ALIPAY_APP = "alipay_app", // 支付宝APP支付
  STRIPE = "stripe",     // Stripe 信用卡支付（海外）
  REVENUECAT = "revenuecat" // RevenueCat
}


// 单个订阅计划（Offer）
export interface Plan {
  id: string; // 对应appstore的产品ID
  name: string;
  description: string;
  amount: number;
  currency: string;
  display?: string; // 显示价格（如 "$24.99"）
  originalPrice?: number; // 原价，用于显示折扣
  planInfo: PlanInfo;
  promoTag?: string;
}


export interface PlanInfo {
  name: string;
  days: number;
  tier: number;
  quota: number;
}