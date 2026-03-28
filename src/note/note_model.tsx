// @/types/note_model.ts


import { BaseModel } from '../types/base_model';
import { ImageNote } from './imageNote';
import { Recall } from '../fsrs/recall';
import { QuizModel } from '../quiz/quiz_model';


export type ParseFormat = 'text' | 'markdown';


export enum ColorLabel {
  GRAY = 0,        // 灰色 - 默认/无标签
  GREEN = 1,       // 绿色 - 级别1
  BLUE = 2,        // 蓝色 - 级别2  
  PURPLE = 3,      // 紫色 - 级别3
  ORANGE = 4,      // 橙色 - 级别4
  RED = 5,         // 红色
  YELLOW = 6,      // 黄色
  PINK = 7,        // 粉色
  CYAN = 8,        // 青色
  TEAL = 9,        // 青绿色
  INDIGO = 10,     // 靛蓝色
  BROWN = 11,      // 棕色
  AMBER = 12,      // 琥珀色
}


// 笔记的主要内容格式
export enum NoteContentType {
  HTML = 'html',     // 普通笔记（文本笔记）
  MARKDOWN = 'markdown',
  IMAGE = 'image',       // 图片笔记
  URL = 'url',          // 网址笔记，链接到具体的资源的笔记
  PDF = 'pdf',          // PDF笔记
}


export interface NoteFeatures {
  hasContent: boolean;         // 是否包含任何形式的内容
  hasTitle: boolean;           // 是否包含标题
  hasImages: boolean;          // 是否包含图片
  hasTags: boolean;            // 是否包含标签
  summary: string;             // 笔记摘要
  images: string[];
  wordCount: number;           // 字数统计
  hash: string;                // 笔记的hash值,用于判断去重
  quizzable: boolean;          // 是否可测验
}


export const defaultNoteFeatures: NoteFeatures = {
  hasContent: false,
  hasTitle: false,
  hasImages: false,
  hasTags: false,
  summary: '',
  images: [],
  hash: '',
  wordCount: 0,
  quizzable: true,
}



// 用于创建笔记的模型
// 基本笔记模型，用于创建笔记
export interface BaseNote extends BaseModel {
  title: string;
  markdown_text: string | null;
  html_text: string | null;
  deck_id: string | null;
  tags: string[];
  path: string[] | null; // 路径，如 ["第一章", "第一节"]，level可以通过path.length动态计算
  imageNote: ImageNote | null;
  quizzes?: QuizModel[]; // 测验题
}


// 所有笔记都必须实现的基础类型
export interface Note extends BaseNote {
  starred: boolean;
  created_at: string;
  updated_at: string;
  last_quiz_at: string | null;
  next_quiz_at: string | null;
  recall: Recall;
  position: number | null;  //卡片在笔记本中的位置
  links: { to: string[]; from: string[]; };
  archived: boolean;
  color: ColorLabel;
  features: NoteFeatures;
  original_deck?: string; // 原始的deck_id，删除时使用
  _deleted_at?: number;// 删除标记
  audio: string[] | null;
  unit: string | null
  hash: string | null;
  vector: number[];
  path: string[] | null; // 章节路径，如 ["第一章", "第一节"]，level可以通过path.length动态计算
}



export interface NoteFilterOptions {
  showTaggedOnly: boolean;
  showWithImagesOnly: boolean;
  showWithLinksOnly: boolean;
  showStarredOnly: boolean,
}

export const defaultNoteFilterOptions: NoteFilterOptions = {
  showTaggedOnly: false,
  showWithImagesOnly: false,
  showWithLinksOnly: false,
  showStarredOnly: false,
}

//NoteAction类型,处理Deck中的笔记操作
export type NoteAction =
  | 'delete'        // 删除笔记，移到回收站
  | 'undelete'      // 从回收站恢复笔记
  | 'hardDelete' //硬删除笔记
  | 'archive'       // 归档笔记，归档内容不会出现在学习队列
  | 'unarchive'     // 取消归档笔记
  | 'read'        // 阅读笔记
  | 'duplicate'     // 复制笔记
  | 'clearHistory'   // 清空学习记录  
  | 'impressed'      // 已有印象 - 快速将笔记推到"已有印象"进度 (20%)
  | 'familiar'       // 较为熟悉 - 快速将笔记推到"较为熟悉"进度 (45%)
  | 'mastered'       // 基本掌握 - 快速将笔记推到"基本掌握"进度 (75%)
  | 'fullyMastered'  // 完全掌握 - 标记为已掌握 (100%)
  | 'favorite'      // 收藏/取消收藏
  | 'unfavorite'      //  收藏/取消收藏
  | 'export'        // 导出笔记
  | 'info'    // 查看笔记调试信息
  | 'select'  // 添加新的动作类型
  | 'changeStyle'  // 更改卡片样式
  | 'speech'  // 语音朗读



