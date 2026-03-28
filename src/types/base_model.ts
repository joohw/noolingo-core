// @/types/base_model.ts
// 用于实现同步的基础模型
// Todo，同步模型需要简化为Put和Delete两种操作

export type StoreName = 'localUser'
  | 'localDecks'
  | 'localNotes'
  | 'localNotes'
  | 'localQuizzes'
  | 'localChats'
  | 'localDailyStudyData'
  | 'tombStones'


export interface BaseModel {
  id: string;//字段从_id改为id，避免和保留字段冲突。云端使用自动生成的_id，本地无须处理
  syncStatus?: 'synced' | 'pending';//本地同步状态，synced表示已同步，pending表示未同步，后写入者胜利
  store?: StoreName;//表名，用于墓碑表
  _ver?: number;//rev版本号,最后修改的时间戳
}

