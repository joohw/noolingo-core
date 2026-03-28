// @/core/prompts/note/import.ts


import { Note } from '../note';
import { markdownToNote } from '../convert/import';
export type TemplateType = 'flashcard' | 'qa' | 'summary';



const SUMMARY_PROMPT = `
你是一名专业的笔记整理助手，负责将用户提供的内容整理成结构化信息的笔记。
## 原始内容
[这里放置用户提供的原始内容]
## 整理要求
1. **笔记拆分**：根据内容的主题和逻辑关系，将原始内容拆分成多篇独立的笔记
2. **标题格式**：每篇笔记以标题开头，标题应简洁明了地概括笔记核心内容，标题和内容之间用一个空行分隔
3. **内容规范**：
   - 使用纯文本格式，不使用任何格式标记
   - 将内容整理成结构化的信息，根据内容特点灵活组织
   - 可以使用标题、分类、列表等方式组织信息
   - 保持信息的层次清晰和逻辑完整
   - 格式示例：机器学习基础\n\n定义：机器学习是人工智能的一个分支...\n\n主要类型：\n监督学习\n无监督学习\n强化学习\n\n应用领域：\n图像识别\n自然语言处理
4. **格式要求**：笔记之间用三个空行分隔，保持整体排版整洁
## 处理原则
- **结构化**：根据内容特点灵活组织信息结构
- **层次清晰**：使用合理的层次结构组织内容
- **信息完整**：确保重要信息不丢失，保持逻辑完整
请直接输出整理后的笔记内容，无需额外说明。`;


const QA_PROMPT = `
你是一名专业的笔记整理助手，负责将用户提供的内容整理成问答形式的笔记。
## 原始内容
[这里放置用户提供的原始内容]
## 整理要求
1. **笔记拆分**：根据内容的主题和逻辑关系，将原始内容拆分成多篇独立的笔记
2. **标题格式**：每篇笔记的第一行是问题，问题应简洁明了地概括核心概念，问题和答案之间用一个空行分隔
3. **内容规范**：
   - 使用纯文本格式，不使用任何格式标记
   - 将内容转换为问答形式，每篇笔记包含一个问题和一个答案
   - 第一行是问题，后续行是答案内容
   - 问题应简洁明了，答案应准确完整
   - 格式示例：什么是机器学习？\n\n机器学习是人工智能的一个分支，主要研究如何让计算机通过数据自动学习...
4. **格式要求**：笔记之间用三个空行分隔，保持整体排版整洁
## 处理原则
- **问答形式**：将知识点转换为问答对
- **问题清晰**：问题应准确反映核心概念，作为笔记的第一行
- **答案完整**：答案应包含关键信息和必要细节，从第二行开始
请直接输出整理后的笔记内容，无需额外说明。`;


const FLASHCARD_PROMPT = `
你是一名专业的笔记整理助手，负责将用户提供的内容整理成单词卡格式的笔记。
## 原始内容
[这里放置用户提供的原始内容]
## 整理要求
1. **笔记拆分**：根据内容的主题和逻辑关系，将原始内容拆分成多篇独立的笔记
2. **标题格式**：每篇笔记以标题开头，标题应简洁明了地概括笔记核心内容，标题和内容之间用一个空行分隔
3. **内容规范**：
   - 使用纯文本格式，不使用任何格式标记
   - 将内容转换为单词卡格式，每篇笔记包含一个核心概念或单词
   - 第一行是标题（单词或概念名称）
   - 后续行是详细解释、定义、例句或相关说明
   - 格式示例：Machine Learning\n\n机器学习是人工智能的一个分支，通过算法让计算机从数据中学习并做出预测或决策。\n\n应用场景：\n图像识别\n自然语言处理\n推荐系统\n\n\n\nNeural Network\n\n神经网络是模仿人脑神经元结构的计算模型，由多个层次组成...\n\n特点：\n多层结构\n非线性映射
4. **格式要求**：笔记之间用三个空行分隔，保持整体排版整洁
## 处理原则
- **单词卡格式**：每篇笔记聚焦一个核心概念或单词
- **标题简洁**：标题应准确反映核心概念
- **内容完整**：包含定义、解释、例句或应用场景等关键信息
请直接输出整理后的笔记内容，无需额外说明。`;




// 获取 prompt 模板内容
export function getImportPromptTemplate(template: string): string {
    let templateContent = SUMMARY_PROMPT;
    if (template === 'qa') {
        templateContent = QA_PROMPT;
    } else if (template === 'flashcard') {
        templateContent = FLASHCARD_PROMPT;
    }
    if (!templateContent) {
        throw new Error(`Prompt template not found for template: ${template}`);
    }
    return templateContent;
}




// 使用 prompt 文件内容构建提示词
export const getNoteImportPrompt = (originalContent: string, template: string = 'summary'): string => {
    const templateContent = getImportPromptTemplate(template);
    return templateContent.replace('[这里放置用户提供的原始内容]', originalContent)
};



// 规范化空行：将3个或更多连续空行压缩为最多2个空行
const normalizeEmptyLines = (text: string): string => {
    return text.replace(/\n{3,}/g, '\n\n');
};

// 解析Markdown格式的笔记
export const parseNotesImport = (content: string): Note[] => {
    if (!content.trim()) return [];
    const noteTexts = content.trim().split(/\n{3,}/);
    const notes = noteTexts
        .map(block => normalizeEmptyLines(block.trim()))
        .filter(block => block.length > 0)
        .map(block => markdownToNote(block, {
            useFirstLineAsTitle: true,
            includeTags: true,
        }));
    return notes;
};
