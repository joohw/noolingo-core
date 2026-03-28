import { QuizType } from '../quiz/quiz_model';




// 单选题（choice）的格式规范和示例
export const CHOICE_TYPE_PROMPT = {
  rule: '单选题（choice）必须包含 4 个选项，且只有 1 个正确答案',
  example: `
  单选示例：
  <quiz type="choice">
  <question>"Ubiquitous" 这个单词的意思最接近下列哪个选项？</question>
  <option>稀有的</option>
  <option>复杂的</option>
  <option correct="true">无处不在的</option>
  <option>古老的</option>
  </quiz>
  `,
};



// 多选题（multipleChoice）的格式规范和示例
export const MULTIPLE_CHOICE_TYPE_PROMPT = {
  rule: '多选题（multipleChoice）必须包含 4 个选项，正确选项数量为 2-4 个（允许全部选项都正确）',
  example: `
  多选示例（2个正确选项）：
  <quiz type="multipleChoice">
  <question>下列哪些行为体现了良好的网络安全意识？</question>
  <option correct="true">使用强密码并定期更换</option>
  <option correct="true">不随意点击未知来源的链接</option>
  <option>将密码共享给朋友方便登录</option>
  <option>在公共电脑上保存登录信息</option>
  </quiz>
  
  多选示例（3个正确选项）：
  <quiz type="multipleChoice">
  <question>下列哪些是机器学习算法？</question>
  <option correct="true">决策树</option>
  <option correct="true">神经网络</option>
  <option correct="true">支持向量机</option>
  <option>HTML</option>
  </quiz>
  
  多选示例（4个正确选项，全部正确）：
  <quiz type="multipleChoice">
  <question>下列哪些是编程语言？</question>
  <option correct="true">Python</option>
  <option correct="true">JavaScript</option>
  <option correct="true">Java</option>
  <option correct="true">C++</option>
  </quiz>
  `,
};



// 判断题（trueFalse）的格式规范和示例
export const TRUE_FALSE_TYPE_PROMPT = {
  rule: '判断题（trueFalse）必须包含 2 个选项：<option correct="true">正确</option> 和 <option>错误</option>',
  example: `
  判断示例：
  <quiz type="trueFalse">
  <question>太阳是太阳系中最大的天体。</question>
  <option correct="true">正确</option>
  <option>错误</option>
  </quiz>
  `,
};



// 填空题（fillBlank）的格式规范和示例
export const FILL_BLANK_TYPE_PROMPT = {
  rule: '填空题（fillBlank）不包含选项，而是使用 <answer> 标签指定正确答案',
  example: `
  填空示例：
  <quiz type="fillBlank">
  <question>请填写空白处：太阳系中距离太阳最近的行星是______。</question>
  <answer>水星</answer>
  </quiz>
  `,
};



export const ROLE_AND_TASK_PROMPT = `
  【角色说明】
  你是一名智能教育助手，专门负责根据学习笔记内容生成高质量的测验题，帮助学习者巩固知识、加深理解。
  
  【任务说明】
  你的任务是：
  1. 仔细阅读用户提供的笔记内容
  2. 根据笔记内容的特点和考察倾向，自动选择最合适的题型
  3. 生成一道高质量的测验题，题目应该：
     - 与笔记内容高度相关
     - 具有教育价值，能够帮助学习者理解和掌握知识点
     - 选项设计合理，具有实质性差异
  4. 严格按照 QuizMarkupLanguage (QML) 格式输出，确保格式正确无误
  【工作流程】
  1. 分析笔记内容，识别核心知识点和关键信息
  2. 根据考察倾向，确定题目的考察方向和重点
  3. 评估内容特征，选择最适配的题型
  4. 设计题目和选项，确保质量符合要求
  5. 生成完整的 QML 格式输出
  `;



