// @/lib/note/sort.ts

import { Note } from './note_model';
import { NoteSortKey, SortOrder, SortState } from '../deck/deck_model';
import { CardState } from '../fsrs/recall';
import seedrandom from 'seedrandom';

// 预计算的排序值
interface NoteSortData {
  id: string;
  primaryValue: number | string;
  secondaryValue?: number | string;
}

// 定义返回值类型，包含主排序值和次排序值
interface SortValues {
  primary: number | string;
  secondary?: number | string;
}

// 通用的值比较函数
function compareValues(a: any, b: any): number {
  // 处理 undefined 情况
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  
  // 数字比较
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  // 字符串比较（使用自然排序）
  const aStr = String(a);
  const bStr = String(b);
  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
}

// 修改排序函数使用新的排序值结构
export function sortNotes(
  notes: Note[],
  sortState: SortState
): Note[] {
  const sortData = notes.map(note => {
    const sortValues = sortState.key === 'title'
      ? getStringValue(note, 'title')
      : getNumericValue(note, sortState);
    return {
      id: note.id,
      primaryValue: sortValues.primary,
      secondaryValue: sortValues.secondary
    };
  });

  const compareFunc = (a: NoteSortData, b: NoteSortData): number => {
    const multiplier = sortState.order === 'asc' ? 1 : -1;
    
    // 比较主排序值
    const primaryDiff = compareValues(a.primaryValue, b.primaryValue);
    if (primaryDiff !== 0) return primaryDiff * multiplier;
    
    // 主排序值相同，比较次排序值
    const secondaryDiff = compareValues(a.secondaryValue, b.secondaryValue);
    if (secondaryDiff !== 0) return secondaryDiff * multiplier;
    
    // 都相同，按ID排序
    return a.id.localeCompare(b.id);
  };

  return sortData.sort(compareFunc).map(data => notes.find(note => note.id === data.id)).filter((note): note is Note => !!note);
}

// 修改函数签名，返回排序值对象
function getNumericValue(note: Note, sortState: SortState): SortValues {
  switch (sortState.key) {
    case 'created_at':
      return {
        primary: new Date(note.created_at).getTime(),
        secondary: note.id
      };
    case 'updated_at':
      return {
        primary: new Date(note.updated_at).getTime(),
        secondary: note.id
      };
    case 'last_review':
      return {
        primary: note.recall.last_review ? new Date(note.recall.last_review).getTime() : 0,
        secondary: note.id
      };
    case 'mastery':
      // 修复掌握程度排序逻辑
      if (note.archived) {
        // 归档状态 - 按照最大掌握程度排序（排在最后）
        return {
          primary: Number.MAX_SAFE_INTEGER,
          secondary: note.id
        };
      } else if (note.recall.state === CardState.LEARNING) {
        // 新学状态 - 按照最低掌握程度计算（排在最前）
        return {
          primary: -1, // 使用负数确保排在最前面
          secondary: note.id
        };
      } else {
        // 正常状态 - 使用稳定性作为掌握程度指标
        return {
          primary: note.recall.stability || 0,
          secondary: note.id
        };
      }
    case 'random':
      const rng = seedrandom((sortState.seed || 'default-seed') + '-' + note.id);
      return {
        primary: rng(),
      };
    case 'position':
      return {
        primary: note.position !== null ? note.position : new Date(note.created_at).getTime(),
        secondary: note.id
      };
    case 'color':
      return {
        primary: note.color || 0,
        secondary: note.id
      };
    case 'schedule':
      if (note.recall.state === CardState.LEARNING) {
        return {
          primary: Number.MAX_SAFE_INTEGER - 1,
          secondary: note.id
        };
      }
      return {
        primary: note.recall.due ? new Date(note.recall.due).getTime() : Number.MAX_SAFE_INTEGER - 2,
        secondary: note.id
      };
    default:
      return {
        primary: 0,
        secondary: note.id
      };
  }
}

// 获取标题排序值
function getStringValue(note: Note, key: NoteSortKey): SortValues {
  return {
    primary: (note.title || note.features.summary || '').toLowerCase().trim(),
  };
}