import { Service } from './service';
import { useSettingStore } from '../stores/settingStore';
import { useAudioStore } from '../stores/audioStore';
import { adapter } from '../adapter';
import { AudioAdapter, SoundType, VibrationType } from '../types/adapter';
import { splitTextIntoSentences } from '../utils/textUtils';


export interface PlaybackState {
    currentSentenceIndex: number;
    totalSentences: number;
    currentSentence: string;
    language: string;
}


export class AudioService implements Service {
    /** 延迟到首次访问，避免在 `new Noolingo(adapter)` 之前加载 service 时触发 getAdapter() */
    private audioAdapter: AudioAdapter | null = null;
    private playbackEndedListenerBound = false;
    private isInitialized = false;
    private eventListeners: { [key: string]: Function } = {};
    private hasEmittedPlaybackEnd = false;
    private currentSentenceIndex: number = 0;
    private sentences: string[] = [];
    private isPlaying = false;
    private nextNoteCallback: (() => void) | null = null;
    private nextNoteTimer: ReturnType<typeof setTimeout> | null = null;
    private repeatCount: number = 1;
    private currentRepeatCount: number = 0;

    private getAudioAdapter(): AudioAdapter {
        if (!this.audioAdapter) {
            this.audioAdapter = adapter.audio;
            if (!this.playbackEndedListenerBound) {
                this.audioAdapter.on('playback-ended', () => {
                    this.handlePlaybackEnd();
                });
                this.playbackEndedListenerBound = true;
            }
        }
        return this.audioAdapter;
    }

    async init(): Promise<boolean> {
        try {
            const success = await this.getAudioAdapter().init();
            this.isInitialized = success;
            return success;
        } catch (error) {
            console.error('AudioService 初始化失败', error);
            this.isInitialized = false;
            return false;
        }
    }

    // 设置事件监听
    on(event: string, callback: Function): void {
        this.eventListeners[event] = callback;
    }

    // 移除事件监听
    off(event: string): void {
        delete this.eventListeners[event];
    }

    // 播放振动效果
    async vibrate(vibrationType: VibrationType = 'medium'): Promise<void> {
        if (!useSettingStore.getState().isStudyVibrationEnabled) {
            return;
        }
        await this.getAudioAdapter().vibrate(vibrationType);
    }

    // 播放音效
    async playSound(soundId: SoundType): Promise<boolean> {
        if (!this.isInitialized) {
            console.warn('AudioService 未初始化');
            return false;
        }
        if (!useSettingStore.getState().isSoundEnabled) {
            return false;
        }
        return await this.getAudioAdapter().playSound(soundId);
    }

    // 暂停播放
    async pause(): Promise<void> {
        await this.getAudioAdapter().pause();
        this.hasEmittedPlaybackEnd = false;
        this.isPlaying = false;
        useAudioStore.getState().setIsPlaying(false);
    }

    // 停止播放
    async stop(): Promise<void> {
        await this.getAudioAdapter().stop();
        this.hasEmittedPlaybackEnd = false;
        this.isPlaying = false;
        this.currentSentenceIndex = 0;
        this.currentRepeatCount = 0;
        this.repeatCount = 1;
        this.sentences = [];
        this.clearNextNoteCallback();
        useAudioStore.getState().reset();
    }

    // 设置语速
    async setTextSpeechRate(speed: number): Promise<void> {
        await this.getAudioAdapter().setTextSpeechRate(speed);
    }

    // 播放文本
    async playText(text: string, repeatCount: number = 1): Promise<void> {
        // 清除之前的回调
        this.clearNextNoteCallback();
        if (this.isPlaying) {
            await this.stop();
        }
        this.sentences = splitTextIntoSentences(text);
        useAudioStore.getState().setAllSentences(this.sentences);
        if (this.sentences.length === 0) {
            console.warn('没有可播放的句子');
            return;
        }
        this.repeatCount = (typeof repeatCount === 'number' && repeatCount >= 1 && repeatCount <= 10) ? repeatCount : 1;
        this.currentRepeatCount = 0;
        this.currentSentenceIndex = 0;
        this.hasEmittedPlaybackEnd = false;
        this.isPlaying = true;
        useAudioStore.getState().setIsPlaying(true);
        await this.playCurrentText();
    }

    // 插入新的播放文本
    async playNextText(text: string): Promise<void> {
        if (!this.isPlaying) {
            // 当前不在播放，只设置内容但不播放
            this.sentences = splitTextIntoSentences(text);
            useAudioStore.getState().setAllSentences(this.sentences);
            this.currentSentenceIndex = 0;
            useAudioStore.getState().setCurrentSentence(0);
            return;
        }

        await this.stop();
        this.sentences = splitTextIntoSentences(text);
        useAudioStore.getState().setAllSentences(this.sentences);

        if (this.sentences.length === 0) {
            console.warn('没有可播放的句子');
            return;
        }

        this.currentSentenceIndex = 0;
        this.hasEmittedPlaybackEnd = false;
        this.isPlaying = true;

        useAudioStore.getState().setIsPlaying(true);
        await this.playCurrentText();
    }