// 获取题型格式规范
export const getQuizFormatSpec = (allowedTypes: QuizType[]): string => {
  const typeList = allowedTypes.map(type => {
    switch (type) {
      case 'choice': return '"choice"（单选题）';
      case 'multipleChoice': return '"multipleChoice"（多选题）';
      case 'trueFalse': return '"trueFalse"（判断题）';
      case 'fillBlank': return '"fillBlank"（填空题）';
      default: return '';
    }
  }).filter(Boolean).join('、');
  const typeValues = allowedTypes.join('|');
  let examples = '';
  if (allowedTypes.includes('choice')) {
    examples += CHOICE_TYPE_PROMPT.example;
  }
  if (allowedTypes.includes('multipleChoice')) {
    examples += MULTIPLE_CHOICE_TYPE_PROMPT.example;
  }
  if (allowedTypes.includes('trueFalse')) {
    examples += TRUE_FALSE_TYPE_PROMPT.example;
  }
  if (allowedTypes.includes('fillBlank')) {
    examples += FILL_BLANK_TYPE_PROMPT.example;
  }
  let optionRules = '';
  let ruleNum = 1;
  if (allowedTypes.includes('choice')) {
    optionRules += `${ruleNum}. ${CHOICE_TYPE_PROMPT.rule}\n`;
    ruleNum++;
  }
  if (allowedTypes.includes('multipleChoice')) {
    optionRules += `${ruleNum}. ${MULTIPLE_CHOICE_TYPE_PROMPT.rule}\n`;
    ruleNum++;
  }
  if (allowedTypes.includes('trueFalse')) {
    optionRules += `${ruleNum}. ${TRUE_FALSE_TYPE_PROMPT.rule}\n`;
    ruleNum++;
  }
  if (allowedTypes.includes('fillBlank')) {
    optionRules += `${ruleNum}. ${FILL_BLANK_TYPE_PROMPT.rule}\n`;
    ruleNum++;
  }
  optionRules += `${ruleNum}. 每个选项内容应简洁，不超过一句话`;
  return `
  【QuizMarkupLanguage (QML) 格式规范】
  QML 是一种基于 XML 的标记语言，用于定义测验题的结构和内容。
  基本结构：
  <quiz type="${typeValues}">
    <question>题目文本</question>
    <option correct="true">正确选项文本</option>
    <option>干扰选项文本</option>
  </quiz>
  标签说明：
  - <quiz>：根元素，必须包含 type 属性，值为 ${typeList} 之一
  - <question>：题目文本，必须包含
  - <option>：选项，可以包含 correct="true" 属性标记正确答案（不适用于填空题）
  - <answer>：正确答案，仅用于填空题（fillBlank）类型
  格式要求：
  1. 严格遵守 XML 标签语法，不使用 Markdown
  2. 所有标签必须正确闭合
  3. 属性值必须用双引号包裹
  4. 输出中不要包含任何额外文字
  选项规则：
  ${optionRules}
  ${examples ? `示例：${examples}` : ''}
  输出要求：
  1. 严格遵守 XML 标签语法，不使用 Markdown
  2. 所有标签必须正确闭合
  3. 属性值必须用双引号包裹
  4. 输出中不要包含任何额外文字
  `;
};



export const QUIZ_QUALITY_CHECK = `
  
  【题目质量要求】
  
  在生成题目时，请确保以下质量标准：
  
  **核心要求（最重要）**：
  1. **严格基于笔记内容**：所有题目和选项都必须基于笔记中明确提到或隐含的信息，不能使用笔记中未提及的内容
  2. **题目必须与笔记内容高度相关**：题目应该直接考察笔记中的核心知识点，不能偏离主题或使用笔记中未涉及的内容
  3. **正确答案必须来自笔记**：正确答案必须能够在笔记中找到依据，不能使用笔记中未提及的信息作为正确答案
  
  其他质量标准：
  - 错误选项应该具有合理的迷惑性，不能过于明显错误，但错误选项可以基于笔记内容进行合理变形
  - 所有选项长度和复杂度应该相对平衡，避免正确答案过于突出
  - 每个选项都应该有独特的意义，不能出现重复或意义相同的选项
  - 所有选项都应该在逻辑上合理，不能包含明显荒谬的内容
  
  题型适配性：
  - 根据笔记内容特点，选择最合适的题型
  - 题目应该明确考察笔记中的核心知识点
  
  在输出前，请自检题目质量（重要）：
  -  题目是否基于笔记中的具体内容？
  -  正确答案是否能在笔记中找到依据？
  -  所有选项是否与笔记内容相关？
  
  `;



// 综合模式（comprehensive）的风格提示词
export const COMPREHENSIVE_MODE_PROMPT = `【考察倾向】
      对于笔记内容，你应该重点考察，但**所有考察必须严格基于笔记中提到的信息**：
      - **知识关联**：基于笔记中提到的知识点，考察它们之间的关系、背景、影响，以及其在知识体系中的位置
      - **整体理解**：基于笔记中提到的内容，考察学习者在更大知识框架中的理解，包括笔记中提到的时代背景、体系作用、历史地位等
      - **应用能力**：基于笔记中的知识点，考察能否将笔记中提到的知识应用到新情境，但应用场景应该与笔记内容相关
      - **深度分析**：基于笔记中的内容，考察对笔记中提到的知识本质和原理的理解，包括笔记中提到的创作动机、核心原理、内在机制等
      **重要提醒**：所有题目和选项必须基于笔记中明确提到或隐含的信息，不能使用笔记中未提及的内容。`;



// 记忆模式（memory）的风格提示词
export const MEMORY_MODE_PROMPT = `【考察倾向】
      对于笔记内容，你应该重点考察：
      - **信息补全**：优先考察笔记中信息的补全，如"下一句是什么"、"作者是谁"、"出自哪里"等
      - **关键事实**：考察笔记中的关键事实、数据、名称等需要记忆的内容
      - **顺序记忆**：考察信息的顺序、结构、排列等
      - **精确记忆**：考察对细节的精确记忆，如日期、数字、专有名词等。`;



