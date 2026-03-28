// @/core/locales/locales.ts
// 翻译文件入口，合并所有模块的翻译


import { Language } from './languages';


// 定义所有翻译模块列表
// 添加新模块时，只需在此数组中添加模块名称，并在下面的导入映射中添加对应的导入
const TRANSLATION_MODULES = [
    'common',
    'ai',
    'auth',
    'streak',
    'study',
    'deck',
    'editor',
    'note',
    'quiz',
    'settings',
    'toast',
    'welcome',
    'error',
    'hotkey',
    'help',
    'import',
    'premium',
    'recall',
    'user',
    'storage',
    'sync',
    'notifications',
    'payment',
    'chat',         
    'task',
] as const;


// 类型定义
type ModuleName = typeof TRANSLATION_MODULES[number];


// 中文翻译模块导入映射
// 添加新模块时，在此添加对应的导入语句
import zhCommon from './zh/common.json';
import zhAi from './zh/ai.json';
import zhAuth from './zh/auth.json';
import zhStreak from './zh/streak.json';
import zhStudy from './zh/study.json';
import zhDeck from './zh/deck.json';
import zhEditor from './zh/editor.json';
import zhNote from './zh/note.json';
import zhQuiz from './zh/quiz.json';
import zhSettings from './zh/settings.json';
import zhToast from './zh/toast.json';
import zhWelcome from './zh/welcome.json';
import zhError from './zh/error.json';
import zhHotkey from './zh/hotkey.json';
import zhHelp from './zh/help.json';
import zhImport from './zh/import.json';
import zhPremium from './zh/premium.json';
import zhRecall from './zh/recall.json';
import zhUser from './zh/user.json';
import zhStorage from './zh/storage.json';
import zhSync from './zh/sync.json';
import zhNotifications from './zh/notifications.json';
import zhPayment from './zh/payment.json';
import zhChat from './zh/chat.json';
import zhTask from './zh/task.json';

        
// 英文翻译模块导入映射
import enCommon from './en/common.json';
import enAi from './en/ai.json';
import enAuth from './en/auth.json';
import enStreak from './en/streak.json';
import enStudy from './en/study.json';
import enDeck from './en/deck.json';
import enEditor from './en/editor.json';
import enNote from './en/note.json';
import enQuiz from './en/quiz.json';
import enSettings from './en/settings.json';
import enToast from './en/toast.json';
import enWelcome from './en/welcome.json';
import enError from './en/error.json';
import enHotkey from './en/hotkey.json';
import enHelp from './en/help.json';
import enImport from './en/import.json';
import enPremium from './en/premium.json';
import enRecall from './en/recall.json';
import enUser from './en/user.json';
import enStorage from './en/storage.json';
import enSync from './en/sync.json';
import enNotifications from './en/notifications.json';
import enPayment from './en/payment.json';
import enChat from './en/chat.json';
import enTask from './en/task.json';


// 美式英语翻译模块导入映射
import usCommon from './us/common.json';
import usAi from './us/ai.json';
import usAuth from './us/auth.json';
import usStreak from './us/streak.json';
import usStudy from './us/study.json';
import usDeck from './us/deck.json';
import usEditor from './us/editor.json';
import usNote from './us/note.json';
import usQuiz from './us/quiz.json';
import usSettings from './us/settings.json';
import usToast from './us/toast.json';
import usWelcome from './us/welcome.json';
import usError from './us/error.json';
import usHotkey from './us/hotkey.json';
import usHelp from './us/help.json';
import usImport from './us/import.json';
import usPremium from './us/premium.json';
import usRecall from './us/recall.json';
import usUser from './us/user.json';
import usStorage from './us/storage.json';
import usSync from './us/sync.json';
import usNotifications from './us/notifications.json';
import usPayment from './us/payment.json';
import usChat from './us/chat.json';
import usTask from './us/task.json';


// 日语翻译模块导入映射
import jaCommon from './ja/common.json';
import jaAi from './ja/ai.json';
import jaAuth from './ja/auth.json';
import jaStreak from './ja/streak.json';
import jaStudy from './ja/study.json';
import jaDeck from './ja/deck.json';
import jaEditor from './ja/editor.json';
import jaNote from './ja/note.json';
import jaQuiz from './ja/quiz.json';
import jaSettings from './ja/settings.json';
import jaToast from './ja/toast.json';
import jaWelcome from './ja/welcome.json';
import jaError from './ja/error.json';
import jaHotkey from './ja/hotkey.json';
import jaHelp from './ja/help.json';
import jaImport from './ja/import.json';
import jaPremium from './ja/premium.json';
import jaRecall from './ja/recall.json';
import jaUser from './ja/user.json';
import jaStorage from './ja/storage.json';
import jaSync from './ja/sync.json';
import jaNotifications from './ja/notifications.json';
import jaPayment from './ja/payment.json';
import jaChat from './ja/chat.json';
import jaTask from './ja/task.json';
                    

