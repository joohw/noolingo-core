// @/constants/helpSlides.ts

import { getAdapter } from '../adapter';


function cdnBase(): string {
    return getAdapter().appConfig.ossCdnUrl;
}



// 帮助幻灯片配置类型
export interface HelpSlide {
    title: string;
    description: string;
    image: string;
}

// 获取帮助幻灯片的函数类型
export type GetHelpSlidesFn = (t: (key: string) => string, language: string) => HelpSlide[];


// 获取笔记帮助幻灯片
export const getNoteSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.note.slideTitle1'),
        description: t('help.note.slideDescription1'),
        image: `${cdnBase()}/assets/help/note-1.png`,
    },
    {
        title: t('help.note.slideTitle2'),
        description: t('help.note.slideDescription2'),
        image: `${cdnBase()}/assets/help/note-2.png`,
    },
    {
        title: t('help.note.slideTitle3'),
        description: t('help.note.slideDescription3'),
        image: `${cdnBase()}/assets/help/note-3.png`,
    }
];


// 获取闪卡帮助幻灯片
export const getFlashcardSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.flashcard.slideTitle1'),
        description: t('help.flashcard.slideDescription1'),
        image: `${cdnBase()}/assets/help/study-1.png`,
    },
    {
        title: t('help.flashcard.slideTitle2'),
        description: t('help.flashcard.slideDescription2'),
        image: `${cdnBase()}/assets/help/study-2.png`,
    },
    {
        title: t('help.flashcard.slideTitle3'),
        description: t('help.flashcard.slideDescription3'),
        image: `${cdnBase()}/assets/help/study-3.png`,
    },
    {
        title: t('help.flashcard.slideTitle4'),
        description: t('help.flashcard.slideDescription4'),
        image: `${cdnBase()}/assets/help/study-4.png`,
    }
];


// 获取测验帮助幻灯片
export const getQuizSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.quiz.slideTitle1'),
        description: t('help.quiz.slideDescription1'),
        image: `${cdnBase()}/assets/help/quiz-1.png`,
    },
    {
        title: t('help.quiz.slideTitle2'),
        description: t('help.quiz.slideDescription2'),
        image: `${cdnBase()}/assets/help/quiz-2.png`,
    },
    {
        title: t('help.quiz.slideTitle3'),
        description: t('help.quiz.slideDescription3'),
        image: `${cdnBase()}/assets/help/quiz-3.png`,
    },
    {
        title: t('help.quiz.slideTitle4'),
        description: t('help.quiz.slideDescription4'),
        image: `${cdnBase()}/assets/help/quiz-4.png`,
    }
];


// 获取同步帮助幻灯片
export const getSyncSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.sync.slideTitle1'),
        description: t('help.sync.slideDescription1'),
        image: `${cdnBase()}/assets/help/sync-2.png`,
    },
    {
        title: t('help.sync.slideTitle2'),
        description: t('help.sync.slideDescription2'),
        image: `${cdnBase()}/assets/help/sync-2.png`,
    }
];


// 获取分享帮助幻灯片
export const getShareSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.share.slideTitle1'),
        description: t('help.share.slideDescription1'),
        image: `${cdnBase()}/assets/help/share-1.png`,
    }
];


// 获取云服务帮助幻灯片
export const getCloudSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.cloud.slideTitle1'),
        description: t('help.cloud.slideDescription1'),
        image: `${cdnBase()}/assets/help/cloud-1.png`,
    },
    {
        title: t('help.cloud.slideTitle2'),
        description: t('help.cloud.slideDescription2'),
        image: `${cdnBase()}/assets/help/cloud-2.png`,
    },
    {
        title: t('help.cloud.slideTitle3'),
        description: t('help.cloud.slideDescription3'),
        image: `${cdnBase()}/assets/help/cloud-3.png`,
    }
];


// 获取图片遮盖帮助幻灯片
export const getImageMaskSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.imageMask.slideTitle1'),
        description: t('help.imageMask.slideDescription1'),
        image: `${cdnBase()}/assets/help/imageMask-1.png`,
    },
    {
        title: t('help.imageMask.slideTitle2'),
        description: t('help.imageMask.slideDescription2'),
        image: `${cdnBase()}/assets/help/imageMask-2.png`,
    },
    {
        title: t('help.imageMask.slideTitle3'),
        description: t('help.imageMask.slideDescription3'),
        image: `${cdnBase()}/assets/help/imageMask-3.png`,
    }
];


// 获取精选集帮助幻灯片
export const getCuratedSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.curated.slideTitle1'),
        description: t('help.curated.slideDescription1'),
        image: `${cdnBase()}/assets/help/curated-1.png`,
    },
    {
        title: t('help.curated.slideTitle2'),
        description: t('help.curated.slideDescription2'),
        image: `${cdnBase()}/assets/help/curated-2.png`,
    },
    {
        title: t('help.curated.slideTitle3'),
        description: t('help.curated.slideDescription3'),
        image: `${cdnBase()}/assets/help/curated-3.png`,
    }
];


// 获取Wiki帮助幻灯片
export const getWikiSlides: GetHelpSlidesFn = (t, language) => [
    {
        title: t('help.wiki.slideTitle1'),
        description: t('help.wiki.slideDescription1'),
        image: `${cdnBase()}/assets/help/wiki-1.png`,
    },
    {
        title: t('help.wiki.slideTitle2'),
        description: t('help.wiki.slideDescription2'),
        image: `${cdnBase()}/assets/help/wiki-2.png`,
    },
    {
        title: t('help.wiki.slideTitle3'),
        description: t('help.wiki.slideDescription3'),
        image: `${cdnBase()}/assets/help/wiki-3.png`,
    }
];