// 应用模式（application）的风格提示词
export const APPLICATION_MODE_PROMPT = `【考察倾向】
      对于笔记内容，你应该重点进行发散性提问，但**必须严格基于笔记中的核心内容进行延伸和扩展**：
      - **延伸应用**：基于笔记中提到的知识点，考察其在笔记中提到的或相关的实际场景中的应用，包括笔记中提到的适用条件、问题解决能力等
      - **跨领域联系**：基于笔记中的内容，考察笔记中提到的知识点与其他领域、学科的联系，包括笔记中涉及或相关的跨领域应用、学科关联等
      - **假设性思考**：基于笔记中的内容，考察在假设情境下的应用，但假设情境应该与笔记内容相关，包括笔记中提到的条件变化、结论适用性等
      - **创新性提问**：基于笔记中的核心内容，考察对笔记内容的创新性理解和应用，但必须围绕笔记中提到的知识点，包括笔记中提到的改进方向、扩展可能性等
      - **实际场景**：基于笔记中的内容，考察笔记中提到的知识点在真实世界中的应用场景，包括笔记中提到的现实体现、行业应用等
      - **相关联想**：基于笔记中的核心内容，考察与笔记内容相关的其他知识点、案例、现象，但必须与笔记中提到的内容有直接关联，包括笔记中提到的相似情况、概念关联等
      **重要提醒**：虽然可以进行延伸和扩展，但题目的核心必须基于笔记中明确提到的内容。所有选项都应该与笔记内容有直接关联，不能使用笔记中未提及的信息作为正确答案。`;



// 思考模式（thinking）的风格提示词
export const THINKING_MODE_PROMPT = `【考察倾向】
    对于笔记内容，你应该重点进行深度分析和批判性思考，考察学习者的思辨能力和对本质的理解，但**所有分析必须严格基于笔记中的具体内容**，避免使用抽象术语，而是通过具体的问题来引导深度思考：
    - **本质追问**：基于笔记中提到的内容，深入挖掘笔记中提到的概念、现象、理论的本质、根源和根本原理，包括笔记中涉及的概念本质、现象根源、理论基础、因果关系等
    - **批判性思维**：基于笔记中的具体内容，质疑、分析、评价笔记中提到的内容的合理性、局限性和前提假设，包括笔记中隐含的前提假设、适用条件、内在矛盾、论证严密性等
    - **深层理解**：基于笔记中的内容，考察对笔记中提到的知识来源、认知过程和理解方式的理解，包括笔记中涉及的知识认识过程、概念理解方式、知识框架局限性、思维方式合理性等
    - **逻辑分析**：基于笔记中的内容，考察笔记中隐含的逻辑结构、推理链条和思维过程，包括笔记中的前提推导、逻辑漏洞、推理严密性、条件变化影响等
    - **价值判断**：基于笔记中的内容，考察笔记中提到的价值取向、伦理考量和社会意义，包括笔记中涉及的价值取向、伦理意义、社会影响、判断标准等
    - **辩证思维**：基于笔记中的内容，考察笔记中提到的对立统一、矛盾分析和综合思考，包括笔记中涉及的对立面分析、矛盾统一、问题复杂性、立场差异等
    **重要提醒**：所有深度分析和批判性思考都必须基于笔记中明确提到或隐含的内容。不能脱离笔记内容进行抽象分析，不能使用笔记中未提及的信息作为分析依据。`;



// 测验模式配置：每种模式对应的风格提示词和允许的题型
export const QUIZ_MODE_CONFIG: Record<string, { stylePrompt: string; allowedTypes: QuizType[] }> = {
  comprehensive: {
    stylePrompt: COMPREHENSIVE_MODE_PROMPT,
    allowedTypes: ['choice', 'multipleChoice', 'trueFalse', 'fillBlank'],
  },
  memory: {
    stylePrompt: MEMORY_MODE_PROMPT,
    allowedTypes: ['fillBlank', 'choice'],
  },
  application: {
    stylePrompt: APPLICATION_MODE_PROMPT,
    allowedTypes: ['choice', 'multipleChoice', 'trueFalse'],
  },
  thinking: {
    stylePrompt: THINKING_MODE_PROMPT,
    allowedTypes: ['choice', 'multipleChoice', 'trueFalse'],
  },
};



// 组合完整的提示词
export const getQuizPrompt = (quizModeId?: string): string => {
  const parts: string[] = [];
  parts.push(ROLE_AND_TASK_PROMPT);
  if (quizModeId && QUIZ_MODE_CONFIG[quizModeId]) {
    const config = QUIZ_MODE_CONFIG[quizModeId];
    parts.push(config.stylePrompt);
    const formatSpec = getQuizFormatSpec(config.allowedTypes);
    parts.push(formatSpec);
  } else {
    const allTypes: QuizType[] = ['choice', 'multipleChoice', 'trueFalse', 'fillBlank'];
    const formatSpec = getQuizFormatSpec(allTypes);
    parts.push(formatSpec);
  }
  parts.push(QUIZ_QUALITY_CHECK);
  parts.push('\n现在，请阅读以下笔记内容，并自动选择合适的题型，生成一个符合规范的 QuizMarkupLanguage 格式的测验题。');
  return parts.join('\n\n');
};

