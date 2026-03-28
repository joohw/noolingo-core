// @/lib/import/types.ts



import { Note } from '../../note';


export interface ImportStats {
  total: number;
  errors: number;
}


export interface ConversionResult {
    notes: Note[];
    deckName: string;
    stats?: ImportStats;
}


// 统一的转换选项接口
export interface ConversionOptions {
    useFirstLineAsTitle?: boolean;  // 将第一行作为标题
    includeTags?: boolean;          // 是否包含标签
    defaultDeckName?: string;       // 默认使用的牌组名称
    maxLength?: number;             // 单篇笔记的最大长度
    maxNotes?: number;              // 单篇笔记的最大笔记数
    splitByBlankLines?: boolean;    // 是否按三个空行分割为多篇笔记
}


// 统一的转换器接口
export interface FileConverter {
    (buffer: ArrayBuffer, options?: ConversionOptions): Promise<ConversionResult>;
}
