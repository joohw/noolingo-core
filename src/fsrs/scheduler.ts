/**
 * fsrs.scheduler
 * ---------
 *
 * This module defines the Scheduler class as well as the various constants used in its calculations.
 *
 * Classes:
 *    Scheduler: The FSRS spaced-repetition scheduler.
 */


import { CardState, CardRating, Recall, ReviewLog } from './recall';



export const FSRS_DEFAULT_DECAY = 0.1542;
export const DEFAULT_PARAMETERS = [
  0.212,   // [0] 初始稳定性 - AGAIN
  1.2931,  // [1] 初始稳定性 - HARD
  2.3065,  // [2] 初始稳定性 - GOOD
  8.2956,  // [3] 初始稳定性 - EASY
  6.4133,  // [4] 初始难度基准值
  0.8334,  // [5] 初始难度指数系数
  3.0194,  // [6] 难度变化系数
  0.001,   // [7] 难度均值回归权重
  1.8722,  // [8] 回忆稳定性指数系数
  0.1666,  // [9] 回忆稳定性幂系数
  0.796,   // [10] 回忆稳定性可提取性系数
  1.4835,  // [11] 遗忘稳定性长期参数
  0.0614,  // [12] 遗忘稳定性难度幂系数
  0.2629,  // [13] 遗忘稳定性稳定性幂系数
  1.6483,  // [14] 遗忘稳定性可提取性系数
  0.6014,  // [15] HARD 惩罚系数
  1.8729,  // [16] EASY 奖励系数
  0.5425,  // [17] 短期稳定性系数
  0.0912,  // [18] 短期稳定性偏移
  0.0658,  // [19] 短期稳定性幂系数
  FSRS_DEFAULT_DECAY, // [20] 衰减系数（用于记忆曲线计算）
];


export const STABILITY_MIN = 0.001;
export const LOWER_BOUNDS_PARAMETERS = [
  STABILITY_MIN, STABILITY_MIN, STABILITY_MIN, STABILITY_MIN,
  1.0, 0.001, 0.001, 0.001, 0.0, 0.0, 0.001, 0.001, 0.001, 0.001,
  0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.1,
];

export const INITIAL_STABILITY_MAX = 100.0;
export const UPPER_BOUNDS_PARAMETERS = [
  INITIAL_STABILITY_MAX, INITIAL_STABILITY_MAX, INITIAL_STABILITY_MAX, INITIAL_STABILITY_MAX,
  10.0, 4.0, 4.0, 0.75, 4.5, 0.8, 3.5, 5.0, 0.25, 0.9, 4.0, 1.0,
  6.0, 2.0, 2.0, 0.8, 0.8,
];

export const MIN_DIFFICULTY = 1.0;
export const MAX_DIFFICULTY = 10.0;

export interface FuzzRange {
  start: number;
  end: number;
  factor: number;
}

export const FUZZ_RANGES: FuzzRange[] = [
  { start: 2.5, end: 7.0, factor: 0.15 },
  { start: 7.0, end: 20.0, factor: 0.1 },
  { start: 20.0, end: Infinity, factor: 0.05 },
];


export class Scheduler {
  parameters: number[];
  desired_retention: number;
  learning_steps: number[]; // 存储天数
  relearning_steps: number[]; // 存储天数
  maximum_interval: number;
  enable_fuzzing: boolean;
  time_scale: number; // 时间缩放因子，默认 1.0（不缩放）
  private _DECAY: number;
  private _FACTOR: number;

  constructor(
    parameters: number[] = [...DEFAULT_PARAMETERS],
    desired_retention: number = 0.9,
    learning_steps: number[] = [0, 1], // 默认：0天（当天），1天
    relearning_steps: number[] = [1], // 默认：1天
    maximum_interval: number = 36500,
    enable_fuzzing: boolean = true,
    time_scale: number = 1.0 // 时间缩放因子，1.0 表示不缩放，2.0 表示间隔翻倍，0.5 表示间隔减半
  ) {
    this._validate_parameters(parameters);
    if (time_scale <= 0) {
      throw new Error('time_scale must be greater than 0');
    }
    this.parameters = [...parameters];
    this.desired_retention = desired_retention;
    this.learning_steps = learning_steps;
    this.relearning_steps = relearning_steps;
    this.maximum_interval = maximum_interval;
    this.enable_fuzzing = enable_fuzzing;
    this.time_scale = time_scale;
    this._DECAY = -this.parameters[20];
    this._FACTOR = Math.pow(0.9, 1 / this._DECAY) - 1;
  }