// 繁体中文翻译模块导入映射
import twCommon from './tw/common.json';
import twAi from './tw/ai.json';
import twAuth from './tw/auth.json';
import twStreak from './tw/streak.json';
import twStudy from './tw/study.json';
import twDeck from './tw/deck.json';
import twEditor from './tw/editor.json';
import twNote from './tw/note.json';
import twQuiz from './tw/quiz.json';
import twSettings from './tw/settings.json';
import twToast from './tw/toast.json';
import twWelcome from './tw/welcome.json';
import twError from './tw/error.json';
import twHotkey from './tw/hotkey.json';
import twHelp from './tw/help.json';
import twImport from './tw/import.json';
import twPremium from './tw/premium.json';
import twRecall from './tw/recall.json';
import twUser from './tw/user.json';
import twStorage from './tw/storage.json';
import twSync from './tw/sync.json';
import twNotifications from './tw/notifications.json';
import twPayment from './tw/payment.json';
import twChat from './tw/chat.json';
import twTask from './tw/task.json';


// 西班牙语翻译模块导入映射
import esCommon from './es/common.json';
import esAi from './es/ai.json';
import esAuth from './es/auth.json';
import esStreak from './es/streak.json';
import esStudy from './es/study.json';
import esDeck from './es/deck.json';
import esEditor from './es/editor.json';
import esNote from './es/note.json';
import esQuiz from './es/quiz.json';
import esSettings from './es/settings.json';
import esToast from './es/toast.json';
import esWelcome from './es/welcome.json';
import esError from './es/error.json';
import esHotkey from './es/hotkey.json';
import esHelp from './es/help.json';
import esImport from './es/import.json';
import esPremium from './es/premium.json';
import esRecall from './es/recall.json';
import esUser from './es/user.json';
import esStorage from './es/storage.json';
import esSync from './es/sync.json';
import esNotifications from './es/notifications.json';
import esPayment from './es/payment.json';
import esChat from './es/chat.json';
import esTask from './es/task.json';


// 韩语翻译模块导入映射
import koCommon from './ko/common.json';
import koAi from './ko/ai.json';
import koAuth from './ko/auth.json';
import koStreak from './ko/streak.json';
import koStudy from './ko/study.json';
import koDeck from './ko/deck.json';
import koEditor from './ko/editor.json';
import koNote from './ko/note.json';
import koQuiz from './ko/quiz.json';
import koSettings from './ko/settings.json';
import koToast from './ko/toast.json';
import koWelcome from './ko/welcome.json';
import koError from './ko/error.json';
import koHotkey from './ko/hotkey.json';
import koHelp from './ko/help.json';
import koImport from './ko/import.json';
import koPremium from './ko/premium.json';
import koRecall from './ko/recall.json';
import koUser from './ko/user.json';
import koStorage from './ko/storage.json';
import koSync from './ko/sync.json';
import koNotifications from './ko/notifications.json';
import koPayment from './ko/payment.json';
import koChat from './ko/chat.json';
import koTask from './ko/task.json';


// 法语翻译模块导入映射
import frCommon from './fr/common.json';
import frAi from './fr/ai.json';
import frAuth from './fr/auth.json';
import frStreak from './fr/streak.json';
import frStudy from './fr/study.json';
import frDeck from './fr/deck.json';
import frEditor from './fr/editor.json';
import frNote from './fr/note.json';
import frQuiz from './fr/quiz.json';
import frSettings from './fr/settings.json';
import frToast from './fr/toast.json';
import frWelcome from './fr/welcome.json';
import frError from './fr/error.json';
import frHotkey from './fr/hotkey.json';
import frHelp from './fr/help.json';
import frImport from './fr/import.json';
import frPremium from './fr/premium.json';
import frRecall from './fr/recall.json';
import frUser from './fr/user.json';
import frStorage from './fr/storage.json';
import frSync from './fr/sync.json';
import frNotifications from './fr/notifications.json';
import frPayment from './fr/payment.json';
import frChat from './fr/chat.json';
import frTask from './fr/task.json';


