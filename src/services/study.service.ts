// @/services/study.service.ts
// 学习的服务层，依赖索引层

import { Service } from './service'
import { Scheduler } from '../fsrs';
import { CardRating, CardState } from '../fsrs';
import { Note } from '../note';
import { StudyPreferences } from '../types/preference';
import { validateReadSettings } from '../types/setting';
import { sortNotes } from "../note/sortNotes";
import indicesService from './indices.service';
import noteService from './note.service';
import { ConfigKey, configManager } from '../storage/configManager';
import { SortState } from '../deck/deck_model';
import { useStudyStore, StudyResult } from '../stores/studyStore';
import { userRepository } from '../repo/UserRepository';
import statsService from './stats.service';
import notificationService from './notification.service';



export class StudyService implements Service {
    scheduler: Scheduler;

    constructor() {
        this.scheduler = new Scheduler();
    }

    async init(): Promise<void> {
        try {
            const persisted =configManager.getConfig<SortState>(ConfigKey.QUEUE_SORT_STATE) ?? { key: 'schedule', order: 'desc' };
            useStudyStore.setState({ queueSortState: persisted });
            const initPreference = await userRepository.getStudyPreferences();
            const validatedPreference = {
                ...initPreference,
                readSettings: validateReadSettings(initPreference.readSettings),
            };
            useStudyStore.getState().setPreferences(validatedPreference);
        } catch (error) {
            console.error('Failed to initialize study data:', error);
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


    public setPendingQueue(queue: string[]) {
        try {
            useStudyStore.getState().setPendingQueue(queue);
            this.resortFlashcardQueue();
        } catch (error) {
            console.error('Error setting pending queue:', error);
            throw error;
        }
    }


    // 重新排序和切分当前已经激活的队列
    public async resortFlashcardQueue(): Promise<void> {
        try {
            const pendingQueue = useStudyStore.getState().pendingQueue || [];
            const availableNotes = indicesService.filterFlashcardNotes(pendingQueue);
            const queueSortState = useStudyStore.getState().queueSortState;
            const learningMode = useStudyStore.getState().preferences.learningMode
            if (availableNotes.length === 0) {
                useStudyStore.getState().setActiveQueue([]);
                return;
            }
            const notesData = availableNotes.map(id => indicesService.getNoteById(id)).filter(note => note) as Note[];
            if (notesData.length === 0) {
                useStudyStore.getState().setActiveQueue([]);
                return;
            }
            // 根据学习模式过滤和分类笔记
            const newNotes = notesData.filter(note => {
                if (!note) return false;
                if (!note.recall || !note.recall.state) return true;
                const recall = note.recall;
                return recall.state == CardState.LEARNING;
            });
            const reviewNotes = notesData.filter(note => {
                if (!note || !note.recall) return false;
                const recall = note.recall;
                return recall.state !== CardState.LEARNING;
            });
            let sortedNoteIds: string[] = [];
            switch (learningMode) {
                case 'review-only':
                    sortedNoteIds = sortNotes(
                        reviewNotes,
                        queueSortState
                    ).map(note => note.id);
                    break;
                case 'new-only':
                    sortedNoteIds = newNotes.map(note => note.id);
                    break;
                case 'review-first':
                    sortedNoteIds = reviewNotes.map(note => note.id).concat(newNotes.map(note => note.id));
                    break;
                case 'new-first':
                    sortedNoteIds = newNotes.map(note => note.id).concat(reviewNotes.map(note => note.id));
                    break;
                case 'smart':
                    // 智能模式：按 70% 复习，30% 新学的比例混合
                    // 保持原有顺序，不单独排序
                    const reviewIds = reviewNotes.map(note => note.id);
                    const newIds = newNotes.map(note => note.id);
                    const totalNotes = notesData.length;
                    // 计算目标数量，但不能超过实际可用数量
                    const targetReviewCount = Math.ceil(totalNotes * 0.7);
                    const targetNewCount = Math.ceil(totalNotes * 0.3);
                    // 取实际可用的数量（不超过目标数量）
                    const smartReviewIds = reviewIds.slice(0, Math.min(targetReviewCount, reviewIds.length));
                    const smartNewIds = newIds.slice(0, Math.min(targetNewCount, newIds.length));
                    // 交替混合（每3个复习配1个新学）
                    sortedNoteIds = [];
                    let reviewIndex = 0;
                    let newIndex = 0;
                    while (reviewIndex < smartReviewIds.length || newIndex < smartNewIds.length) {
                        // 每3个复习后插入1个新学
                        for (let i = 0; i < 3 && reviewIndex < smartReviewIds.length; i++) {
                            sortedNoteIds.push(smartReviewIds[reviewIndex]);
                            reviewIndex++;
                        }
                        if (newIndex < smartNewIds.length) {
                            sortedNoteIds.push(smartNewIds[newIndex]);
                            newIndex++;
                        }
                    }
                    // 如果队列还没填满，用剩余的笔记补充
                    if (sortedNoteIds.length < totalNotes) {
                        const remainingReviewIds = reviewIds.slice(reviewIndex);
                        const remainingNewIds = newIds.slice(newIndex);
                        const needed = totalNotes - sortedNoteIds.length;
                        // 优先补充复习笔记，再补充新学笔记
                        const additionalReviewIds = remainingReviewIds.slice(0, Math.min(needed, remainingReviewIds.length));
                        const remainingNeeded = needed - additionalReviewIds.length;
                        const additionalNewIds = remainingNewIds.slice(0, Math.min(remainingNeeded, remainingNewIds.length));
                        sortedNoteIds.push(...additionalReviewIds, ...additionalNewIds);
                    }
                    break;
            }
            const maxNoteCount = Math.min(useStudyStore.getState().preferences.note_batch_size, 100);
            const activeNoteIds = sortedNoteIds.slice(0, maxNoteCount);
            useStudyStore.getState().setActiveQueue(activeNoteIds);
        } catch (error) {
            console.error('Error resorting active queue:', error);
            throw error;
        }
    }



    // 记录quiz的评分
    public async handleQuizAnswer(noteId: string, rating: CardRating, timeUsed: number, updateRecall: boolean = false): Promise<void> {
        try {
            this.removeNoteFromQueue(noteId);
            const studyStore = useStudyStore.getState();
            const existingResult = studyStore.studyResults.find(r => r.noteId === noteId);
            if (!existingResult) {
                const originalNote = indicesService.getNoteById(noteId);
                const originalState = originalNote?.recall?.state || CardState.LEARNING;
                const result: StudyResult = {
                    noteId: noteId,
                    isCorrect: rating === CardRating.GOOD || rating === CardRating.EASY,
                    userRating: rating,
                    timeUsed: timeUsed,
                };
                useStudyStore.getState().setStudyResults((prev) => [
                    ...prev.filter((r) => r.noteId !== noteId),
                    result,
                ]);
                const now = new Date();
                const updates: Record<string, any> = {};
                // Quiz 时间默认是 3 天（与 FSRS 无关）
                const nextQuizDate = new Date(now);
                nextQuizDate.setDate(nextQuizDate.getDate() + 3);
                // 始终更新 quiz 相关时间戳
                updates[noteId] = {
                    last_quiz_at: now.toISOString(),
                    next_quiz_at: nextQuizDate.toISOString()
                };
                // 只有当 updateRecall 为 true 时才更新 recall 数据和归档逻辑
                if (updateRecall) {
                    const updatedNote = indicesService.getNoteById(noteId);
                    if (updatedNote) {
                        const currentRecall = updatedNote.recall;
                        const deck = indicesService.getNoteDeck(noteId);
                        // 获取 timeScale
                        const timeScale = deck?.reviewSettings?.timeScale || 1;
                        // 更新 recall 数据（使用 FSRS）
                        const updatedRecall = this.scheduler.evaluate(currentRecall, rating, timeScale);
                        updates[noteId].recall = updatedRecall;
                        // 检查归档条件
                        const targetRetentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
                        if (updatedRecall.stability && updatedRecall.stability >= targetRetentionDays) {
                            updates[noteId].archived = true;
                        }
                    }
                }
                // 应用更新
                if (Object.keys(updates).length > 0) {
                    await noteService.updateNotes(updates);
                }
                // 更新统计信息
                const cardType = originalState === CardState.LEARNING ? 'new' : 'review';
                const isCorrect = rating >= CardRating.GOOD;
                statsService.updateStats([{
                    isCorrect,
                    category: 'quiz',
                    cardType
                }]);
                statsService.checkTodaysTarget();
            }
        } catch (error) {
            console.error('处理答题结果失败:', error);
            throw error;
        }
    }




    // 处理闪卡模式的评分
    public async handleFlashcardRating(
        noteId: string,
        rating: CardRating,
        requeue: boolean = true,
        timeUsed: number = 0
    ): Promise<void> {
        try {
            const updatedNote = indicesService.getNoteById(noteId);
            if (!updatedNote) return;
            const originalState = updatedNote?.recall?.state || CardState.LEARNING;
            // 记录 result
            const studyStore = useStudyStore.getState();
            const existingResult = studyStore.studyResults.find(r => r.noteId === noteId);
            if (!existingResult) {
                const result: StudyResult = {
                    noteId: noteId,
                    isCorrect: rating === CardRating.GOOD || rating === CardRating.EASY,
                    userRating: rating,
                    timeUsed: timeUsed,
                };
                useStudyStore.getState().setStudyResults((prev) => [
                    ...prev.filter((r) => r.noteId !== noteId),
                    result,
                ]);
            }
            // 获取 timeScale
            const deck = indicesService.getNoteDeck(noteId);
            const timeScale = deck?.reviewSettings?.timeScale || 1;
            // 先计算更新后的 recall，用于判断是否需要重排
            const currentRecall = updatedNote.recall;
            const updatedRecall = this.scheduler.evaluate(currentRecall, rating, timeScale);
            if (requeue) {
                useStudyStore.getState().setActiveQueue((prevQueue: string[]) => {
                    // 防御性检查：确保 prevQueue 是一个数组
                    const safeQueue = Array.isArray(prevQueue) ? prevQueue : [];
                    // 计算下次复习时间（以小时为单位）
                    const now = new Date();
                    const dueDate = new Date(updatedRecall.due);
                    const diffInMs = dueDate.getTime() - now.getTime();
                    const diffInHours = diffInMs / (1000 * 60 * 60);
                    // 如果下次复习时间小于 24 小时，重排到队列中
                    if (diffInHours < 24 || rating == CardRating.AGAIN) {
                        const queueWithoutCurrent = safeQueue.filter(id => id !== noteId);
                        const newIndex = Math.min(3, queueWithoutCurrent.length);
                        queueWithoutCurrent.splice(newIndex, 0, noteId);
                        return queueWithoutCurrent;
                    } else {
                        // 如果下次复习时间 >= 24 小时，从队列中移除
                        return safeQueue.filter(id => id !== noteId);
                    }
                });
            }
            // 更新 recall 数据
            const updates: Record<string, any> = {
                recall: updatedRecall
            };
            const targetRetentionDays = useStudyStore.getState().preferences.target_retention_days || 180;
            if (updatedRecall.stability && updatedRecall.stability >= targetRetentionDays) {
                updates.archived = true;
            }
            await noteService.updateNotes({ [noteId]: updates });
            const type = originalState === CardState.LEARNING ? 'new' : 'review';
            const isCorrect = rating >= CardRating.GOOD;
            statsService.updateStats([{
                isCorrect,
                category: 'flashcard',
                cardType: type
            }]);
        } catch (error) {
            console.error('Failed to update note recall:', error);
        }
    }


    // 更新学习的偏好设置
    public async updateStudyPreferences(
        preferences: Partial<StudyPreferences>
    ): Promise<void> {
        try {
            const validatedPreferences = { ...preferences };
            if (preferences.readSettings) {
                validatedPreferences.readSettings = validateReadSettings(preferences.readSettings);
            }
            await userRepository.updateStudyPreferences(validatedPreferences);
            useStudyStore.getState().setPreferences(validatedPreferences);
        } catch (error) {
            throw error;
        }
    }


    // 更新通知设置（统一入口，会自动刷新通知）
    public async updateNotificationSettings(preferences: Partial<Pick<StudyPreferences, 'notification_enabled' | 'notification_time'>>): Promise<void> {
        try {
            await this.updateStudyPreferences(preferences);
            if (preferences.notification_enabled === false) {
                await notificationService.cancelAllScheduledNotifications();
            } else {
                const isTodayCompleted = statsService.isTodayTargetCompleted();
                await notificationService.refreshNotifications(isTodayCompleted);
            }
        } catch (error) {
            console.error('更新通知设置失败:', error);
            throw error;
        }
    }


    public removeNoteFromQueue(noteId: string): boolean {
        try {
            const currentQueue = useStudyStore.getState().activeQueue;
            // 防御性检查：确保 currentQueue 是一个数组
            if (!Array.isArray(currentQueue)) {
                console.warn(`Active queue is not an array, resetting to empty array`);
                useStudyStore.getState().setActiveQueue([]);
                return false;
            }
            const noteExists = currentQueue.includes(noteId);
            if (!noteExists) {
                console.warn(`Note with id ${noteId} not found in current queue`);
                return false;
            }
            const updatedQueue = currentQueue.filter(id => id !== noteId);
            useStudyStore.getState().setActiveQueue(updatedQueue);
            return true;
        } catch (error) {
            console.error('Error removing note from queue:', error);
            return false;
        }
    }


}


export const studyService = new StudyService();
export default studyService;