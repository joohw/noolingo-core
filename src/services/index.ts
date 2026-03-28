// 统一管理所有服务，按照依赖关系初始化

import authService from './auth.service';
import notificationService from './notification.service';
import indicesService from './indices.service';
import audioService from './audio.service';
import updateService from './update.service';
import curateService from './curate.service';
import publicService from './public.service';
import imageService from './image.service';
import noteService from './note.service';
import statsService from './stats.service';
import aiService from './ai.service';
import paymentService from './payment.service';
import fileService from './import.service';
import quizService from './quiz.service';
import studyService from './study.service';
import syncService from './sync.service';
import deckService from './deck.service';
import chatService from './chat.service';
import { Core } from '../cloud/core';

/** 按照依赖关系初始化服务 */
export async function initServices(): Promise<void> {
    try {
        Core.init();
        await Core.resolveApiBaseUrl();
        await indicesService.init();
        authService.init();
        notificationService.init();
        audioService.init();
        updateService.init();
        curateService.init();
        publicService.init();
        noteService.init();
        statsService.init();
        aiService.init();
        quizService.init();
        studyService.init();
        syncService.init();
        deckService.init();
        chatService.init();
    } catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
}

/** 统一的服务对象 */
export const service = {
    ai: aiService,
    auth: authService,
    audio: audioService,
    notification: notificationService,
    update: updateService,
    curate: curateService,
    public: publicService,
    image: imageService,
    note: noteService,
    stats: statsService,
    payment: paymentService,
    file: fileService,
    quiz: quizService,
    study: studyService,
    sync: syncService,
    indices: indicesService,
    deck: deckService,
    chat: chatService,
};
