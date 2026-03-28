/**
 * fsrs.recall
 * ---------
 *
 * This module defines the Recall interface.
 *
 * Recall: Represents a flashcard in the FSRS system.
 */


export enum CardState {
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3,
}


export enum CardRating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export interface ReviewLog {
  rating: CardRating;
  date: string; // ISO string
  review_duration: number | null;
}

export interface Recall {
  state: CardState; // 卡片的学习状态
  step: number; // 学习步骤索引（LEARNING/RELEARNING 状态时使用）
  stability: number; // 记忆稳定性
  difficulty: number; // 记忆难度
  due: string; // 到期时间的 ISO 字符串
  reps: number; // 累计复习次数
  lapses: number; // 累计遗忘次数
  last_review: string | null; // 上次复习时间的 ISO 字符串
  review_logs: ReviewLog[]; // 复习记录数组
}


// 完全没学过的预设状态
export function defaultRecall(): Recall {
  return {
      state: CardState.LEARNING,
      step: 0,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      due: new Date().toISOString(),
      last_review: null,
      review_logs: [],
  };
}



// 验证并补全 Partial<Recall> 为完整的 Recall 对象
export function validateRecall(partialRecall: Partial<Recall>): Recall {
  const now = new Date();
  const defaultDate = now.toISOString();
  const validateDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return defaultDate;
      try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? defaultDate : date.toISOString();
      } catch {
          return defaultDate;
      }
  };
  const validateNumber = (num: number | null | undefined, min: number, max: number, defaultValue: number): number => {
      if (typeof num !== 'number' || isNaN(num)) return defaultValue;
      return Math.min(Math.max(num, min), max);
  };
  // 兼容性处理：state=0 (NEW) 会被修正为 1 (LEARNING)
  const state = validateNumber(partialRecall.state, CardState.LEARNING, CardState.RELEARNING, CardState.LEARNING) as CardState;
  const validateStep = (step: number | null | undefined, state: CardState): number => {
      if (step === null || step === undefined || typeof step !== 'number' || isNaN(step)) {
          if (state === CardState.LEARNING || state === CardState.RELEARNING) {
              return 0;
          }
          return -1;
      }
      if (state === CardState.REVIEW) {
          return -1; // REVIEW 状态的 step 固定为 -1
      }
      return Math.max(0, step); // LEARNING/RELEARNING 状态的 step 必须 >= 0
  };
  const step = validateStep(partialRecall.step, state);
  const stability = validateNumber(partialRecall.stability, 0, Infinity, 0);
  const difficulty = validateNumber(partialRecall.difficulty, 1, 10, 5);
  const reps = validateNumber(partialRecall.reps, 0, Infinity, 0);
  const lapses = validateNumber(partialRecall.lapses, 0, Infinity, 0);
  const review_logs: ReviewLog[] = Array.isArray(partialRecall.review_logs)
      ? partialRecall.review_logs.filter(log => {
          return log &&
              typeof log.rating === 'number' &&
              !isNaN(log.rating) &&
              log.rating >= CardRating.AGAIN &&
              log.rating <= CardRating.EASY &&
              log.date &&
              typeof log.date === 'string';
      })
      : [];
  return {
      state,
      step,
      stability,
      difficulty,
      reps,
      lapses,
      due: validateDate(partialRecall.due),
      last_review: partialRecall.last_review ? validateDate(partialRecall.last_review) : null,
      review_logs,
  };
}



// 从 Recall 对象计算掌握度（0-1 之间），retentionDays
export const getRecallMastery = (recall: Recall, retentionDays: number = 365): number => {
  if (recall.state === CardState.LEARNING || recall.state === CardState.RELEARNING || recall.stability === 0) {
    return 0;
  }
  const minStability = 0.1;
  const maxStability = retentionDays;
  const power = 0.5; // 可以调整这个参数来控制曲线形状
  const powMin = Math.pow(minStability, power);
  const powMax = Math.pow(maxStability, power);
  const currentPow = Math.pow(Math.max(recall.stability, minStability), power);
  const mastery = (currentPow - powMin) / (powMax - powMin);
  return Math.min(Math.max(mastery, 0), 1);
}



// 从掌握度计算稳定性
export const getStabilityFromMastery = (mastery: number, retentionDays: number = 365, power: number = 0.5): number => {
  const normalizedMastery = Math.max(0, Math.min(1, mastery));
  if (normalizedMastery >= 1) {
    return retentionDays;
  }
  if (normalizedMastery <= 0) {
    return 0;
  }
  const minStability = 0.1;
  const maxStability = retentionDays;
  const powMin = Math.pow(minStability, power);
  const powMax = Math.pow(maxStability, power);
  const targetPow = powMin + normalizedMastery * (powMax - powMin);
  return Math.pow(targetPow, 1 / power);
}