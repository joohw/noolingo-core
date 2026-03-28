// @/lib/note/filter.ts


import { Note, ColorLabel } from '.';
import { CardState } from '../fsrs/recall';



// 简化后的笔记过滤配置接口
export interface NoteFilterConfig {
  starred?: boolean;          // 星标笔记
  hasTag?: boolean;           // 有标签的笔记
  hasImage?: boolean;         // 有图片的笔记
  hasLink?: boolean;          // 有链接的笔记
  reviewState?: 'all' | 'new' | 'due' | 'reviewable';  // 学习状态过滤
  contentType?: {
    hasTitle?: boolean;       // 有标题
    isLongNote?: boolean;     // 长笔记
  };
  tags?: {
    include?: string[];       // 包含标签
    exclude?: string[];       // 排除标签
  };
  priority?: ColorLabel[];      // 优先级列表
  dateRange?: {
    created?: {
      after?: Date;           // 在此日期后创建
      before?: Date;          // 在此日期前创建
    };
    updated?: {
      after?: Date;           // 在此日期后更新
      before?: Date;          // 在此日期前更新
    };
  };
  searchText?: string;        // 搜索文本
}


// 过滤笔记列表
export function filterNotes(notes: Note[], config: NoteFilterConfig): Note[] {
  return notes.filter(note => {
    if (config.starred && !note.starred) return false;
    if (config.hasTag && (!note.tags || note.tags.length === 0)) return false;
    if (config.hasImage && !note.features.hasImages) return false;
    if (config.hasLink && (!note.links || note.links.to.length === 0)) return false;
    if (config.reviewState) {
      switch (config.reviewState) {
        case 'new':
          if (note.recall.state !== CardState.LEARNING) return false;
          break;
        case 'due':
          const dueDate = note.recall.due ? new Date(note.recall.due) : null;
          if (!dueDate || dueDate > new Date()) return false;
          break;
        case 'reviewable':
          const isReviewable = note.recall.state === CardState.REVIEW ||
            note.recall.state === CardState.LEARNING;
          if (!isReviewable) return false;
          break;
      }
    }
    if (config.contentType) {
      const { hasTitle } = config.contentType;
      if (hasTitle && !note.features.hasTitle) return false;
    }
    if (config.tags) {
      const { include, exclude } = config.tags;
      if (include && include.length > 0) {
        if (!note.tags || !note.tags.some(tag => include.includes(tag))) return false;
      }
      if (exclude && exclude.length > 0) {
        if (note.tags && note.tags.some(tag => exclude.includes(tag))) return false;
      }
    }
    if (config.priority && config.priority.length > 0) {
      if (!config.priority.includes(note.color as ColorLabel)) return false;
    }
    if (config.dateRange) {
      const { created, updated } = config.dateRange;
      if (created) {
        if (created.after) {
          const createdDate = new Date(note.created_at);
          if (createdDate < created.after) return false;
        }
        if (created.before) {
          const createdDate = new Date(note.created_at);
          if (createdDate > created.before) return false;
        }
      }
      if (updated) {
        if (updated.after) {
          const updatedDate = new Date(note.updated_at);
          if (updatedDate < updated.after) return false;
        }
        if (updated.before) {
          const updatedDate = new Date(note.updated_at);
          if (updatedDate > updated.before) return false;
        }
      }
    }
    if (config.searchText) {
      const searchText = config.searchText.toLowerCase();
      const title = (note.title || '').toLowerCase();
      const summary = (note.features.summary || '').toLowerCase();
      const content = (note.html_text || note.markdown_text || '').toLowerCase();
      const hasMatch = title.includes(searchText) ||
        summary.includes(searchText) ||
        content.includes(searchText);
      if (!hasMatch) return false;
    }
    return true;
  });
}

// 合并多个过滤配置
export function mergeFilterConfigs(...configs: NoteFilterConfig[]): NoteFilterConfig {
  return configs.reduce((merged, config) => {
    const result: NoteFilterConfig = { ...merged };
    // 合并基本配置
    if (config.starred !== undefined) result.starred = config.starred;
    if (config.hasTag !== undefined) result.hasTag = config.hasTag;
    if (config.hasImage !== undefined) result.hasImage = config.hasImage;
    if (config.hasLink !== undefined) result.hasLink = config.hasLink;
    if (config.reviewState !== undefined) result.reviewState = config.reviewState;
    if (config.searchText !== undefined) result.searchText = config.searchText;
    // 合并内容特性
    if (config.contentType) {
      result.contentType = {
        ...(result.contentType || {}),
        ...config.contentType
      };
    }
    // 合并标签
    if (config.tags) {
      result.tags = result.tags || {};
      if (config.tags.include) {
        result.tags.include = [
          ...(result.tags.include || []),
          ...config.tags.include
        ];
      }
      if (config.tags.exclude) {
        result.tags.exclude = [
          ...(result.tags.exclude || []),
          ...config.tags.exclude
        ];
      }
    }
    // 合并优先级
    if (config.priority) {
      result.priority = [
        ...(result.priority || []),
        ...config.priority
      ];
    }
    // 合并日期范围
    if (config.dateRange) {
      result.dateRange = result.dateRange || {};
      if (config.dateRange.created) {
        result.dateRange.created = {
          ...(result.dateRange.created || {}),
          ...config.dateRange.created
        };
      }
      if (config.dateRange.updated) {
        result.dateRange.updated = {
          ...(result.dateRange.updated || {}),
          ...config.dateRange.updated
        };
      }
    }
    return result;
  }, {} as NoteFilterConfig);
}
