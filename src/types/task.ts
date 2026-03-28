// 任务类型枚举
export enum TaskType {
    NEWBIE = 0,      // 新手任务（一次性）
    DAILY = 1,        // 日常任务（每天可完成）
    LIMITED = 2,    // 限时任务（有开始和结束时间）
}





// 任务定义接口（数据库存储）
export interface TaskDefinition {
    taskKey: string;                    // 唯一标识
    taskType: TaskType;                 // 任务类型
    rewardCoins: number;                // 奖励硬币数量
    taskProgress: number;                // 任务进度(整数)
    taskMaxProgress: number;             // 任务最大进度(整数)
    startTime?: number;                 // 限时任务开始时间（时间戳）
    endTime?: number;                   // 限时任务结束时间（时间戳）
    isActive: boolean;                  // 是否激活
}

