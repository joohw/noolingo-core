// @/types/quiz_model.ts



import { BaseModel } from '../types/base_model';



export interface Option {
  text: string;
  correct: boolean;
}


export type QuizType = 'multipleChoice' | 'trueFalse' | 'choice' | 'fillBlank'
export type QuizModeId = 'comprehensive' | 'memory' | 'application' | 'thinking';


export interface QuizModel extends BaseModel {
  quizType: QuizType;
  questionText: string;
  correctAnswer?: string;
  explanation?: string;
  options?: Option[];
  quizModeId?: string; // 生成该quiz的测验模式ID
}



export const createDefaultQuiz = (quizType: QuizType): QuizModel => ({
  id: '',
  quizType,
  questionText: '',
});




