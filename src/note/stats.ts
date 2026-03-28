// @/lib/stats.ts
// 和学习记录有关的辅助函数


import { DailyStudyData, OverallStudyStats, defaultOverallStudyStats } from '../stat/stat_model'
import { format, subDays, addDays } from 'date-fns';
import { getAdapter } from '../adapter';



function dailyTarget(): number {
    return getAdapter().appConfig.dailyTarget;
}



//转换用户学习统计数据到绘图用的学习统计数据
export function calculateOverallStats(userStats: DailyStudyData[]): OverallStudyStats {
    const totalStudyDays = userStats.filter(day => (day.correct_count || 0) >= dailyTarget()).length;
    const totalCardsStudied = userStats.reduce((sum, day) => sum + day.study_count, 0);
    const { streak, todayCompleted } = calculateCurrentStreak(userStats);
    return {
        id: defaultOverallStudyStats.id,
        total_study_days: totalStudyDays,
        current_streak: streak,
        today_completed: todayCompleted,
        longest_streak: calculateLongestStreak(userStats),
        total_cards_studied: totalCardsStudied,
    };
}



// 辅助函数：计算最长连续学习天数（基于完成每日目标）
function calculateLongestStreak(dailyData: DailyStudyData[]): number {
    let longestStreak = 0;
    let currentStreak = 0;
    for (const data of dailyData) {
        if ((data.correct_count || 0) >= dailyTarget()) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    return longestStreak;
}




//计算当前连续学习天数（基于完成每日目标）和今天是否完成
function calculateCurrentStreak(dailyStudyData: DailyStudyData[]): { streak: number; todayCompleted: boolean } {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 使用本地时区格式化日期，避免时区问题
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    // 检查今天是否完成
    const todayData = dailyStudyData.find(data => data.date === todayString);
    const todayCompleted = (todayData?.correct_count || 0) >= dailyTarget();
    const sortedData = [...dailyStudyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let lastDate = today;
    // 从昨天开始计算连胜（不包括今天）
    for (const data of sortedData) {
        const studyDate = new Date(data.date);
        studyDate.setHours(0, 0, 0, 0);
        if (studyDate >= today) continue; // 跳过今天及未来的日期
        const daysDifference = Math.floor((lastDate.getTime() - studyDate.getTime()) / (1000 * 3600 * 24));
        if (daysDifference > 1) break; // 如果间隔超过1天，连胜中断
        if ((data.correct_count || 0) >= dailyTarget()) {
            // 只有完成目标才算在连胜里
            currentStreak++;
            lastDate = studyDate;
        } else {
            break; // 如果某天没完成，连胜中断
        }
    }
    return { streak: currentStreak, todayCompleted };
}



// 获取当前连胜天数
export function getStreakDays(
    recentDailyStudyData: DailyStudyData[]
): number {
    return calculateCurrentStreak(recentDailyStudyData).streak;
}


// 获取连胜显示的天数数据
export interface StreakDay {
    date: string | null;
    isCompleted: boolean;
    isFuture: boolean;
    isMoreDays: boolean;
    moreDaysCount: number;
}


// 读取最近的学习数据并返回显示用的天数数据
export function getRecentStreakDays(
    recentDailyStudyData: DailyStudyData[],
    currentStreak: number
): StreakDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDateString = format(today, 'yyyy-MM-dd');
    const days: StreakDay[] = [];
    const totalDaysToShow = 7;
    const hasMoreDays = currentStreak > totalDaysToShow;
    
    if (hasMoreDays) {
        const moreDaysCount = currentStreak - (totalDaysToShow - 1);
        days.push({ date: null, isCompleted: true, isFuture: false, isMoreDays: true, moreDaysCount });
        const pastDaysToShow = totalDaysToShow - 1;
        for (let i = pastDaysToShow; i >= 1; i--) {
            const date = subDays(today, i);
            const dateString = format(date, 'yyyy-MM-dd');
            const dayData = recentDailyStudyData.find(d => d.date === dateString);
            const isCompleted = (dayData?.correct_count || 0) >= dailyTarget();
            days.push({ date: dateString, isCompleted, isFuture: false, isMoreDays: false, moreDaysCount: 0 });
        }
        const todayData = recentDailyStudyData.find(d => d.date === todayDateString);
        const todayCompleted = (todayData?.correct_count || 0) >= dailyTarget();
        days.push({ date: todayDateString, isCompleted: todayCompleted, isFuture: false, isMoreDays: false, moreDaysCount: 0 });
    } else {
        // currentStreak 不包括今天，所以显示过去 currentStreak 天
        for (let i = currentStreak; i >= 1; i--) {
            const date = subDays(today, i);
            const dateString = format(date, 'yyyy-MM-dd');
            const dayData = recentDailyStudyData.find(d => d.date === dateString);
            const isCompleted = (dayData?.correct_count || 0) >= dailyTarget();
            days.push({ date: dateString, isCompleted, isFuture: false, isMoreDays: false, moreDaysCount: 0 });
        }
        // 添加今天
        const todayData = recentDailyStudyData.find(d => d.date === todayDateString);
        const todayCompleted = (todayData?.correct_count || 0) >= dailyTarget();
        days.push({ date: todayDateString, isCompleted: todayCompleted, isFuture: false, isMoreDays: false, moreDaysCount: 0 });
        // 添加未来几天
        const futureDaysCount = totalDaysToShow - currentStreak - 1; // 减去今天
        for (let i = 1; i <= futureDaysCount; i++) {
            const date = addDays(today, i);
            const dateString = format(date, 'yyyy-MM-dd');
            days.push({ date: dateString, isCompleted: false, isFuture: true, isMoreDays: false, moreDaysCount: 0 });
        }
    }
    return days;
}

