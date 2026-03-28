import { XMLParser } from 'fast-xml-parser';
import { QuizModel, QuizType, Option } from './quiz_model';



interface XmlQuiz {
    '@_type'?: string;
    question?: string;
    explanation?: string;
    option?: any;
    answer?: string | number;
}


interface XmlOption {
    '@_correct'?: string | boolean;
    '#text'?: string;
}


// 映射quiz类型
const mapQuizType = (type: string | undefined): QuizType => {
    const typeMap: Record<string, QuizType> = {
        'multipleChoice': 'multipleChoice',
        'trueFalse': 'trueFalse',
        'choice': 'choice',
        'fillBlank': 'fillBlank',
    };
    if (!type) {
        return 'multipleChoice';
    }
    const mappedType = typeMap[type];
    if (!mappedType) {
        return 'multipleChoice';
    }
    return mappedType;
};


// 统一的解析函数
export const parseQuizText = (text: string): QuizModel[] => {
    try {
        const xmlParser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            isArray: (name) => {
                return name === 'quiz';
            }
        });
        const cleanedText = text.trim();
        const parsed = xmlParser.parse(cleanedText);
        let quizElements: XmlQuiz[] = [];
        // 处理单个quiz或多个quiz的情况
        if (Array.isArray(parsed.quiz)) {
            quizElements = parsed.quiz;
        } else if (parsed.quiz) {
            quizElements = [parsed.quiz];
        } else {
            return [];
        }
        const quizzes: QuizModel[] = [];
        for (const quizElement of quizElements) {
            const quizType = mapQuizType(quizElement['@_type']);
            const questionText = (quizElement.question?.trim() || '');
            const explanation = (quizElement.explanation?.trim() || '');
            let options: Option[] = [];
            let correctAnswer = '';
            if (Array.isArray(quizElement.option)) {
                options = quizElement.option.map((opt: any, index: number) => {
                    let correct = false;
                    if (opt && typeof opt === 'object') {
                        const correctAttr = (opt as XmlOption)['@_correct'];
                        correct = correctAttr === 'true' || correctAttr === true;
                    }

                    let text = '';
                    if (typeof opt === 'string') {
                        text = opt;
                    } else if (opt && typeof opt === 'object') {
                        text = (opt as XmlOption)['#text'] || '';
                    }

                    // 构建正确答案时直接使用文本
                    if (correct) {
                        // 如果是第一个正确答案，直接赋值；如果是多选题，用逗号分隔
                        correctAnswer = correctAnswer
                            ? `${correctAnswer}, ${text}`
                            : text;
                    }

                    return { text, correct };
                });
            } else if (quizElement.option) {
                // 判断题处理
                const opt = quizElement.option;
                let correct = false;
                let text = '';
                if (typeof opt === 'string') {
                    text = opt;
                } else if (opt && typeof opt === 'object') {
                    const correctAttr = (opt as XmlOption)['@_correct'];
                    correct = correctAttr === 'true' || correctAttr === true;
                    text = (opt as XmlOption)['#text'] || '';
                }
                options = [{ text, correct }];
                correctAnswer = text;
            }
            if (quizType === 'fillBlank') {
                // 填空题：从 answer 标签获取正确答案，不使用选项
                if (quizElement.answer) {
                    correctAnswer = quizElement.answer.toString();
                } else if (options.length > 0) {
                    // 兼容旧格式：如果没有 answer 标签，从第一个选项获取
                    correctAnswer = options[0].text;
                }
                options = []; // 填空题不使用选项
            } else {
                if (!correctAnswer && quizElement.answer) {
                    correctAnswer = quizElement.answer.toString().toUpperCase();
                }
                if (quizType !== 'trueFalse') {
                    options = options.sort(() => Math.random() - 0.5);
                }
            }
            quizzes.push({
                id: '', // 可以为每个quiz生成唯一ID，这里暂时留空
                quizType,
                questionText,
                correctAnswer,
                explanation,
                options: options.length > 0 ? options : undefined,
            });
        }
        return quizzes;
    } catch (err) {
        return [];
    }
};
