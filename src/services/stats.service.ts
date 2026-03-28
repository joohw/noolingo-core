// @/services/stat.service.ts
// 管理学习统计数据的服务层

import { Service } from './service'
import { format } from 'date-fns';
import { createDefaultDailyStudyData, DailyStudyData } from '../stat/stat_model'
import { calculateOverallStats } from '../note/stats';
import { useStudyStore } from '../stores/studyStore';
import { useStatsStore } from '../stores/statsStore';
import userRepo from '../repo/UserRepository';
import notificationService from './notification.service';
import { getAdapter } from '../adapter';

export class StatsService implements Service {


    constructor() {
    }

    async init(): Promise<void> {
        try {
            this.refreshRecentData();
        } catch (error) {
            console.error('Failed to initialize study data:', error);
        }
    }


    async refreshRecentData(mocked: boolean = false): Promise<void> {
        try {
            if (mocked) {
                const mockedData = this.getMockedStatsz(360);
                const mockedAllData = this.getMockedStatsz(365);
                const overallStats = calculateOverallStats(mockedAllData);
                useStatsStore.getState().setRecentDailyStudyData(mockedData);
                useStatsStore.getState().setOverallStudyStats(overallStats);
            } else {
                const recentData = await userRepo.getRecentDailyStudyData(360);
                const allDailyData = await userRepo.getRecentDailyStudyData(3650);
                const overallStats = calculateOverallStats(allDailyData);
                useStatsStore.getState().setRecentDailyStudyData(recentData);
                useStatsStore.getState().setOverallStudyStats(overallStats);
            }
        } catch (error) {
            console.error('Failed to refresh study data:', error);
        }
    }


    public setActiveQueue(queue: string[]) {
        try {
            useStudyStore.getState().setActiveQueue(queue);
        } catch (error) {
            console.error('Error setting active queue:', error);
            throw error;
        }
    }


    // 检查今日目标，更新可新学的笔记数量和可复习的笔记数量
    public async checkTodaysTarget(): Promise<void> {
        const today = format(new Date(), 'yyyy-MM-dd');
        const recentData = useStatsStore.getState().recentDailyStudyData;
        const todayData = recentData.find(data => data.date === today);
        const todayProgress = todayData?.correct_count || 0;
        const remainingTarget = Math.max(getAdapter().appConfig.dailyTarget - todayProgress, 0);
        useStatsStore.getState().setUnfinishedCount(remainingTarget)
    }


    // 检查当日任务是否完成
    public isTodayTargetCompleted(): boolean {
        const today = format(new Date(), 'yyyy-MM-dd');
        const recentData = useStatsStore.getState().recentDailyStudyData;
        const todayData = recentData.find(data => data.date === today);
        const todayProgress = todayData?.correct_count || 0;
        return todayProgress >= getAdapter().appConfig.dailyTarget;
    }


    // 更新学习的统计数据
    public async updateStats(
        stats: Array<{ isCorrect: boolean; category: 'flashcard' | 'quiz', cardType: 'new' | 'review' }>
    ): Promise<void> {
        if (!stats || stats.length === 0) return;
        const today = new Date();
        const date = format(today, 'yyyy-MM-dd');
        let todayData = await userRepo.getSpecificDateStatistics(date);
        if (!todayData) {
            todayData = createDefaultDailyStudyData(date);
        }
        // 记录更新前的完成状态
        const beforeProgress = todayData.correct_count || 0;
        const wasCompletedBefore = beforeProgress >= getAdapter().appConfig.dailyTarget;
        stats.forEach(({ isCorrect, category, cardType }) => {
            todayData.study_count += 1;
            // 按卡片类型统计（新学或复习）
            if (cardType === 'new') {
                todayData.new_card_count += 1;
            } else if (cardType === 'review') {
                todayData.review_card_count += 1;
            }
            // 按学习模式统计
            if (category === 'quiz') {
                todayData.quiz_count += 1;
            }
            // correct_count: 所有答对的次数（包括新学、复习和quiz）
            if (isCorrect) {
                todayData.correct_count += 1;
            }
        });
        const currentRecentData = useStatsStore.getState().recentDailyStudyData;
        const todayDataIndex = currentRecentData.findIndex(item => item.date === date);
        let updatedRecentData: DailyStudyData[];
        if (todayDataIndex >= 0) {
            updatedRecentData = [...currentRecentData];
            updatedRecentData[todayDataIndex] = { ...updatedRecentData[todayDataIndex], ...todayData };
        } else {
            updatedRecentData = [...currentRecentData, todayData];
        }
        useStatsStore.getState().setRecentDailyStudyData(updatedRecentData);
        await userRepo.updateSpecificDateStatistics(date, todayData);
        const [recentData, allDailyData] = await Promise.all([
            userRepo.getRecentDailyStudyData(100),
            userRepo.getRecentDailyStudyData(3650)
        ]);
        const overallStats = calculateOverallStats(allDailyData);
        useStatsStore.getState().setOverallStudyStats(overallStats);
        useStatsStore.getState().setRecentDailyStudyData(recentData);
    // 更新统计数据
    await this.checkTodaysTarget();
    const afterProgress = todayData.correct_count || 0;
    const isCompletedAfter = afterProgress >= getAdapter().appConfig.dailyTarget;
    // 检查并更新通知（无论是否完成，都需要刷新通知）
    const isTodayCompleted = isCompletedAfter;
    await notificationService.checkAndUpdateNotifications(isTodayCompleted);
    }


