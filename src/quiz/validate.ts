import { QuizModel } from './quiz_model';
import { parseQuizText } from './parse';



export const isValidQuiz = (quiz: QuizModel): boolean => {
    if (!quiz.questionText?.trim()) {
        return false;
    }
    if (!quiz.correctAnswer?.trim()) {
        return false;
    }
    // 检查选项和正确答案的匹配
    if (quiz.options && quiz.options.length > 0) {
        const correctAnswers = quiz.correctAnswer.split(',').map(a => a.trim());
        const optionTexts = quiz.options.map(opt => opt.text.trim());
        // 验证所有正确答案都存在于选项中
        const allCorrectAnswersExist = correctAnswers.every(answer =>
            optionTexts.includes(answer)
        );
        if (!allCorrectAnswersExist) {
            return false;
        }
        // 验证实际标记为 correct 的选项数量
        const actualCorrectOptions = quiz.options.filter(opt => opt.correct);
        switch (quiz.quizType) {
            case 'choice':
                // 单选题：应该有且只有1个正确选项
                if (actualCorrectOptions.length !== 1) {
                    return false;
                }
                break;
            case 'multipleChoice':
                // 多选题：应该有至少2个正确选项
                if (actualCorrectOptions.length < 2) {
                    return false;
                }
                break;
            case 'trueFalse':
                // 判断题：应该有且只有1个正确选项，且总共2个选项
                if (actualCorrectOptions.length !== 1 || quiz.options.length !== 2) {
                    return false;
                }
                break;
        }
    }
    // 检查解释
    if (!quiz.explanation?.trim() || quiz.explanation.trim().length < 5) {
        return false;
    }
    return true;
};




export const isValidQuizText = (text: string): boolean => {
    const quizzes = parseQuizText(text);
    if (quizzes.length === 0) {
        return false;
    }
    return quizzes.every(quiz => isValidQuiz(quiz));
};