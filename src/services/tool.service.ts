// @/core/services/tool.service.ts
// 工具调用服务 - 处理 AI 工具调用


import { SearchQuery } from '../types/search_model';
import indicesService from './indices.service';
import { Note } from '../note/note_model';


// 工具函数实现
export class ToolService {
    // 搜索笔记工具
    async searchNotes(query: SearchQuery): Promise<Note[]> {
        try {
            const results = await indicesService.search(query);
            return results;
        } catch (error) {
            console.error('Tool searchNotes error:', error);
            return [];
        }
    }
}


// 工具定义
export const TOOL_DEFINITIONS = [
    {
        type: 'function' as const,
        function: {
            name: 'search_notes',
            description: '搜索用户的笔记。可以根据文本、标题、标签等条件搜索笔记。',
            parameters: {
                type: 'object' as const,
                properties: {
                    text: {
                        type: 'string' as const,
                        description: '在笔记标题和摘要中搜索的文本关键词'
                    },
                    title: {
                        type: 'string' as const,
                        description: '精确匹配笔记标题'
                    },
                    tags: {
                        type: 'array' as const,
                        items: {
                            type: 'string' as const
                        },
                        description: '按标签搜索笔记'
                    },
                    deckId: {
                        type: 'string' as const,
                        description: '限制搜索范围到特定的笔记本ID'
                    },
                    limit: {
                        type: 'number' as const,
                        description: '限制返回结果的数量，默认为10'
                    }
                },
                required: [] as string[]
            }
        }
    }
];


// 执行工具调用
export async function executeToolCall(toolName: string, argumentsJson: string): Promise<string> {
    const toolService = new ToolService();
    try {
        const args = JSON.parse(argumentsJson);
        switch (toolName) {
            case 'search_notes': {
                const query: SearchQuery = {
                    text: args.text,
                    title: args.title,
                    tags: args.tags,
                    deckId: args.deckId,
                    limit: args.limit || 10
                };
                const notes = await toolService.searchNotes(query);
                // 格式化返回结果
                if (notes.length === 0) {
                    return JSON.stringify({ 
                        success: true, 
                        count: 0, 
                        message: '未找到匹配的笔记' 
                    });
                }
                const results = notes.map(note => ({
                    id: note.id,
                    title: note.title || '无标题',
                    summary: note.features?.summary || '',
                    tags: note.tags || [],
                    deckId: note.deck_id
                }));
                return JSON.stringify({ 
                    success: true, 
                    count: results.length, 
                    notes: results 
                }, null, 2);
            }
            default:
                return JSON.stringify({ 
                    success: false, 
                    error: `未知的工具: ${toolName}` 
                });
        }
    } catch (error) {
        console.error('Tool execution error:', error);
        return JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : '工具执行失败' 
        });
    }
}


export const toolService = new ToolService();
export default toolService;