// 德语翻译模块导入映射
import deCommon from './de/common.json';
import deAi from './de/ai.json';
import deAuth from './de/auth.json';
import deStreak from './de/streak.json';
import deStudy from './de/study.json';
import deDeck from './de/deck.json';
import deEditor from './de/editor.json';
import deNote from './de/note.json';
import deQuiz from './de/quiz.json';
import deSettings from './de/settings.json';
import deToast from './de/toast.json';
import deWelcome from './de/welcome.json';
import deError from './de/error.json';
import deHotkey from './de/hotkey.json';
import deHelp from './de/help.json';
import deImport from './de/import.json';
import dePremium from './de/premium.json';
import deRecall from './de/recall.json';
import deUser from './de/user.json';
import deStorage from './de/storage.json';
import deSync from './de/sync.json';
import deNotifications from './de/notifications.json';
import dePayment from './de/payment.json';
import deChat from './de/chat.json';
import deTask from './de/task.json';


// 俄语翻译模块导入映射
import ruCommon from './ru/common.json';
import ruAi from './ru/ai.json';
import ruAuth from './ru/auth.json';
import ruStreak from './ru/streak.json';
import ruStudy from './ru/study.json';
import ruDeck from './ru/deck.json';
import ruEditor from './ru/editor.json';
import ruNote from './ru/note.json';
import ruQuiz from './ru/quiz.json';
import ruSettings from './ru/settings.json';
import ruToast from './ru/toast.json';
import ruWelcome from './ru/welcome.json';
import ruError from './ru/error.json';
import ruHotkey from './ru/hotkey.json';
import ruHelp from './ru/help.json';
import ruImport from './ru/import.json';
import ruPremium from './ru/premium.json';
import ruRecall from './ru/recall.json';
import ruUser from './ru/user.json';
import ruStorage from './ru/storage.json';
import ruSync from './ru/sync.json';
import ruNotifications from './ru/notifications.json';
import ruPayment from './ru/payment.json';
import ruChat from './ru/chat.json';
import ruTask from './ru/task.json';


// 欧洲葡萄牙语翻译模块导入映射
import ptCommon from './pt/common.json';
import ptAi from './pt/ai.json';
import ptAuth from './pt/auth.json';
import ptStreak from './pt/streak.json';
import ptStudy from './pt/study.json';
import ptDeck from './pt/deck.json';
import ptEditor from './pt/editor.json';
import ptNote from './pt/note.json';
import ptQuiz from './pt/quiz.json';
import ptSettings from './pt/settings.json';
import ptToast from './pt/toast.json';
import ptWelcome from './pt/welcome.json';
import ptError from './pt/error.json';
import ptHotkey from './pt/hotkey.json';
import ptHelp from './pt/help.json';
import ptImport from './pt/import.json';
import ptPremium from './pt/premium.json';
import ptRecall from './pt/recall.json';
import ptUser from './pt/user.json';
import ptStorage from './pt/storage.json';
import ptSync from './pt/sync.json';
import ptNotifications from './pt/notifications.json';
import ptPayment from './pt/payment.json';
import ptChat from './pt/chat.json';
import ptTask from './pt/task.json';


// 巴西葡萄牙语翻译模块导入映射
import brCommon from './br/common.json';
import brAi from './br/ai.json';
import brAuth from './br/auth.json';
import brStreak from './br/streak.json';
import brStudy from './br/study.json';
import brDeck from './br/deck.json';
import brEditor from './br/editor.json';
import brNote from './br/note.json';
import brQuiz from './br/quiz.json';
import brSettings from './br/settings.json';
import brToast from './br/toast.json';
import brWelcome from './br/welcome.json';
import brError from './br/error.json';
import brHotkey from './br/hotkey.json';
import brHelp from './br/help.json';
import brImport from './br/import.json';
import brPremium from './br/premium.json';
import brRecall from './br/recall.json';
import brUser from './br/user.json';
import brStorage from './br/storage.json';
import brSync from './br/sync.json';
import brNotifications from './br/notifications.json';
import brPayment from './br/payment.json';
import brChat from './br/chat.json';
import brTask from './br/task.json';


// 中文翻译模块映射对象
// 添加新模块时，在此添加对应的映射
const zhModuleMap: Record<ModuleName, any> = {
    common: zhCommon,
    ai: zhAi,
    auth: zhAuth,
    streak: zhStreak,
    study: zhStudy,
    deck: zhDeck,
    editor: zhEditor,
    note: zhNote,
    quiz: zhQuiz,
    settings: zhSettings,
    toast: zhToast,
    welcome: zhWelcome,
    error: zhError,
    hotkey: zhHotkey,
    help: zhHelp,
    import: zhImport,
    premium: zhPremium,
    recall: zhRecall,
    user: zhUser,
    storage: zhStorage,
    sync: zhSync,
    notifications: zhNotifications,
    payment: zhPayment,
    chat: zhChat,
    task: zhTask,                       
};


