// @/types/anki.ts
// anki的原生类型，用于实现转换


export interface AnkiNote {
    id: number;
    guid: string;
    mid: number;
    mod: number;
    usn: number;
    tags: string;
    flds: string;
    sfld: string;
    csum: number;
    flags: number;
    data: string;
}

export interface AnkiRevLog {
    id: number;
    cid: string;
    mid: number;
    ease: number;
    ivl: number;
    lastIvl: string;
    factor: number;
    time: number;
    type: number;
}

export interface AnkiCard {
    id: number;
    nid: number;     // 对应的笔记ID
    did: number;     // 牌组ID(deck id)
    ord: number;     // 卡片序号，决定卡片模板
    mod: number;     // 修改时间戳
    usn: number;     // 更新序列号，用于同步
    type: number;    // 卡片类型(0=new, 1=learning, 2=review, 3=relearning)
    queue: number;   // 队列状态(-3=user buried, -2=sched buried, -1=suspended, 0=new, 1=learning, 2=review, 3=in learning, relapsed)
    due: number;     // 到期日(timestamp或天数)
    ivl: number;     // 间隔
    factor: number;  // 难度因子(千分比，如2500=250%)
    reps: number;    // 复习次数
    lapses: number;  // 失误次数
    left: number;    // 剩余学习步骤
    odue: number;    // 原始到期时间
    odid: number;    // 原始牌组ID
    flags: number;   // 标记
    data: string;    // 额外数据(JSON格式)
}


// 笔记模板类型
export enum AnkiModelType {
    BASIC = 1,                    // 基础卡片
    BASIC_AND_REVERSED = 2,       // 基础双向卡片
    BASIC_OPTIONAL_REVERSED = 3,  // 基础可选双向卡片
    CLOZE = 4,                    // 填空卡片
    IMAGE_OCCLUSION = 5,          // 图片遮挡卡片
}


// 卡片学习状态（对应type字段）
export enum AnkiCardType {
    NEW = 0,          // 新卡片
    LEARNING = 1,     // 学习中
    REVIEW = 2,       // 复习
    RELEARNING = 3    // 重新学习
}


// 添加解析图片遮罩数据的接口
export interface AnkiOcclusionData {
    original_image: string;
    question_svg: string;
    masks: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
  }
