// @/services/payment.service.ts
// 处理支付相关的服务
// 网页、windows和mac app store均使用此服务


import { Language } from '../locales/languages';
import authService from "./auth.service";
import nooCloud from '../cloud';
import { Plan, OrderStatus, PaymentMethod } from '../types/payment';


// 订单接口（简化版，用于查询）
export interface Order {
    orderId: string; // 订单号
    status: OrderStatus; // 订单状态
}


// 创建支付请求参数接口
export interface CreateOrderParams {
    userId: string;
    planId: string;
    method: PaymentMethod;
    language?: Language;
    platform?: string;
}


// 创建支付响应接口
export interface CreateOrderResponse {
    orderId: string;     // 订单ID
    code_url?: string;  // 支付二维码地址(微信/支付宝扫码)
    paymentUrl?: string; // 支付页面URL(支付宝PC)
    prepayId?: string;    // 预支付交易号(仅APP)
    paymentParams?: any; // 支付参数(仅APP)
}


export class PaymentService {

    constructor() { }

    async init() { }


    private ensureInitialized() {
        if (!authService.isAuthenticated()) {
            throw new Error('CloudService未初始化');
        }
    }

    // 创建订单
    async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
        this.ensureInitialized();
        try {
            const language = params.language || 'en';
            const platform = params.platform || 'wechat';
            const plan = await this.getPlan(params.planId, language, platform);
            if (!plan) {
                throw new Error('未找到对应的订阅计划');
            }
            console.log('[PaymentService] 准备创建订单，参数:', {
                planId: params.planId,
                amount: plan.amount,
                method: params.method,
                language,
                platform
            });
            const response = await nooCloud.core.fetch<CreateOrderResponse>(`/payment/create?language=${language}&platform=${platform}`, {
                method: 'POST',
                needAuth: true,
                body: JSON.stringify({
                    planId: params.planId,
                    amount: plan.amount,
                    method: params.method
                })
            });
            console.log('[PaymentService] 创建订单响应:', response);
            if (!response.success || !response.data) {
                const errorMsg = response.message || '支付创建响应无效';
                console.error('[PaymentService] 创建订单失败:', errorMsg);
                throw new Error(errorMsg);
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }


    // 获取订单信息
    async queryOrder(orderId: string): Promise<Order | null> {
        this.ensureInitialized();
        try {
            const response = await nooCloud.core.fetch<Order>(`/payment/query`, {
                method: 'POST',
                body: JSON.stringify({ orderId }),
                needAuth: true
            });
            if (!response.success || !response.data) {
                console.warn('订单查询失败:', response.message);
                return null;
            }
            return response.data;
        } catch (error) {
            console.error('获取订单信息失败:', error);
            return null;
        }
    }


    async getPlans(language: Language, platform = 'wechat'): Promise<Plan[]> {
        try {
            const response = await nooCloud.core.fetch<Plan[]>(`/payment/plans?language=${language}&platform=${platform}`, {
                method: 'GET',
                needAuth: false
            });
            if (!response.success || !response.data) {
                throw new Error(response.message || '获取套餐计划失败');
            }
            if (!this.isValidPlans(response.data)) {
                throw new Error('Invalid price info format from API');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to load plans:', error);
            throw error;
        }
    }


    async getPlan(planId: string, language = 'en', platform = 'wechat'): Promise<Plan | null> {
        try {
            const plans = await this.getPlans(language as Language, platform);
            return plans.find(plan => plan.id === planId) || null;
        } catch (error) {
            console.error('Failed to get plan:', error);
            return null;
        }
    }

    private isValidPlans(data: any): data is Plan[] {
        if (!Array.isArray(data)) return false;
        return data.every(plan => {
            return (
                typeof plan.id === 'string' &&
                typeof plan.name === 'string' &&
                typeof plan.description === 'string' &&
                typeof plan.amount === 'number' &&
                typeof plan.currency === 'string' &&
                plan.planInfo &&
                typeof plan.planInfo.name === 'string' &&
                typeof plan.planInfo.days === 'number' &&
                typeof plan.planInfo.tier === 'number'
            );
        });
    }

}


export const paymentService = new PaymentService();
export default paymentService;