  private _validate_parameters(parameters: number[]): void {
    if (parameters.length !== LOWER_BOUNDS_PARAMETERS.length) {
      throw new Error(
        `Expected ${LOWER_BOUNDS_PARAMETERS.length} parameters, got ${parameters.length}.`
      );
    }
    const errorMessages: string[] = [];
    for (let index = 0; index < parameters.length; index++) {
      const parameter = parameters[index];
      const lowerBound = LOWER_BOUNDS_PARAMETERS[index];
      const upperBound = UPPER_BOUNDS_PARAMETERS[index];
      if (!(lowerBound <= parameter && parameter <= upperBound)) {
        errorMessages.push(
          `parameters[${index}] = ${parameter} is out of bounds: (${lowerBound}, ${upperBound})`
        );
      }
    }
    if (errorMessages.length > 0) {
      throw new Error(
        'One or more parameters are out of bounds:\n' + errorMessages.join('\n')
      );
    }
  }

  private _apply_time_scale(interval: number, timeScale?: number): number {
    const scale = timeScale !== undefined ? timeScale : this.time_scale;
    return interval * scale;
  }

  get_card_retrievability(recall: Recall, current_datetime?: Date): number {
    if (recall.last_review === null || recall.stability === 0) {
      return 0;
    }
    if (current_datetime === undefined) {
      current_datetime = new Date();
    }
    const lastReview = new Date(recall.last_review);
    const elapsedDays = Math.max(0, Math.floor((current_datetime.getTime() - lastReview.getTime()) / (24 * 60 * 60 * 1000)));
    return Math.pow(1 + this._FACTOR * elapsedDays / recall.stability, this._DECAY);
  }

