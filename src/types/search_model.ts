// @/types/search_model.ts

import { SortState } from "../deck";


export interface SearchQuery {
    deckId?: string;    // 卡片集ID，可选参数
    path?: string[] | null; // 章节路径，可选参数
    limit?: number;      // 限制搜索结果数量
    text?: string;      // 普通文本搜索
    title?: string;     // 标题搜索
    tags?: string[];     // 标签搜索
    sortState?: SortState; // 排序状态
}


export const  parseSearchParams = (url: string) => {
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const pathParam = searchParams.get('path');
  let path: string[] | null | undefined = undefined;
  if (pathParam) {
    try {
      path = JSON.parse(pathParam);
    } catch {
      path = null;
    }
  }
  const searchQuery = {
    limit: parseInt(searchParams.get('limit') || '0'),
    text: searchParams.get('text') || undefined,
    title: searchParams.get('title') || undefined,
    tags: searchParams.getAll('tags'), // 获取所有 tags 值作为数组
    deckId: searchParams.get('deckId') || undefined,
    path: path
  };
  return searchQuery;
}



export const serializeSearchParams = (searchQuery: SearchQuery): URLSearchParams => {
  const params = new URLSearchParams();
  if (searchQuery.limit !== undefined && searchQuery.limit > 0) {
    params.set('limit', searchQuery.limit.toString());
  }
  if (searchQuery.text) {
    params.set('text', searchQuery.text);
  }
  if (searchQuery.title) {
    params.set('title', searchQuery.title);
  }
  if (searchQuery.deckId) {
    params.set('deckId', searchQuery.deckId);
  }
  // 处理 path 数组
  if (searchQuery.path !== undefined) {
    if (searchQuery.path === null) {
      params.set('path', 'null');
    } else if (searchQuery.path.length > 0) {
      params.set('path', JSON.stringify(searchQuery.path));
    }
  }
  // 处理 tags 数组
  if (searchQuery.tags && searchQuery.tags.length > 0) {
    params.delete('tags');
    searchQuery.tags.forEach(tag => {
      if (tag.trim() !== '') {
        params.append('tags', tag);
      }
    });
  }
  return params;
}