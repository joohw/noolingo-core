// @/utils/dateUtils.ts


import { formatDistanceToNow, format } from 'date-fns';
import { zhCN, enUS, Locale } from 'date-fns/locale';

// 获取日期格式化的语言环境
export function getDateLocale(language: string): Locale {
  return language.startsWith('zh') ? zhCN : enUS;
}

// 获取系统时区偏移（分钟）
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}


// 处理UTC时区偏移
export function addUtcOffset(isoString: string): string {
  const offsetMinutes = getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
  const offsetMinutesRemainder = Math.abs(offsetMinutes % 60);
  const offsetSign = offsetMinutes > 0 ? '-' : '+';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutesRemainder.toString().padStart(2, '0')}`;
  return isoString.replace('Z', offsetString);
}


// 格式化日期，支持自定义显示选项
export function formatDate(isoString: string, language: string, showTime: boolean = true, showYear: boolean = false): string {
  const date = new Date(isoString);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();
  const options: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    hour12: false
  };
  if (showYear || !isCurrentYear) {
    options.year = 'numeric';
  }
  if (showTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  const locale = language.startsWith('zh') ? 'zh-CN' : 'en-US';
  let formatted = date.toLocaleString(locale, options);
  formatted = formatted.replace(/\//g, '-');
  return formatted;
}


// 格式化相对时间（如：3天前）
export function formatRecallDate(date: Date, language: string): string {
  const locale = getDateLocale(language);
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale
  });
}

// 格式化到期日期
export function formatDueDate(dueDate: Date, language: string): string {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 60) {
    return 'long-term';
  } else if (diffDays < 0) {
    return formatRecallDate(dueDate, language);
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months}m`;
  }
}

// 渲染更新时间
export function renderUpdatedTime(date: string | Date | null | undefined, language: string): string {
  // 首先处理无效输入
  if (!date) {
    return 'Invalid date';
  }
  try {
    // 转换日期对象
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    const locale = getDateLocale(language);
    if (diffInHours < 1) {
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale,
        includeSeconds: true
      });
    }
    if (diffInHours < 24) {
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale
      });
    }
    const isSameYear = dateObj.getFullYear() === now.getFullYear();
    if (isSameYear) {
      return format(dateObj, 'MM-dd', { locale });
    } else {
      return format(dateObj, 'yyyy-MM-dd', { locale });
    }
  } catch (error) {
    return 'Invalid date';
  }
}


// 检查两个日期是否为同一天
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

// 获取相对时间描述（今天、明天等）
export function getRelativeTimeDescription(date: Date, language: string): string {
  const now = new Date();

  if (isSameDay(date, now)) {
    return language.startsWith('zh') ? '今天' : 'today';
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) {
    return language.startsWith('zh') ? '明天' : 'tomorrow';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return language.startsWith('zh') ? '昨天' : 'yesterday';
  }

  return formatDate(date.toISOString(), language, false);
}

// 格式化时间范围
export function formatDateRange(startDate: Date, endDate: Date, language: string): string {
  const locale = getDateLocale(language);
  const isSameYear = startDate.getFullYear() === endDate.getFullYear();
  const formatStr = isSameYear ? 'MM-dd' : 'yyyy-MM-dd';

  return `${format(startDate, formatStr, { locale })} ~ ${format(endDate, formatStr, { locale })}`;
}



export const formatTimeDifference = (diffInMs: number, t: any): string => {
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return t('common.time.days', { count: days });
  } else if (hours > 0) {
    return t('common.time.hours', { count: hours });
  } else if (minutes > 0) {
    return t('common.time.minutes', { count: minutes });
  } else {
    return t('common.time.seconds', { count: seconds });
  }
};
