// @/core/services/import.service.ts
// 导入服务 - 用于实现笔记的批量创建和导入


import aiService from './ai.service';
import { getNoteImportPrompt, parseNotesImport } from '../prompts/import';
import { useImportStore } from '../stores/importStore';
import { useAIStore } from '../stores/aiStore';
import { Note } from '../note/note_model';


export class ImportService {
  private baseURL = 'https://api.moonshot.cn/v1';
  private apiKey: string;


  constructor() {
    this.apiKey = 'sk-TqrlBERXSDVZ3HXsTiQB4df5TVabEozvcWoAqGt2NIYvhs1g';
  }


  async generateNotes(content: string, template?: string): Promise<Note[]> {
    if (useAIStore.getState().isGenerating) {
      console.warn('正在生成中，请勿重复操作');
      return [];
    }
    try {
      useImportStore.getState().setIsGenerating(true);
      useImportStore.getState().setGeneratingNotes('');
      const models = aiService.getTextsModels();
      if (models.length === 0) {
        throw new Error(('import.noAiModel'));
      }
      
      const stream = await aiService.completeTextStreamly({
        model: models[0],
        userPrompt: getNoteImportPrompt(content, template),
        temperature: 0.7,
        maxTokens: 4000
      });
      let fullContent = '';
      useImportStore.getState().setNotesToImport([]);
      for await (const chunk of stream) {
        if (!useImportStore.getState().isGenerating) {
          useImportStore.getState().setGeneratingNotes('');
          break;
        }
        fullContent += chunk;
        useImportStore.getState().setGeneratingNotes(fullContent);
      }
      
      if (!useImportStore.getState().isGenerating) {
        return [];
      }
      const notes = parseNotesImport(fullContent);
      useImportStore.getState().setIsGenerating(false);
      return notes;
    } catch (error) {
      console.error(error);
      useImportStore.getState().setIsGenerating(false);
      useImportStore.getState().setGeneratingNotes('');
      return [];
    }
  }



  // 使用 XMLHttpRequest 上传文件（支持 React Native FormData）
  private uploadFileWithXHR(formData: FormData, url: string, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.statusText || xhr.status}`));
        }
      };
      xhr.onerror = () => {
        reject(new Error('网络请求失败'));
      };
      xhr.send(formData as any);
    });
  }


  // 解析文件内容
  async parseFile(file: File | FormData | { uri: string; name: string; type: string }): Promise<string> {
    try {
      useImportStore.getState().setIsParsing(true);
      const formData = new FormData();
      if (typeof (file as any).uri === 'string') {
        const { uri, name, type } = file as { uri: string; name: string; type: string };
        formData.append('file', {
          uri: uri,
          type: type || 'application/octet-stream',
          name: name || 'file',
        } as any);
      } else if (file instanceof FormData) {
        formData.append('file', file.get('file')!);
      } else {
        formData.append('file', file as File);
      }
      formData.append('purpose', 'file-extract');
      const uploadResult = await this.uploadFileWithXHR(formData, `${this.baseURL}/files`, {
        'Authorization': `Bearer ${this.apiKey}`,
      });
      const fileId = uploadResult.id;
      const contentResponse = await fetch(`${this.baseURL}/files/${fileId}/content`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      if (!contentResponse.ok) {
        throw new Error(`获取文件内容失败: ${contentResponse.statusText}`);
      }
      const content = await contentResponse.text();
      const cleanedContent = this.extractTextContent(content);
      fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }).catch(error => {
        console.warn('删除临时文件失败:', error);
      });
      return cleanedContent;
    } finally {
      useImportStore.getState().setIsParsing(false);
    }
  }




  // 从 API 响应中提取纯文本内容
  private extractTextContent(content: string): string {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        const textFields = ['content', 'text', 'data', 'result', 'extracted_text'];
        for (const field of textFields) {
          if (parsed[field] && typeof parsed[field] === 'string') {
            return parsed[field];
          }
        }
        for (const value of Object.values(parsed)) {
          if (typeof value === 'string') {
            return value;
          }
        }
      }
      return content;
    } catch (error) {
      return content;
    }
  }




}

const importService = new ImportService();
export default importService;