// 英文翻译模块映射对象
const enModuleMap: Record<ModuleName, any> = {
    common: enCommon,
    ai: enAi,
    auth: enAuth,
    streak: enStreak,
    study: enStudy,
    deck: enDeck,
    editor: enEditor,
    note: enNote,
    quiz: enQuiz,
    settings: enSettings,
    toast: enToast,
    welcome: enWelcome,
    error: enError,
    hotkey: enHotkey,
    help: enHelp,
    import: enImport,
    premium: enPremium,
    recall: enRecall,
    user: enUser,
    storage: enStorage,
    sync: enSync,
    notifications: enNotifications,
    payment: enPayment,
    chat: enChat,
    task: enTask,
};


// 美式英语翻译模块映射对象
const usModuleMap: Record<ModuleName, any> = {
    common: usCommon,
    ai: usAi,
    auth: usAuth,
    streak: usStreak,
    study: usStudy,
    deck: usDeck,
    editor: usEditor,
    note: usNote,
    quiz: usQuiz,
    settings: usSettings,
    toast: usToast,
    welcome: usWelcome,
    error: usError,
    hotkey: usHotkey,
    help: usHelp,
    import: usImport,
    premium: usPremium,
    recall: usRecall,
    user: usUser,
    storage: usStorage,
    sync: usSync,
    notifications: usNotifications,
    payment: usPayment,
    chat: usChat,
    task: usTask,
};


// 日语翻译模块映射对象
const jaModuleMap: Record<ModuleName, any> = {
    common: jaCommon,
    ai: jaAi,
    auth: jaAuth,
    streak: jaStreak,
    study: jaStudy,
    deck: jaDeck,
    editor: jaEditor,
    note: jaNote,
    quiz: jaQuiz,
    settings: jaSettings,
    toast: jaToast,
    welcome: jaWelcome,
    error: jaError,
    hotkey: jaHotkey,
    help: jaHelp,
    import: jaImport,
    premium: jaPremium,
    recall: jaRecall,
    user: jaUser,
    storage: jaStorage,
    sync: jaSync,
    notifications: jaNotifications,
    payment: jaPayment,
    chat: jaChat,
    task: jaTask,
};


// 繁体中文翻译模块映射对象
const twModuleMap: Record<ModuleName, any> = {
    common: twCommon,
    ai: twAi,
    auth: twAuth,
    streak: twStreak,
    study: twStudy,
    deck: twDeck,
    editor: twEditor,
    note: twNote,
    quiz: twQuiz,
    settings: twSettings,
    toast: twToast,
    welcome: twWelcome,
    error: twError,
    hotkey: twHotkey,
    help: twHelp,
    import: twImport,
    premium: twPremium,
    recall: twRecall,
    user: twUser,
    storage: twStorage,
    sync: twSync,
    notifications: twNotifications,
    payment: twPayment,
    chat: twChat,
    task: twTask,
};


// 西班牙语翻译模块映射对象
const esModuleMap: Record<ModuleName, any> = {
    common: esCommon,
    ai: esAi,
    auth: esAuth,
    streak: esStreak,
    study: esStudy,
    deck: esDeck,
    editor: esEditor,
    note: esNote,
    quiz: esQuiz,
    settings: esSettings,
    toast: esToast,
    welcome: esWelcome,
    error: esError,
    hotkey: esHotkey,
    help: esHelp,
    import: esImport,
    premium: esPremium,
    recall: esRecall,
    user: esUser,
    storage: esStorage,
    sync: esSync,
    notifications: esNotifications,
    payment: esPayment,
    chat: esChat,
    task: esTask,
};


// 韩语翻译模块映射对象
const koModuleMap: Record<ModuleName, any> = {
    common: koCommon,
    ai: koAi,
    auth: koAuth,
    streak: koStreak,
    study: koStudy,
    deck: koDeck,
    editor: koEditor,
    note: koNote,
    quiz: koQuiz,
    settings: koSettings,
    toast: koToast,
    welcome: koWelcome,
    error: koError,
    hotkey: koHotkey,
    help: koHelp,
    import: koImport,
    premium: koPremium,
    recall: koRecall,
    user: koUser,
    storage: koStorage,
    sync: koSync,
    notifications: koNotifications,
    payment: koPayment,
    chat: koChat,
    task: koTask,
};