    // 预览文本
    async previewText(text: string): Promise<void> {
        this.sentences = splitTextIntoSentences(text);
        useAudioStore.getState().setAllSentences(this.sentences);
        this.currentSentenceIndex = 0;
        this.hasEmittedPlaybackEnd = false;
    }

    // 跳转到指定句子
    async jumpToSentence(sentenceIndex: number): Promise<void> {
        if (sentenceIndex < 0 || sentenceIndex >= this.sentences.length) {
            console.warn(`句子索引 ${sentenceIndex} 超出范围`);
            return;
        }
        if (this.isPlaying) {
            await this.getAudioAdapter().stop();
        }
        this.currentSentenceIndex = sentenceIndex;
        this.isPlaying = true;
        useAudioStore.getState().setIsPlaying(true);
        await this.playCurrentText();
    }


    // 播放单个句子（点读功能）
    async playSingleSentence(sentenceIndex: number): Promise<void> {
        if (sentenceIndex < 0 || sentenceIndex >= this.sentences.length) {
            console.warn(`句子索引 ${sentenceIndex} 超出范围`);
            return;
        }
        if (this.isPlaying) {
            await this.getAudioAdapter().stop();
        }
        this.currentSentenceIndex = sentenceIndex;
        this.hasEmittedPlaybackEnd = false;
        const sentence = this.sentences[sentenceIndex];
        if (!sentence.trim()) {
            return;
        }
        useAudioStore.getState().setCurrentText(sentence);
        useAudioStore.getState().setCurrentSentence(sentenceIndex);
        this.isPlaying = true;
        useAudioStore.getState().setIsPlaying(true);
        try {
            await this.getAudioAdapter().speak(sentence, () => {
                this.isPlaying = false;
                useAudioStore.getState().setIsPlaying(false);
            });
        } catch (error) {
            console.error('播放文本失败:', error);
            this.isPlaying = false;
            useAudioStore.getState().setIsPlaying(false);
        }
    }

    // 获取播放状态
    getPlaybackState(): PlaybackState {
        return {
            currentSentenceIndex: this.currentSentenceIndex,
            totalSentences: this.sentences.length,
            currentSentence: this.sentences[this.currentSentenceIndex] || '',
            language: this.getAudioAdapter().getCurrentLanguage()
        };
    }

    // 播放当前文本
    private async playCurrentText(): Promise<void> {
        // 检查是否还在播放状态，如果已经暂停则不继续
        if (!this.isPlaying) {
            return;
        }
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.handlePlaybackEnd();
            return;
        }
        const sentence = this.sentences[this.currentSentenceIndex];
        if (!sentence.trim()) {
            this.currentSentenceIndex++;
            await this.playCurrentText();
            return;
        }
        this.hasEmittedPlaybackEnd = false;
        useAudioStore.getState().setCurrentText(sentence);
        useAudioStore.getState().setCurrentSentence(this.currentSentenceIndex);
        try {
            await this.getAudioAdapter().speak(sentence, () => {
                // 再次检查状态，防止在回调执行时状态已改变
                if (!this.isPlaying) {
                    return;
                }
                this.currentSentenceIndex++;
                if (this.currentSentenceIndex < this.sentences.length) {
                    // 使用setTimeout确保回调不会立即执行，避免竞态条件
                    setTimeout(() => {
                        if (this.isPlaying) {
                            this.playCurrentText();
                        }
                    }, 50);
                } else {
                    this.handlePlaybackEnd();
                }
            });
        } catch (error) {
            console.error('播放文本失败:', error);
            this.isPlaying = false;
            useAudioStore.getState().setIsPlaying(false);
        }
    }

    // 设置下一首播放的回调
    setNextNoteCallback(callback: (() => void) | null): void {
        this.clearNextNoteCallback();
        this.nextNoteCallback = callback;
    }


    // 清除下一首播放的回调
    clearNextNoteCallback(): void {
        if (this.nextNoteTimer) {
            clearTimeout(this.nextNoteTimer);
            this.nextNoteTimer = null;
        }
        this.nextNoteCallback = null;
    }


    // 处理播放结束
    private handlePlaybackEnd(): void {
        if (!this.hasEmittedPlaybackEnd) {
            this.hasEmittedPlaybackEnd = true;
            if (this.repeatCount > 1 && this.currentRepeatCount < this.repeatCount - 1) {
                this.currentRepeatCount++;
                this.currentSentenceIndex = 0;
                this.hasEmittedPlaybackEnd = false;
                setTimeout(() => {
                    if (this.isPlaying) {
                        this.playCurrentText();
                    }
                }, 500);
                return;
            }
            this.emit('playback-ended');
            if (this.nextNoteCallback) {
                this.nextNoteTimer = setTimeout(() => {
                    this.nextNoteTimer = null;
                    const callback = this.nextNoteCallback;
                    this.nextNoteCallback = null;
                    if (callback) {
                        try {
                            callback();
                        } catch (error) {
                            console.error('执行下一首回调失败:', error);
                        }
                    }
                }, 1000);
            } else {
                this.isPlaying = false;
                useAudioStore.getState().setIsPlaying(false);
            }
        }
    }


    // 触发事件
    private emit(event: string, ...args: any[]): void {
        const callback = this.eventListeners[event];
        if (callback) {
            callback(...args);
        }
    }
}

export const audioService = new AudioService();
export default audioService;