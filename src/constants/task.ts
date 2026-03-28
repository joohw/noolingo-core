// 任务配置接口
export interface TaskConfig {
    taskKey: string;                    // 唯一标识
    rewardCoins: number;                // 奖励硬币数量
    taskMaxProgress: number;             // 任务最大进度(整数)
}


// 新手任务配置列表
export const NEWBIE_TASKS: TaskConfig[] = [
    {
        taskKey: 'newbie_create_first_note',
        rewardCoins: 10,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'newbie_add_tag',
        rewardCoins: 10,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'newbie_complete_first_review',
        rewardCoins: 10,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'newbie_master_1_note',
        rewardCoins: 10,
        taskMaxProgress: 1,
    },
];


// 日常任务配置列表
export const DAILY_TASKS: TaskConfig[] = [
    {
        taskKey: 'daily_review_20_notes',
        rewardCoins: 1,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'daily_create_3_notes',
        rewardCoins: 1,
        taskMaxProgress: 1,
    },
];


// 限时任务配置列表（暂时留空）
export const LIMITED_TASKS: TaskConfig[] = [
];


// 邀请任务配置列表
export const INVITE_TASKS: TaskConfig[] = [
    {
        taskKey: 'invite_friends_1',
        rewardCoins: 100,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'invite_friends_3',
        rewardCoins: 300,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'invite_friends_6',
        rewardCoins: 600,
        taskMaxProgress: 1,
    },
    {
        taskKey: 'invite_friends_12',
        rewardCoins: 1200,
        taskMaxProgress: 1,
    },
];


// 所有任务配置列表（合并所有类型）
export const TASK_CONFIGS: TaskConfig[] = [
    ...NEWBIE_TASKS,
    ...DAILY_TASKS,
    ...LIMITED_TASKS,
    ...INVITE_TASKS,
];


// 根据 taskKey 获取任务类型
export function getTaskType(taskKey: string): 'newbie' | 'daily' | 'limited' | 'invite' {
    if (taskKey.startsWith('newbie_')) return 'newbie';
    if (taskKey.startsWith('daily_')) return 'daily';
    if (taskKey.startsWith('limited_')) return 'limited';
    if (taskKey.startsWith('invite_')) return 'invite';
    return 'newbie';
}


// 获取所有可能的任务列表
export function getAllTasks(): TaskConfig[] {
    return TASK_CONFIGS;
}


// 按类型分组获取任务
export function getTasksByType(type: 'newbie' | 'daily' | 'limited' | 'invite'): TaskConfig[] {
    switch (type) {
        case 'newbie':
            return NEWBIE_TASKS;
        case 'daily':
            return DAILY_TASKS;
        case 'limited':
            return LIMITED_TASKS;
        case 'invite':
            return INVITE_TASKS;
        default:
            return [];
    }
}
