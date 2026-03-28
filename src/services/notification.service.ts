// @/services/notification.service.ts
// 通知服务

import { Service } from './service';
import { format } from 'date-fns';
import { useStudyStore } from '../stores/studyStore';
import { getTranslation } from '../locales/translation';
import { adapter } from '../adapter';



export class NotificationService implements Service {

  private _isGranted: boolean = false;

  constructor() { }


  // 初始化通知配置
  async init(): Promise<void> {
    try {
      await adapter.notification.configureNotifications();
      this._isGranted = await adapter.notification.checkNotificationPermission();
    } catch (error) {
      console.error('通知服务初始化失败:', error);
    }
  }


  // 检查通知权限状态
  async checkPermission(): Promise<boolean> {
    try {
      this._isGranted = await adapter.notification.checkNotificationPermission();
      return this._isGranted;
    } catch (error) {
      console.error('检查通知权限失败:', error);
      this._isGranted = false;
      return false;
    }
  }


  // 请求通知权限
  async requestPermission(): Promise<boolean> {
    try {
      this._isGranted = await adapter.notification.requestNotificationPermission();
      return this._isGranted;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      this._isGranted = false;
      return false;
    }
  }


  // 发送即时通知
  async showInstantNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.warn('通知权限未授予，尝试请求权限');
        const permissionGranted = await this.requestPermission();
        if (!permissionGranted) {
          console.warn('用户拒绝了通知权限');
          return false;
        }
      }
      return await adapter.notification.showInstantNotification(title, body, data);
    } catch (error) {
      console.error('显示即时通知失败:', error);
      return false;
    }
  }


  // 安排指定时间的通知
  async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      if (!this._isGranted) {
        console.warn('通知权限未授予');
        return false;
      }
      return await adapter.notification.scheduleNotification(title, body, date, data);
    } catch (error) {
      console.error('安排通知失败:', error);
      return false;
    }
  }


  // 取消所有预定通知
  async cancelAllScheduledNotifications(): Promise<void> {
    await adapter.notification.cancelAllScheduledNotifications();
  }


  // 获取当前权限状态
  get isGranted(): boolean {
    return this._isGranted;
  }




  // 获取未来需要通知的日期列表（明天、后天、大大后天、一周后、两周后、一月后）
  private getFutureNotificationDates(): Array<{ date: Date; daysOffset: number }> {
    const today = new Date();
    const dates: Array<{ date: Date; daysOffset: number }> = [];
    // 明天
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dates.push({ date: tomorrow, daysOffset: 1 });
    // 后天
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    dates.push({ date: dayAfterTomorrow, daysOffset: 2 });
    // 大大后天
    const dayAfterDayAfterTomorrow = new Date(today);
    dayAfterDayAfterTomorrow.setDate(today.getDate() + 3);
    dates.push({ date: dayAfterDayAfterTomorrow, daysOffset: 3 });
    // 一周后
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    dates.push({ date: oneWeekLater, daysOffset: 7 });
    // 两周后
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    dates.push({ date: twoWeeksLater, daysOffset: 14 });
    // 一月后
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1);
    dates.push({ date: oneMonthLater, daysOffset: 30 });
    return dates;
  }


  // 根据日期偏移量获取对应的通知文案key
  private getNotificationBodyKey(daysOffset: number): string {
    if (daysOffset === 1) return 'notifications.reviewReminderBodyTomorrow';
    if (daysOffset === 2) return 'notifications.reviewReminderBodyDayAfter';
    if (daysOffset === 3) return 'notifications.reviewReminderBodyThreeDays';
    if (daysOffset === 7) return 'notifications.reviewReminderBodyOneWeek';
    if (daysOffset === 14) return 'notifications.reviewReminderBodyTwoWeeks';
    if (daysOffset === 30) return 'notifications.reviewReminderBodyOneMonth';
    return 'notifications.reviewReminderBody';
  }


  // 刷新通知：根据任务完成情况和未来任务安排通知
  async refreshNotifications(isTodayCompleted: boolean): Promise<void> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return;
      }
      const preferences = useStudyStore.getState().preferences;
      if (!preferences.notification_enabled || !preferences.notification_time) {
        await adapter.notification.cancelAllScheduledNotifications();
        return;
      }
      // 1. 先取消所有通知
      await adapter.notification.cancelAllScheduledNotifications();
      // 2. 检查今日任务是否完成，如果没有完成，添加今日通知
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      if (!isTodayCompleted) {
        const [hours, minutes] = preferences.notification_time.split(':').map(Number);
        const notificationDateTime = new Date(today);
        notificationDateTime.setHours(hours, minutes, 0, 0);
        if (notificationDateTime > new Date()) {
          const title = await getTranslation('notifications.reviewReminderTitle');
          const body = await getTranslation('notifications.reviewReminderBody');
          await adapter.notification.scheduleNotification(
            title,
            body,
            notificationDateTime,
            { date: todayString, type: 'review_reminder' }
          );
        }
      }
      // 3. 为未来时间安排通知（如果用户接到未来的通知，说明用户这几天都未登录）
      const futureDates = this.getFutureNotificationDates();
      const title = await getTranslation('notifications.reviewReminderTitle');
      for (const { date: futureDate, daysOffset } of futureDates) {
        const dateString = format(futureDate, 'yyyy-MM-dd');
        const [hours, minutes] = preferences.notification_time.split(':').map(Number);
        const notificationDateTime = new Date(futureDate);
        notificationDateTime.setHours(hours, minutes, 0, 0);
        if (notificationDateTime > new Date()) {
          const bodyKey = this.getNotificationBodyKey(daysOffset);
          const body = await getTranslation(bodyKey);
          await adapter.notification.scheduleNotification(
            title,
            body,
            notificationDateTime,
            { date: dateString, type: 'review_reminder' }
          );
        }
      }
    } catch (error) {
      console.error('刷新通知失败:', error);
    }
  }


  // 检查并更新通知（在统计更新时调用）
  async checkAndUpdateNotifications(isTodayCompleted: boolean): Promise<void> {
    try {
      await this.refreshNotifications(isTodayCompleted);
    } catch (error) {
      console.error('检查并更新通知失败:', error);
    }
  }



}

// 创建单例实例
export const notificationService = new NotificationService();
export default notificationService;