    // 生成指定天数的模拟学习数据，模拟一个勤劳但真实的备考学生（使用随机游走算法）
    public getMockedStatsz(days: number = 100): DailyStudyData[] {
        const mockedData: DailyStudyData[] = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (days - 1));
        let currentNewCards = 6;
        let currentReviewCards = 11;
        let currentCorrectRate = 0.74;
        let newCardsActivity = 0.9;
        let reviewCardsActivity = 0.9;
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const dayProgress = days > 1 ? i / (days - 1) : 0;
            const isNewRestDay = Math.random() < 0.15;
            const isReviewRestDay = Math.random() < 0.12;
            const isCompleteRestDay = Math.random() < 0.05;
            const newActivityWalk = (Math.random() - 0.5) * 0.25;
            const reviewActivityWalk = (Math.random() - 0.5) * 0.25;
            newCardsActivity = newCardsActivity * 0.85 + 0.85 * 0.15 + newActivityWalk;
            reviewCardsActivity = reviewCardsActivity * 0.85 + 0.85 * 0.15 + reviewActivityWalk;
            newCardsActivity = Math.max(0, Math.min(1.5, newCardsActivity));
            reviewCardsActivity = Math.max(0, Math.min(1.5, reviewCardsActivity));
            const isNewLowDay = Math.random() < 0.20;
            const isReviewLowDay = Math.random() < 0.15;
            const trendNewCards = 6 - dayProgress * 3;
            const trendReviewCards = 11 + dayProgress * 7;
            const newCardsWalk = (Math.random() - 0.5) * 1.8;
            const reviewCardsWalk = (Math.random() - 0.5) * 2.5;
            currentNewCards = currentNewCards * 0.82 + trendNewCards * 0.18 + newCardsWalk;
            currentReviewCards = currentReviewCards * 0.82 + trendReviewCards * 0.18 + reviewCardsWalk;
            currentNewCards = Math.max(0, Math.min(20, currentNewCards));
            currentReviewCards = Math.max(0, Math.min(40, currentReviewCards));
            const correctRateWalk = (Math.random() - 0.5) * 0.015;
            currentCorrectRate = currentCorrectRate * 0.92 + 0.74 * 0.08 + correctRateWalk;
            currentCorrectRate = Math.max(0.65, Math.min(0.82, currentCorrectRate));
            if (isCompleteRestDay) {
                mockedData.push(createDefaultDailyStudyData(dateStr));
                continue;
            }
            let newMultiplier = newCardsActivity;
            let reviewMultiplier = reviewCardsActivity;
            if (isNewRestDay) {
                newMultiplier = 0;
            } else if (isNewLowDay) {
                newMultiplier *= 0.2 + Math.random() * 0.3;
            } else if (isWeekend) {
                newMultiplier *= 0.5 + Math.random() * 0.25;
            }
            if (isReviewRestDay) {
                reviewMultiplier = 0;
            } else if (isReviewLowDay) {
                reviewMultiplier *= 0.25 + Math.random() * 0.35;
            } else if (isWeekend) {
                reviewMultiplier *= 0.55 + Math.random() * 0.3;
            }
            let newCards = Math.max(0, Math.floor(currentNewCards * newMultiplier));
            let reviewCards = Math.max(0, Math.floor(currentReviewCards * reviewMultiplier));
            const totalCards = newCards + reviewCards;
            const correctCount = Math.floor(reviewCards * currentCorrectRate);
            const quizProbability = totalCards > 12 ? 0.28 : 0.15;
            const quizCount = Math.random() < quizProbability && totalCards > 5 ? Math.floor(totalCards * (0.18 + Math.random() * 0.12)) : 0;
            const avgTimePerCard = 38 + (Math.random() - 0.5) * 8;
            const totalStudyTime = Math.floor(totalCards * avgTimePerCard);
            mockedData.push({
                id: dateStr,
                date: dateStr,
                new_card_count: newCards,
                review_card_count: reviewCards,
                quiz_count: quizCount,
                study_count: totalCards,
                correct_count: correctCount,
                total_study_time: totalStudyTime,
            });
        }
        return mockedData;
    }


}


export const statsService = new StatsService();
export default statsService;