// 法语翻译模块映射对象
const frModuleMap: Record<ModuleName, any> = {
    common: frCommon,
    ai: frAi,
    auth: frAuth,
    streak: frStreak,
    study: frStudy,
    deck: frDeck,
    editor: frEditor,
    note: frNote,
    quiz: frQuiz,
    settings: frSettings,
    toast: frToast,
    welcome: frWelcome,
    error: frError,
    hotkey: frHotkey,
    help: frHelp,
    import: frImport,
    premium: frPremium,
    recall: frRecall,
    user: frUser,
    storage: frStorage,
    sync: frSync,
    notifications: frNotifications,
    payment: frPayment,
    chat: frChat,
    task: frTask,
};


// 德语翻译模块映射对象
const deModuleMap: Record<ModuleName, any> = {
    common: deCommon,
    ai: deAi,
    auth: deAuth,
    streak: deStreak,
    study: deStudy,
    deck: deDeck,
    editor: deEditor,
    note: deNote,
    quiz: deQuiz,
    settings: deSettings,
    toast: deToast,
    welcome: deWelcome,
    error: deError,
    hotkey: deHotkey,
    help: deHelp,
    import: deImport,
    premium: dePremium,
    recall: deRecall,
    user: deUser,
    storage: deStorage,
    sync: deSync,
    notifications: deNotifications,
    payment: dePayment,
    chat: deChat,
    task: deTask,
};


// 俄语翻译模块映射对象
const ruModuleMap: Record<ModuleName, any> = {
    common: ruCommon,
    ai: ruAi,
    auth: ruAuth,
    streak: ruStreak,
    study: ruStudy,
    deck: ruDeck,
    editor: ruEditor,
    note: ruNote,
    quiz: ruQuiz,
    settings: ruSettings,
    toast: ruToast,
    welcome: ruWelcome,
    error: ruError,
    hotkey: ruHotkey,
    help: ruHelp,
    import: ruImport,
    premium: ruPremium,
    recall: ruRecall,
    user: ruUser,
    storage: ruStorage,
    sync: ruSync,
    notifications: ruNotifications,
    payment: ruPayment,
    chat: ruChat,
    task: ruTask,
};


// 批量构建翻译对象（自动从映射中提取）
const zhTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = zhModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const enTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = enModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const usTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = usModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const jaTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = jaModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const twTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = twModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const esTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = esModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const koTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = koModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


// 欧洲葡萄牙语翻译模块映射对象
const ptModuleMap: Record<ModuleName, any> = {
    common: ptCommon,
    ai: ptAi,
    auth: ptAuth,
    streak: ptStreak,
    study: ptStudy,
    deck: ptDeck,
    editor: ptEditor,
    note: ptNote,
    quiz: ptQuiz,
    settings: ptSettings,
    toast: ptToast,
    welcome: ptWelcome,
    error: ptError,
    hotkey: ptHotkey,
    help: ptHelp,
    import: ptImport,
    premium: ptPremium,
    recall: ptRecall,
    user: ptUser,
    storage: ptStorage,
    sync: ptSync,
    notifications: ptNotifications,
    payment: ptPayment,
    chat: ptChat,   
    task: ptTask,
};


// 巴西葡萄牙语翻译模块映射对象
const brModuleMap: Record<ModuleName, any> = {
    common: brCommon,
    ai: brAi,
    auth: brAuth,
    streak: brStreak,
    study: brStudy,
    deck: brDeck,
    editor: brEditor,
    note: brNote,
    quiz: brQuiz,
    settings: brSettings,
    toast: brToast,
    welcome: brWelcome,
    error: brError,
    hotkey: brHotkey,
    help: brHelp,
    import: brImport,
    premium: brPremium,
    recall: brRecall,
    user: brUser,
    storage: brStorage,
    sync: brSync,
    notifications: brNotifications,
    payment: brPayment,
    chat: brChat,
    task: brTask,
};


const ptTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = ptModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const brTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = brModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const frTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = frModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const deTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = deModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


const ruTranslations = TRANSLATION_MODULES.reduce((acc, module) => {
    acc[module] = ruModuleMap[module] || {};
    return acc;
}, {} as Record<ModuleName, any>);


// 翻译对象
export const translations: Partial<Record<Language, Record<string, any>>> = {
    [Language.ZH]: zhTranslations,
    [Language.EN]: enTranslations,
    [Language.US]: usTranslations,
    [Language.JA]: jaTranslations,
    [Language.TW]: twTranslations,
    [Language.ES]: esTranslations,
    [Language.KO]: koTranslations,
    [Language.PT]: ptTranslations,
    [Language.BR]: brTranslations,
    [Language.FR]: frTranslations,
    [Language.DE]: deTranslations,
    [Language.RU]: ruTranslations,
};


export default translations;