  evaluate(
    recall: Recall,
    rating: CardRating,
    timeScale = 1,
    review_datetime?: Date,
    review_duration?: number | null,
  ): Recall {
    const utcReviewDatetime = review_datetime ? new Date(review_datetime.getTime()) : new Date();
    const newRecall: Recall = {
      state: recall.state,
      step: recall.step,
      stability: recall.stability,
      difficulty: recall.difficulty,
      due: recall.due,
      reps: recall.reps,
      lapses: recall.lapses,
      last_review: recall.last_review,
      review_logs: [...(recall.review_logs || [])],
    };
    const lastReview = newRecall.last_review ? new Date(newRecall.last_review) : null;
    // 从上次复习到现在经过的时间
    const daysSinceLastReview = lastReview
      ? Math.floor((utcReviewDatetime.getTime() - lastReview.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const recallState = newRecall.state;
    switch (recallState) {
      // 处理卡片新学习的情况
      case CardState.LEARNING:
        if (newRecall.step < 0) {
          throw new Error('Recall in Learning state must have step');
        }
        if (newRecall.stability === 0 || newRecall.difficulty === 0) {
          newRecall.stability = this._initial_stability(rating);
          newRecall.difficulty = this._initial_difficulty(rating, true);
        } else if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
          newRecall.stability = this._short_term_stability(newRecall.stability, rating);
          newRecall.difficulty = this._next_difficulty(newRecall.difficulty, rating);
        } else {
          newRecall.stability = this._next_stability(
            newRecall.difficulty,
            newRecall.stability,
            this.get_card_retrievability(newRecall, utcReviewDatetime),
            rating
          );
          newRecall.difficulty = this._next_difficulty(newRecall.difficulty, rating);
        }
        let nextInterval: number;
        if (this.learning_steps.length === 0 ||
          (newRecall.step >= 0 && newRecall.step >= this.learning_steps.length &&
            (rating === CardRating.HARD || rating === CardRating.GOOD || rating === CardRating.EASY))) {
          newRecall.state = CardState.REVIEW;
          newRecall.step = -1;
          nextInterval = this._next_interval(newRecall.stability); // 保持为天数
        } else {
          switch (rating) {
            case CardRating.AGAIN:
              newRecall.step = 0;
              nextInterval = this.learning_steps[newRecall.step];
              break;
            case CardRating.HARD:
              // HARD 保持当前 step，当天复现（step=0 时间隔为0天）
              nextInterval = this.learning_steps[newRecall.step];
              break;
            case CardRating.GOOD:
              if (newRecall.step >= 0 && newRecall.step + 1 === this.learning_steps.length) {
                newRecall.state = CardState.REVIEW;
                newRecall.step = -1;
                nextInterval = this._next_interval(newRecall.stability); // 保持为天数
              } else {
                newRecall.step = newRecall.step + 1;
                nextInterval = this.learning_steps[newRecall.step];
              }
              break;
            case CardRating.EASY:
              // EASY 直接进入 REVIEW 状态，不走学习步骤
              newRecall.state = CardState.REVIEW;
              newRecall.step = -1;
              nextInterval = this._next_interval(newRecall.stability); // 保持为天数
              break;
          }
        }
        let finalInterval = nextInterval;
        if (this.enable_fuzzing && newRecall.state === CardState.REVIEW) {
          // nextInterval 已经是天数，直接进行 fuzzing
          finalInterval = this._get_fuzzed_interval(nextInterval);
        }
        finalInterval = this._apply_time_scale(finalInterval, timeScale);
        // learning_steps 以天为单位，转换为毫秒
        newRecall.due = new Date(utcReviewDatetime.getTime() + finalInterval * 24 * 60 * 60 * 1000).toISOString();
        newRecall.last_review = utcReviewDatetime.toISOString();
        const reviewLog: ReviewLog = {
          rating: rating,
          date: utcReviewDatetime.toISOString(),
          review_duration: review_duration || null,
        };
        newRecall.review_logs.push(reviewLog);
        return newRecall;
      // 处理卡片复习的情况
      case CardState.REVIEW:
        if (newRecall.stability === 0 || newRecall.difficulty === 0) {
          throw new Error('Recall in Review state must have stability and difficulty');
        }
        if (daysSinceLastReview == null || daysSinceLastReview < 1) {
          // 短期增长
          newRecall.stability = this._short_term_stability(newRecall.stability, rating);
        } else {
          newRecall.stability = this._next_stability(
            newRecall.difficulty,
            newRecall.stability,
            this.get_card_retrievability(newRecall, utcReviewDatetime),
            rating
          );
        }
        newRecall.difficulty = this._next_difficulty(newRecall.difficulty, rating);
        let nextIntervalDays: number;
        switch (rating) {
          case CardRating.AGAIN:
            newRecall.lapses += 1;
            if (this.relearning_steps.length === 0) {
              nextIntervalDays = this._next_interval(newRecall.stability);
              if (this.enable_fuzzing) {
                nextIntervalDays = this._get_fuzzed_interval(nextIntervalDays);
              }
              nextIntervalDays = this._apply_time_scale(nextIntervalDays, timeScale);
              newRecall.due = new Date(utcReviewDatetime.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000).toISOString();
            } else {
              newRecall.state = CardState.RELEARNING;
              newRecall.step = 0;
              let relearningInterval = this.relearning_steps[newRecall.step];
              relearningInterval = this._apply_time_scale(relearningInterval, timeScale);
              // relearning_steps 以天为单位，转换为毫秒
              newRecall.due = new Date(utcReviewDatetime.getTime() + relearningInterval * 24 * 60 * 60 * 1000).toISOString();
            }
            break;
          case CardRating.HARD:
          case CardRating.GOOD:
          case CardRating.EASY:
            nextIntervalDays = this._next_interval(newRecall.stability);
            if (this.enable_fuzzing) {
              nextIntervalDays = this._get_fuzzed_interval(nextIntervalDays);
            }
            nextIntervalDays = this._apply_time_scale(nextIntervalDays, timeScale);
            newRecall.due = new Date(utcReviewDatetime.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
        newRecall.last_review = utcReviewDatetime.toISOString();
        newRecall.reps += 1;
        const reviewLog2: ReviewLog = {
          rating: rating,
          date: utcReviewDatetime.toISOString(),
          review_duration: review_duration || null,
        };
        newRecall.review_logs.push(reviewLog2);
        return newRecall;
      // 处理卡片忘记，重新学习的情况
      case CardState.RELEARNING:
        if (newRecall.stability === 0 || newRecall.difficulty === 0 || newRecall.step < 0) {
          throw new Error('Recall in Relearning state must have stability, difficulty, and step');
        }
        if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
          newRecall.stability = this._short_term_stability(newRecall.stability, rating);
          newRecall.difficulty = this._next_difficulty(newRecall.difficulty, rating);
        } else {
          newRecall.stability = this._next_stability(
            newRecall.difficulty,
            newRecall.stability,
            this.get_card_retrievability(newRecall, utcReviewDatetime),
            rating
          );
          newRecall.difficulty = this._next_difficulty(newRecall.difficulty, rating);
        }
        let nextInterval2: number;
        if (this.relearning_steps.length === 0 ||
          (newRecall.step >= 0 && newRecall.step >= this.relearning_steps.length &&
            (rating === CardRating.HARD || rating === CardRating.GOOD || rating === CardRating.EASY))) {
          newRecall.state = CardState.REVIEW;
          newRecall.step = -1;
          nextInterval2 = this._next_interval(newRecall.stability); // 保持为天数
        } else {
          switch (rating) {
            case CardRating.AGAIN:
              newRecall.step = 0;
              nextInterval2 = this.relearning_steps[newRecall.step];
              break;
            case CardRating.HARD:
              // HARD 保持当前 step，当天复现（step=0 时间隔为0天）
              nextInterval2 = this.relearning_steps[newRecall.step];
              break;
            case CardRating.GOOD:
              if (newRecall.step + 1 === this.relearning_steps.length) {
                newRecall.state = CardState.REVIEW;
                newRecall.step = -1;
                nextInterval2 = this._next_interval(newRecall.stability); // 保持为天数
              } else {
                newRecall.step += 1;
                nextInterval2 = this.relearning_steps[newRecall.step];
              }
              break;
            case CardRating.EASY:
              // EASY 直接进入 REVIEW 状态，不走重学步骤
              newRecall.state = CardState.REVIEW;
              newRecall.step = -1;
              nextInterval2 = this._next_interval(newRecall.stability); // 保持为天数
              break;
          }
        }
        let finalInterval2 = nextInterval2;
        if (this.enable_fuzzing && newRecall.state === CardState.REVIEW) {
          // nextInterval2 已经是天数，直接进行 fuzzing
          finalInterval2 = this._get_fuzzed_interval(nextInterval2);
        }
        finalInterval2 = this._apply_time_scale(finalInterval2, timeScale);
        // relearning_steps 以天为单位，转换为毫秒
        newRecall.due = new Date(utcReviewDatetime.getTime() + finalInterval2 * 24 * 60 * 60 * 1000).toISOString();
        newRecall.last_review = utcReviewDatetime.toISOString();
        newRecall.reps += 1;
        const reviewLog3: ReviewLog = {
          rating: rating,
          date: utcReviewDatetime.toISOString(),
          review_duration: review_duration || null,
        };
        newRecall.review_logs.push(reviewLog3);
        return newRecall;
    }
  }

  // 计算遗忘曲线：返回指定稳定性的笔记在 n 天后的记忆保留率
  forgettingCurve(stability: number, days: number): number {
    if (stability <= 0 || days < 0) {
      return 0;
    }
    if (days === 0) {
      return 1; // 当天记忆保留率为 100%
    }
    return Math.pow(1 + this._FACTOR * days / stability, this._DECAY);
  }


  // 预估不同评分选项的结果
  estimate(recall: Recall, timeScale = 1, review_datetime?: Date): { again: Recall; hard: Recall; good: Recall; easy: Recall } {
    const now = review_datetime || new Date();
    const deepCopyRecall = (r: Recall): Recall => ({
      state: r.state,
      step: r.step,
      stability: r.stability,
      difficulty: r.difficulty,
      reps: r.reps,
      lapses: r.lapses,
      due: r.due,
      last_review: r.last_review,
      review_logs: [...r.review_logs],
    });
    return {
      again: this.evaluate(deepCopyRecall(recall), CardRating.AGAIN, timeScale),
      hard: this.evaluate(deepCopyRecall(recall), CardRating.HARD, timeScale),
      good: this.evaluate(deepCopyRecall(recall), CardRating.GOOD, timeScale),
      easy: this.evaluate(deepCopyRecall(recall), CardRating.EASY, timeScale),
    };
  }


  reschedule_card(recall: Recall, timeScale = 1): Recall {
    if (!recall.review_logs || recall.review_logs.length === 0) {
      throw new Error('Recall must have review_logs to reschedule');
    }
    const sortedLogs = [...recall.review_logs].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let rescheduledRecall: Recall = {
      state: CardState.LEARNING, // 重新调度时从 Learning 状态开始
      step: 0,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      due: recall.due,
      last_review: null,
      review_logs: [],
    };
    for (const reviewLog of sortedLogs) {
      rescheduledRecall = this.evaluate(
        rescheduledRecall,
        reviewLog.rating,
        timeScale,
        new Date(reviewLog.date),
        reviewLog.review_duration

      );
    }
    return rescheduledRecall;
  }



  private _clamp_difficulty(difficulty: number): number {
    return Math.min(Math.max(difficulty, MIN_DIFFICULTY), MAX_DIFFICULTY);
  }

  private _clamp_stability(stability: number): number {
    return Math.max(stability, STABILITY_MIN);
  }

  private _initial_stability(rating: CardRating): number {
    let initialStability = this.parameters[rating - 1];
    initialStability = this._clamp_stability(initialStability);
    return initialStability;
  }

  private _initial_difficulty(rating: CardRating, clamp: boolean): number {
    let initialDifficulty = this.parameters[4] - Math.exp(this.parameters[5] * (rating - 1)) + 1;
    if (clamp) {
      initialDifficulty = this._clamp_difficulty(initialDifficulty);
    }
    return initialDifficulty;
  }

  private _next_interval(stability: number): number {
    let nextInterval = (stability / this._FACTOR) * (Math.pow(this.desired_retention, 1 / this._DECAY) - 1);
    nextInterval = Math.round(nextInterval);
    nextInterval = Math.max(nextInterval, 1);
    nextInterval = Math.min(nextInterval, this.maximum_interval);
    return nextInterval;
  }

  private _short_term_stability(stability: number, rating: CardRating): number {
    let shortTermStabilityIncrease = Math.exp(this.parameters[17] * (rating - 3 + this.parameters[18])) *
      Math.pow(stability, -this.parameters[19]);
    if (rating === CardRating.GOOD || rating === CardRating.EASY) {
      shortTermStabilityIncrease = Math.max(shortTermStabilityIncrease, 1.0);
    }
    const shortTermStability = stability * shortTermStabilityIncrease;
    return this._clamp_stability(shortTermStability);
  }

  private _next_difficulty(difficulty: number, rating: CardRating): number {
    const _linear_damping = (deltaDifficulty: number, difficulty: number): number => {
      return (10.0 - difficulty) * deltaDifficulty / 9.0;
    };
    const _mean_reversion = (arg1: number, arg2: number): number => {
      return this.parameters[7] * arg1 + (1 - this.parameters[7]) * arg2;
    };
    const arg1 = this._initial_difficulty(CardRating.EASY, false);
    const deltaDifficulty = -(this.parameters[6] * (rating - 3));
    const arg2 = difficulty + _linear_damping(deltaDifficulty, difficulty);
    let nextDifficulty = _mean_reversion(arg1, arg2);
    nextDifficulty = this._clamp_difficulty(nextDifficulty);
    return nextDifficulty;
  }

  private _next_stability(
    difficulty: number,
    stability: number,
    retrievability: number,
    rating: CardRating
  ): number {
    let nextStability: number;
    if (rating === CardRating.AGAIN) {
      nextStability = this._next_forget_stability(difficulty, stability, retrievability);
    } else if (rating === CardRating.HARD || rating === CardRating.GOOD || rating === CardRating.EASY) {
      nextStability = this._next_recall_stability(difficulty, stability, retrievability, rating);
    } else {
      nextStability = stability;
    }
    nextStability = this._clamp_stability(nextStability);
    return nextStability;
  }

  private _next_forget_stability(difficulty: number, stability: number, retrievability: number): number {
    const nextForgetStabilityLongTermParams = this.parameters[11] *
      Math.pow(difficulty, -this.parameters[12]) *
      (Math.pow(stability + 1, this.parameters[13]) - 1) *
      Math.exp((1 - retrievability) * this.parameters[14]);
    const nextForgetStabilityShortTermParams = stability / Math.exp(this.parameters[17] * this.parameters[18]);
    return Math.min(nextForgetStabilityLongTermParams, nextForgetStabilityShortTermParams);
  }

  private _next_recall_stability(
    difficulty: number,
    stability: number,
    retrievability: number,
    rating: CardRating
  ): number {
    const hardPenalty = rating === CardRating.HARD ? this.parameters[15] : 1;
    const easyBonus = rating === CardRating.EASY ? this.parameters[16] : 1;
    return stability * (
      1 +
      Math.exp(this.parameters[8]) *
      (11 - difficulty) *
      Math.pow(stability, -this.parameters[9]) *
      (Math.exp((1 - retrievability) * this.parameters[10]) - 1) *
      hardPenalty *
      easyBonus
    );
  }

  private _get_fuzzed_interval(intervalDays: number): number {
    if (intervalDays < 2.5) {
      return intervalDays;
    }
    const _get_fuzz_range = (intervalDays: number): [number, number] => {
      let delta = 1.0;
      for (const fuzzRange of FUZZ_RANGES) {
        delta += fuzzRange.factor * Math.max(
          Math.min(intervalDays, fuzzRange.end) - fuzzRange.start,
          0.0
        );
      }
      let minIvl = Math.round(intervalDays - delta);
      let maxIvl = Math.round(intervalDays + delta);
      minIvl = Math.max(2, minIvl);
      maxIvl = Math.min(maxIvl, this.maximum_interval);
      minIvl = Math.min(minIvl, maxIvl);
      return [minIvl, maxIvl];
    };
    const [minIvl, maxIvl] = _get_fuzz_range(intervalDays);
    const fuzzedIntervalDays = Math.random() * (maxIvl - minIvl + 1) + minIvl;
    return Math.min(Math.round(fuzzedIntervalDays), this.maximum_interval);
  }
}

