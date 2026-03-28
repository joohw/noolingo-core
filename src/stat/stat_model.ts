// @/types/stats.ts


import { BaseModel } from '../types/base_model';


export interface DailyStudyData extends BaseModel {
  date: string; // 2025-01-01
  new_card_count: number; // 新学的卡片数量（包括闪卡或测验复习）
  review_card_count: number; // 复习的卡片数量(包括用闪卡或测验复习)
  quiz_count: number; // 做过的测验数量（测验模式的使用次数）
  correct_count: number; // 当日回忆成功的卡片数量（所有复习的成功率）
  study_count: number; // 当日累计学习次数(包括测验+闪卡)
  total_study_time: number; // 当日累计学习时长秒（新）
}


export enum DailyStudyStatus {
  COMPLETED = "COMPLETED", // 今日任务已完成
  COMPLETED_CAN_REVIEW = "COMPLETED_CAN_REVIEW", // 已完成但还可以复习
  INCOMPLETE = "INCOMPLETE", // 未完成，有内容可学
  INCOMPLETE_NO_CONTENT = "INCOMPLETE_NO_CONTENT", // 未完成，但无内容可学
  ZERO_TARGET = 'ZERO_TARGET',
  ZERO_TARGET_CAN_REVIEW = 'ZERO_TARGET_CAN_REVIEW'
}



export function validateDailyStudyData(data: Partial<DailyStudyData>): DailyStudyData {
  if (!data.date) {
    const date = new Date().toISOString().split('T')[0];
    return createDefaultDailyStudyData(date);
  } else {
    return {
      id: data.date,
      date: data.date,
      new_card_count: data.new_card_count || 0,
      review_card_count: data.review_card_count || 0,
      quiz_count: data.quiz_count || 0,
      study_count: data.study_count || 0,
      correct_count: data.correct_count || 0,
      total_study_time: data.total_study_time || 0,
    };
  }
}



// 空的单日学习数据
export function createDefaultDailyStudyData(date: string): DailyStudyData {
  return {
    id: date,
    date,
    new_card_count: 0,
    review_card_count: 0,
    quiz_count: 0,
    study_count: 0,
    correct_count: 0,
    total_study_time: 0,
  };
}


//总体学习数据
export interface OverallStudyStats extends BaseModel {
  total_study_days: number;  // 总学习天数
  current_streak: number; //当前连续学习天数（不包括今天）
  today_completed: boolean; //今天是否完成目标
  longest_streak: number;//最长连续学习
  total_cards_studied: number;//总计学习卡片数量
}


//空的总体学习数据
export const defaultOverallStudyStats: OverallStudyStats = {
  id: "OVERALL_STUDY_STATS_ID",
  total_study_days: 0,//累计学习天数
  current_streak: 0,//当前连续学习天数（不包括今天）
  today_completed: false,//今天是否完成目标
  longest_streak: 0,//历史最长连续学习天数
  total_cards_studied: 0,//总计学习卡片数量
};




// 补全缺失数据
export function fillingMissingData(dailyData: DailyStudyData[], daysToFill: number = 365): DailyStudyData[] {
  daysToFill = Math.min(Math.max(1, daysToFill), 36500);
  // 使用本地时间
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const earliestDate = new Date(today);
  earliestDate.setDate(today.getDate() - (daysToFill - 1));
  const filledData: DailyStudyData[] = [];
  // 从最早日期到今天的升序排列
  for (let i = 0; i < daysToFill; i++) {
    const d = new Date(earliestDate);
    d.setDate(earliestDate.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    const existingData = dailyData.find(data => data.date === currentDate);
    if (existingData) {
      filledData.push(existingData);
    } else {
      filledData.push(createDefaultDailyStudyData(currentDate));
    }
  }
  return filledData;
}