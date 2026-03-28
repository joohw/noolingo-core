// @/services/quiz.service.ts

import { Service } from './service'
import aiService from './ai.service';
import indicesService from './indices.service';
import { useQuizStore } from '../stores/quizStore';
import { useNoteStore } from '../stores/noteStore';
import { getAiLanguage } from '../utils/language';
import { getQuizPrompt, QuizType, parseQuizText } from '../quiz';


export class QuizService implements Service {

  private MAX_CONCURRENT_GENERATIONS = 10;
  private allowedQuizTypes?: QuizType[];

  constructor() {
  }

  async init(): Promise<void> {
    console.log('QuizService init');
  }


  // 设置允许的题型（可选，如果不设置则支持所有题型）
  public setAllowedQuizTypes(types?: QuizType[]): void {
    this.allowedQuizTypes = types;
  }


  // 获取当前允许的题型
  public getAllowedQuizTypes(): QuizType[] | undefined {
    return this.allowedQuizTypes;
  }


  // 生成缓存key（包含noteId、测验模式和语言）
  private async getCacheKey(noteId: string, quizModeId?: string): Promise<string> {
    const language = await getAiLanguage();
    const parts = [noteId];
    if (quizModeId) {
      parts.push(quizModeId);
    }
    parts.push(language);
    return parts.join('_');
  }




  // 为笔记生成指定难度的生成新题目
  public async generateQuestion(noteId: string, onTextUpdate?: (text: string) => void): Promise<void> {
    const store = useQuizStore.getState();
    const note = useNoteStore.getState().notesMap.get(noteId);
    const language = await getAiLanguage();
    const selectedQuizMode = store.selectedQuizMode;
    const cacheKey = await this.getCacheKey(noteId, selectedQuizMode);
    store.removeQuiz(cacheKey);
    if (!note || note.features.quizzable === false) return;
    const availableModels = aiService.getTextsModels();
    if (!availableModels.length) {
      store.setError('AI models not available');
      return;
    }
    const selectModel = availableModels[0];
    try {
      const userPrompt = this.getNoteContext(noteId);
      if (!userPrompt || userPrompt.trim().length === 0) {
        return;
      }
      const systemPrompt = getQuizPrompt(selectedQuizMode);

      let finalContent: string;

      // 检查模型是否支持流式响应
      if (selectModel.supportStreaming) {
        let accumulatedText = '';
        const generator = await aiService.completeTextStreamly({
          model: selectModel,
          userPrompt: userPrompt,
          systemPrompt: systemPrompt,
          temperature: 1
        });
        for await (const chunk of generator) {
          accumulatedText += chunk;
          store.setQuizText(cacheKey, accumulatedText);
          if (onTextUpdate) {
            onTextUpdate(accumulatedText);
          }
        }
        finalContent = accumulatedText;
      } else {
        // 使用普通生成
        const fullResponse = await aiService.completeText({
          model: selectModel,
          userPrompt: userPrompt,
          systemPrompt: systemPrompt,
          temperature: 0.9
        });
        finalContent = fullResponse.content || '';
        if (finalContent) {
          store.setQuizText(cacheKey, finalContent);
          if (onTextUpdate) {
            onTextUpdate(finalContent);
          }
        }
      }

      if (!finalContent) {
        store.setError('AI response is empty');
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate Quiz';
      store.setError(errorMessage);
      console.error('Quiz generation error:', err);
    }
  }


  // 将生成任务加入到队列中，在完成后自动移出
  private async enqueueGeneration(noteId: string, onTextUpdate?: (text: string) => void): Promise<void> {
    const store = useQuizStore.getState();
    if (store.generationQueue.has(noteId) || store.activeGenerations.has(noteId)) {
      return;
    }
    store.addToGenerationQueue(noteId);
    while (store.activeGenerations.size >= this.MAX_CONCURRENT_GENERATIONS) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    store.removeFromGenerationQueue(noteId);
    store.addActiveGeneration(noteId);
    try {
      await this.generateQuestion(noteId, onTextUpdate);
    } finally {
      store.removeActiveGeneration(noteId);
    }
  }



  // 加载题目到quizmap,允许使用缓存（仅内存缓存）
  public async loadQuestions(noteIds: string[], useCache: boolean = true, onTextUpdate?: (text: string) => void): Promise<void> {
    const store = useQuizStore.getState();
    const selectedQuizMode = store.selectedQuizMode;
    useQuizStore.getState().setError('');
    try {
      if (!noteIds || noteIds.length === 0) {
        return;
      }
      const cachedNoteIds = new Set<string>();
      if (useCache) {
        for (const noteId of noteIds) {
          if (!noteId) continue;
          const cacheKey = await this.getCacheKey(noteId, selectedQuizMode);
          if (store.quizMap[cacheKey]) {
            cachedNoteIds.add(noteId);
          }
        }
      }
      const notesToGenerate = noteIds.filter(noteId => noteId && !cachedNoteIds.has(noteId));
      if (notesToGenerate.length > 0) {
        await Promise.all(notesToGenerate.map(noteId =>
          this.enqueueGeneration(noteId, onTextUpdate)
        ));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      store.setError(errorMessage);
      console.error('Load questions error:', err);
    }
  }



  public resetSession(): void {
    const store = useQuizStore.getState();
    store.clearQuizzes();
  }

  // 复制题目文本（纯文本格式，不包括答案）
  public async copyQuizText(noteId: string, quizModeId?: string): Promise<string> {
    const store = useQuizStore.getState();
    const cacheKey = await this.getCacheKey(noteId, quizModeId || store.selectedQuizMode);
    const quizText = store.quizMap[cacheKey];
    if (!quizText) return '';
    try {
      const quizzes = parseQuizText(quizText);
      if (quizzes && quizzes.length > 0) {
        const quiz = quizzes[0];
        const lines: string[] = [];
        lines.push(quiz.questionText);
        lines.push('');
        if (quiz.options && quiz.options.length > 0) {
          quiz.options.forEach((option, index) => {
            const label = String.fromCharCode(65 + index);
            lines.push(`${label}. ${option.text}`);
          });
        }
        return lines.join('\n');
      }
    } catch (error) {
      console.error('Failed to parse quiz text for copy:', error);
    }
    return '';
  }



  // 读取笔记的上下文信息
  private getNoteContext(noteId: string): string {
    const note = indicesService.getNoteById(noteId);
    if (!note || (!note.markdown_text && !note.title)) return '';
    const deck = note.deck_id ? indicesService.getDeckById(note.deck_id) : undefined;
    let context = '';
    if (deck) {
      let deckInfo = `所属卡片组: "${deck.name}"`;
      if (deck.description) {
        deckInfo += `\n卡片组描述: "${deck.description}"`;
      }
      context += deckInfo;
    }
    if (note.title) {
      if (context) context += '\n';
      context += `标题: "${note.title}"`;
    }
    if (note.markdown_text) {
      if (context) context += '\n';
      context += `正文: "${note.markdown_text}"`;
    }
    return context;
  }



}


export const quizService = new QuizService();
export default quizService;