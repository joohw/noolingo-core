// @/services/indice.service.ts
// 通过维护索引高效率地提供查询操作，同时支持持久化的选项


import { Service } from './service'
import { Note, determineNoteFeatures, calculateNoteHash } from '../note';
import { CardState } from '../fsrs';
import { sortNotes } from "../note/sortNotes"
import { SearchQuery } from '../types/search_model';
import { useNoteStore } from '../stores/noteStore';
import { Deck, SortState, DeckSortKey, SortOrder, defaultSortState } from '../deck/deck_model';
import { sortDecks } from '../deck/sort';
import { ConfigKey, configManager } from '../storage/configManager'
import { useStudyStore } from '../stores/studyStore';
import { normalizeTitleForIndex } from '../utils/textNormalize';
import { DataChangeSet } from 'delta-sync';
import noteRepo from '../repo/NoteRepository';




export enum IndexEventType {
    INITIALIZED = 'initialized',
    DATA_RELOADED = 'data_reloaded',
    NOTES_UPDATED = 'notes_updated',
}


export class IndicesService implements Service {


    async init() {
        // 1. 初始化卡组索引
        const decks = await noteRepo.listDecks();
        decks.forEach(deck => {
            this.addDeckIndex(deck);
        });
        // 2. 初始化笔记索引
        const BATCH_SIZE = 10000;
        let offset = 0;
        let totalProcessed = 0;
        let totalInvalid = 0;
        let hasMore = true;
        while (hasMore) {
            const result = await noteRepo.readNotes(BATCH_SIZE, offset, true);
            result.items.forEach(note => { indicesService.addNoteIndex(note); });
            totalProcessed += result.items.length;
            if (result.invalidNoteIds) {
                totalInvalid += result.invalidNoteIds.length;
            }
            hasMore = result.hasMore;
            offset += BATCH_SIZE;
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        // 3. 初始化搜索查询
        console.log('IndicesService init');
        const LAST_SEARCH_QUERY = await configManager.getConfig<SearchQuery>(ConfigKey.LAST_SEARCH_QUERY);
        if (LAST_SEARCH_QUERY) {
            await this.handleSetQuery(LAST_SEARCH_QUERY);
        } else {
            await this.handleSetQuery({ deckId: 'all' });
        }
    }


    public async clearLocalData(): Promise<void> {
        try {
            await noteRepo.clearLocalNotesAndDecks();// 清空本地数据
            await this.clear();   // 清空索引
            useNoteStore.getState().reset(); // 清空状态
            console.log('所有数据、索引和状态已清空');
        } catch (error) {
            console.error('清空数据失败:', error);
            throw error;
        }
    }

    // 构造函数，禁止外部实例化
    constructor() {
        this.decksMap = new Map();
        this.notesMap = new Map();
        this.byTag = new Map();
        this.byDeckId = new Map();
        this.byDeckTagCount = new Map();
        this.byTitle = new Map();
        this.byHash = new Map();
        this.linkedNotes = { incoming: new Map(), outgoing: new Map() };
        this.byDueDate = new Map();
        this.byDeckIdAndPath = new Map();
        this.specialDecks = {
            all: new Set(),
            trash: new Set(),
            unorganized: new Set(),
            starred: new Set()
        };
    }

    //2.复习日期索引
    public byDueDate: Map<string, Set<string>>; // dueDate字符串 -> noteId集合
    //3.全部笔记索引
    public notesMap: Map<string, Note>; // noteId -> note
    //4.全部卡组索引
    public decksMap: Map<string, Deck>; // deckId -> deck
    //5.哈希索引
    public byHash: Map<string, string>; // 按hash分类
    //6.笔记本索引
    public byDeckId: Map<string, Set<string>>;    // 按卡组分类
    //7.特殊deck索引
    public specialDecks: {
        all: Set<string>;           // 所有非删除笔记
        trash: Set<string>;          // 回收站
        unorganized: Set<string>;    // 未组织的笔记
        starred: Set<string>;        // 星标笔记
    };
    //8.标题索引
    public byTitle: Map<string, Set<string>>;     // 按标题分类
    //9.标签索引
    public byTag: Map<string, Set<string>>;       // 按标签分类
    //10.颜色索引
    public byDeckTagCount: Map<string, Map<string, number>>; // deckId -> (tag -> count)
    //12.链接索引
    public linkedNotes: {
        outgoing: Map<string, Set<string>>;  // noteId -> [targetIds] 出链，笔记指向的笔记链接
        incoming: Map<string, Set<string>>;  // noteId -> [sourceIds] 入链，用于计算回链
    };
    //13.Deck+Path索引
    public byDeckIdAndPath: Map<string, Set<string>>; // "deckId:pathKey" -> noteId集合，用于快速查找某个deck下某个路径的notes



    public async handleSetQuery(query: SearchQuery) {
        try {
            if (!indicesService) return;
            useNoteStore.getState().setSearchQuery(query);
            const searchResults = await indicesService.search(query);
            let resultIds = searchResults.map(note => note.id);
            useNoteStore.getState().setNoteList(resultIds);
            configManager.saveConfig(ConfigKey.LAST_SEARCH_QUERY, query);
        } catch (error) {
            console.error('Error setting query:', error);
            throw error;
        }
    }


    // 搜索笔记
    async search(searchQuery: SearchQuery): Promise<Note[]> {
        try {
            let results: Note[] = [];
            if (searchQuery.deckId) {
                const deckNoteIds = this.getDeckNoteIds(searchQuery.deckId, undefined);
                results = deckNoteIds.map(id => this.notesMap.get(id)).filter((note): note is Note => note !== undefined);
            } else {
                results = Array.from(this.notesMap.values());
            }
            // 2.基于path进行过滤（支持父路径匹配所有子路径）
            if (searchQuery.path !== undefined && searchQuery.path !== null && searchQuery.path.length > 0) {
                results = results.filter(note => {
                    const notePath = note.path ?? [];
                    // 如果笔记路径长度小于搜索路径长度，不匹配
                    if (notePath.length < searchQuery.path!.length) {
                        return false;
                    }
                    // 检查笔记路径的前缀是否与搜索路径完全匹配
                    for (let i = 0; i < searchQuery.path!.length; i++) {
                        if (notePath[i] !== searchQuery.path![i]) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            // 3.基于tags进行过滤
            if (searchQuery.tags && searchQuery.tags.length > 0) {
                const searchTags = searchQuery.tags.map(t => t.toLowerCase());
                const tagUnion = new Set<string>();
                for (const tag of searchTags) {
                    const tagNotes = this.byTag.get(tag);
                    if (tagNotes && tagNotes.size > 0) {
                        tagNotes.forEach(id => tagUnion.add(id));
                    }
                }
                if (tagUnion.size > 0) {
                    results = results.filter(note => tagUnion.has(note.id));
                } else {
                    results = [];
                }
            }
            // 4. 标题精确匹配（使用 byTitle 索引优化，规范化处理全角/半角字符）
            if (searchQuery.title) {
                const searchTitle = normalizeTitleForIndex(searchQuery.title);
                const titleKey = searchTitle.slice(0, 30); // 使用前30个字符作为索引键
                const candidateNoteIds = this.byTitle.get(titleKey);
                if (candidateNoteIds && candidateNoteIds.size > 0) {
                    // 从候选笔记中进行精确匹配（使用规范化后的标题比较）
                    const matchedNotes = Array.from(candidateNoteIds)
                        .map(id => this.notesMap.get(id))
                        .filter((note): note is Note => {
                            if (!note) return false;
                            const noteTitle = normalizeTitleForIndex(note.title ?? '');
                            return noteTitle === searchTitle;
                        });
                    // 如果之前有过滤条件（如 deckId, tags），需要取交集
                    if (results.length > 0) {
                        const matchedIds = new Set(matchedNotes.map(n => n.id));
                        results = results.filter(note => matchedIds.has(note.id));
                    } else {
                        results = matchedNotes;
                    }
                } else {
                    // 如果索引中找不到，回退到遍历所有笔记进行匹配（向后兼容旧索引）
                    // 这种情况会在索引重建后消失
                    const matchedNotes = results.filter(note => {
                        const noteTitle = normalizeTitleForIndex(note.title ?? '');
                        return noteTitle === searchTitle;
                    });
                    results = matchedNotes;
                }
            }
            // 5. 文本搜索
            if (searchQuery.text) {
                const text = searchQuery.text.toLowerCase();
                results = results.filter(note => {
                    let score = 0;
                    if (note.title?.toLowerCase().includes(text) ?? false) {
                        score += 15;
                    }
                    if (note.features.summary?.toLowerCase().includes(text) ?? false) {
                        score += 8;
                    }
                    return score > 0;
                });
            }
            // 6. 应用数量限制
            if (searchQuery.limit && searchQuery.limit > 0) {
                results = results.slice(0, searchQuery.limit);
            }
            // 7. 应用排序
            if (searchQuery.sortState) {
                results = sortNotes(results, searchQuery.sortState);
            }
            return results;
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }


    public getNoteDeck(noteId: string): Deck | null {
        const note = this.notesMap.get(noteId);
        if (!note || note.deck_id === undefined || note.deck_id === null) {
            return null;
        }
        return this.decksMap.get(note.deck_id) ?? null;
    }


    // Read - 快速检索
    public getNoteById(id: string): Note | undefined {
        return this.notesMap.get(id);
    }

    public getDeckById(id: string): Deck | undefined {
        return this.decksMap.get(id);
    }

    // 判断笔记本是否归档
    public isDeckArchived(deckId: string): boolean {
        if (deckId === 'all' || deckId === 'trash' || deckId === 'unorganized' || deckId === 'starred') {
            return false;
        }
        const deck = this.decksMap.get(deckId);
        return !!deck?.archived;
    }

    public getDeckByName(name: string): Deck | null {
        const normalizedName = name.toLowerCase().trim();
        for (const deck of this.decksMap.values()) {
            if (deck.name.toLowerCase() === normalizedName) {
                return deck;
            }
        }
        return null;
    }

    public getSortedDecks(sortState: { key: DeckSortKey; order: SortOrder }): string[] {
        const allDecks = Array.from(this.decksMap.values());
        const sortedDeckIds = sortDecks(allDecks, sortState.key, sortState.order);
        return sortedDeckIds.map(deck => deck.id);
    }




    public getNotesByTag(tag: string): string[] {
        return Array.from(this.byTag.get(tag.toLowerCase()) || new Set());
    }

    public getNotesCount(deckId: string): number {
        return this.getDeckNoteIds(deckId).length
    }


    // 将path转换为索引key
    private pathToKey(path: string[] | null): string {
        if (!path || path.length === 0) {
            return '';
        }
        return JSON.stringify(path);
    }


    public filterQuizzableNotes(noteIds: string[]): string[] {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const quiz_strategy = useStudyStore.getState().preferences.quiz_selection_strategy;
        const notes = noteIds
            .map(id => this.notesMap.get(id))
            .filter((note): note is Note => note !== undefined);
        const filteredNotes = notes
            .filter(note => {
                if (note.archived || !note.features.quizzable) {
                    return false;
                }
                if (note.deck_id && note.deck_id !== 'all' && note.deck_id !== 'trash' &&
                    note.deck_id !== 'unorganized' && note.deck_id !== 'starred') {
                    const noteDeck = this.decksMap.get(note.deck_id);
                    if (noteDeck?.archived) {
                        return false;
                    }
                }
                // 根据策略筛选笔记
                switch (quiz_strategy) {
                    case 'due_only':
                        const isNewNote = note.recall.state <= 1;
                        const isReviewNote = note.recall.state === 2 && this.getDueDateString(note.recall.due) <= today;
                        if (!isNewNote && !isReviewNote) {
                            return false;
                        }
                        break;
                    case 'recent':
                        if (note.next_quiz_at) {
                            if (new Date(note.next_quiz_at) > now) {
                                return false;
                            }
                        }
                        break;
                    case 'all':
                        // all 策略：不过滤，允许滚动刷题，通过排序实现优先级
                        break;
                    default:
                        break;
                }
                return true;
            });
        // 只有 all 策略才进行排序：没有 last_quiz_at 的笔记在前，有 last_quiz_at 的笔记在后
        if (quiz_strategy === 'all') {
            const sortedNotes = filteredNotes.sort((a, b) => {
                const aHasQuiz = !!a.last_quiz_at;
                const bHasQuiz = !!b.last_quiz_at;
                if (aHasQuiz === bHasQuiz) {
                    return 0; // 保持原有顺序
                }
                return aHasQuiz ? 1 : -1; // 没有 last_quiz_at 的排在前面（返回 -1）
            });
            return sortedNotes.map(note => note.id);
        }
        return filteredNotes.map(note => note.id);
    }


    // 过滤出可以在闪卡模式下学习的新笔记或者没有到期的复习笔记
    public filterFlashcardNotes(noteIds: string[]): string[] {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        return noteIds.filter(id => {
            const note = this.notesMap.get(id);
            if (!note || note.archived || note._deleted_at) {
                return false;
            }
            // 新笔记或学习中的笔记（state <= 1），需要检查 due 时间是否已到期
            if (note.recall.state <= 1) {
                const dueDate = new Date(note.recall.due);
                return dueDate <= now;
            }
            // 到期的复习笔记（state === 2 且 due <= today）
            if (note.recall.state === 2) {
                const dueDate = this.getDueDateString(note.recall.due);
                return dueDate <= today;
            }
            return false;
        });
    }



    getDeckNoteIds(deckId: string, sort?: SortState | null): string[] {
        let noteIds: string[];
        switch (deckId) {
            case 'all':
                noteIds = Array.from(this.specialDecks.all);
                break;
            case 'trash':
                noteIds = Array.from(this.specialDecks.trash);
                break;
            case 'unorganized':
                noteIds = Array.from(this.specialDecks.unorganized);
                break;
            case 'starred':
                noteIds = Array.from(this.specialDecks.starred);
                break;
            default:
                noteIds = Array.from<string>(this.byDeckId.get(deckId) || new Set<string>())
        }
        let sortState = defaultSortState;
        if (!sort) {
            const deck = this.getDeckById(deckId);
            if (!deck) {
                const savedSortStates = configManager.getConfig<Record<string, SortState>>(ConfigKey.NOTE_SORT) || {};
                sortState = savedSortStates[deckId] || defaultSortState;
            } else {
                sortState = deck.sortState || defaultSortState;
            }
        } else {
            sortState = sort;
        }
        const notes = noteIds
            .map(id => this.notesMap.get(id))
            .filter((note): note is Note => !!note); // 过滤掉不存在的笔记
        return sortNotes(notes, sortState).map(note => note.id);
    }



    public getNotesByTags(tags: string[]): string[] {
        if (!tags || tags.length === 0) return [];
        const normalizedTags = tags.map(tag => tag.toLowerCase());
        let resultSet = new Set(this.byTag.get(normalizedTags[0]) || new Set<string>());
        for (let i = 1; i < normalizedTags.length; i++) {
            const tagNotes = this.byTag.get(normalizedTags[i]) || new Set<string>();
            resultSet = new Set([...resultSet].filter(noteId => tagNotes.has(noteId)));
        }
        return Array.from(resultSet).filter(noteId => {
            const note = this.notesMap.get(noteId);
            return note && !note._deleted_at;
        });
    }


    public getNotesByTitle(title: string): string[] | null {
        if (!title) return null;
        const normalizedTitle = normalizeTitleForIndex(title);
        const titleKey = normalizedTitle.slice(0, 30);
        const noteIds = this.byTitle.get(titleKey);
        return noteIds && noteIds.size > 0 ? Array.from(noteIds) : null;
    }

    public isNoteHashExists(note: Partial<Note>, excludeNoteId?: string): boolean {
        const hash = calculateNoteHash(note);
        if (!hash) {
            return false;
        }
        const existingNoteId = this.byHash.get(hash);
        return existingNoteId !== undefined && existingNoteId !== excludeNoteId;
    }


    // 获得指定deck包含的所有的tag
    public getDeckTagsWithCount(deckId: string): Array<{ tag: string, count: number }> {
        if (deckId === 'all' || deckId === 'trash' || deckId === 'unorganized' || deckId === 'starred') {
            const result: Array<{ tag: string, count: number }> = [];
            this.byTag.forEach((noteSet, tag) => {
                result.push({ tag, count: noteSet.size });
            });
            return result.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
        }
        const deckTagCount = this.byDeckTagCount.get(deckId) || new Map();
        return Array.from(deckTagCount.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    }



    // ----------------------- 索引的维护  -----------------------


    addDeckIndex(deck: Deck) {
        this.decksMap.set(deck.id, deck);
        useNoteStore.getState().setDecksMap(this.decksMap);
    }

    removeDeckIndex(deckId: string) {
        this.decksMap.delete(deckId);
        useNoteStore.getState().setDecksMap(this.decksMap);
    }


    updateDeckIndex(deckUpdate: Partial<Deck> & { id: string }) {
        const existingDeck = this.decksMap.get(deckUpdate.id);
        if (!existingDeck) {
            this.addDeckIndex(deckUpdate as Deck);
            return
        } else {
            const updatedDeck: Deck = {
                ...existingDeck,
                ...deckUpdate,
                stats: existingDeck.stats
            };
            this.decksMap.set(deckUpdate.id, updatedDeck);
        }
        useNoteStore.getState().setDecksMap(this.decksMap);
    }


    // Update - 更新笔记索引（当deck_id或path改变时需要更新索引）
    // 注意：这个方法需要先获取旧的note，然后调用此方法
    updateNoteIndex(note: Note, oldNote: Note) {
        try {
            // 如果deck_id或path改变了，需要从旧索引中移除
            const oldPathKey = this.pathToKey(oldNote.path);
            const newPathKey = this.pathToKey(note.path);
            const oldIndexKey = oldNote.deck_id ? `${oldNote.deck_id}:${oldPathKey}` : null;
            const newIndexKey = note.deck_id ? `${note.deck_id}:${newPathKey}` : null;
            if (oldIndexKey && oldIndexKey !== newIndexKey) {
                const oldPathNotes = this.byDeckIdAndPath.get(oldIndexKey);
                if (oldPathNotes) {
                    oldPathNotes.delete(note.id);
                    if (oldPathNotes.size === 0) {
                        this.byDeckIdAndPath.delete(oldIndexKey);
                    }
                }
            }
            // 调用addNoteIndex来更新索引（它会处理新索引的添加）
            this.addNoteIndex(note);
        } catch (error) {
            console.error('Error updating note index:', error);
        }
    }


    // Create - 创建笔记，维护索引和store
    addNoteIndex(note: Note) {
        try {

            note.features = determineNoteFeatures(note);
            this.notesMap.set(note.id, note);
            useNoteStore.getState().setNotesMap(this.notesMap);
            if (note.features.hash && note.features.hash !== '') {
                this.byHash.set(note.features.hash, note.id);
            }
            if (note._deleted_at) {
                this.specialDecks.trash.add(note.id);
            } else {
                this.specialDecks.all.add(note.id);
                if (note.deck_id && this.decksMap.has(note.deck_id)) {
                    const deckNotes = this.byDeckId.get(note.deck_id) || new Set();
                    deckNotes.add(note.id);
                    this.byDeckId.set(note.deck_id, deckNotes);
                    // 维护byDeckIdAndPath索引
                    const pathKey = this.pathToKey(note.path);
                    const indexKey = `${note.deck_id}:${pathKey}`;
                    const pathNotes = this.byDeckIdAndPath.get(indexKey) || new Set();
                    pathNotes.add(note.id);
                    this.byDeckIdAndPath.set(indexKey, pathNotes);
                } else {
                    this.specialDecks.unorganized.add(note.id);
                }
                if (note.starred) {
                    this.specialDecks.starred.add(note.id);
                }
            }
            if (!note.archived) {
                const dueDate = this.getDueDateString(note.recall.due);
                if (dueDate) {
                    const dueSet = this.byDueDate.get(dueDate) || new Set();
                    dueSet.add(note.id);
                    this.byDueDate.set(dueDate, dueSet);
                }
            }
            this.updateDeckStats(note, 'add');
            // 更新tag索引和deck的TagCount索引
            if (!note._deleted_at && note.deck_id && note.tags.length > 0) {
                const deckTagCount = this.byDeckTagCount.get(note.deck_id) || new Map();
                note.tags?.forEach(tag => {
                    const tagNotes = this.byTag.get(tag.toLowerCase()) || new Set();
                    tagNotes.add(note.id);
                    this.byTag.set(tag.toLowerCase(), tagNotes);
                });
                note.tags.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    const currentCount = deckTagCount.get(normalizedTag) || 0;
                    deckTagCount.set(normalizedTag, currentCount + 1);
                });
                this.byDeckTagCount.set(note.deck_id, deckTagCount);
            }

            // 标题索引（使用规范化后的标题）
            if (note.title && !note._deleted_at) {
                const normalizedTitle = normalizeTitleForIndex(note.title);
                const titleKey = normalizedTitle.slice(0, 30); // 取前30个字符作为索引键
                const titleNotes = this.byTitle.get(titleKey) || new Set<string>();
                titleNotes.add(note.id);
                this.byTitle.set(titleKey, titleNotes);
            }

            // 双向链接索引 - links.to 存储的是目标笔记 ID
            if (note.links?.to.length > 0) {
                const normalizedTargets = note.links.to.filter(id => typeof id === 'string' && id.trim() !== '');
                const outgoingSet = new Set(normalizedTargets);
                if (outgoingSet.size > 0) {
                    this.linkedNotes.outgoing.set(note.id, outgoingSet);
                }
                normalizedTargets.forEach(targetId => {
                    const targetNote = this.notesMap.get(targetId);
                    if (!targetNote) return;
                    const incomingSet = this.linkedNotes.incoming.get(targetNote.id) || new Set();
                    incomingSet.add(note.id);
                    this.linkedNotes.incoming.set(targetNote.id, incomingSet);
                    if (
                        Array.isArray(targetNote.links?.from) &&
                        !targetNote.links.from.includes(note.id)
                    ) {
                        targetNote.links.from.push(note.id);
                    }
                });
            }

        }
        catch (error) {
            console.error('Error adding note to index:', error);
        }
    }




    removeNoteIndex(noteId: string) {
        try {
            const note = this.notesMap.get(noteId);
            if (!note) return;
            this.notesMap.delete(noteId);
            useNoteStore.getState().setNotesMap(this.notesMap);
            // 移除hash索引
            if (note.features?.hash) {
                this.byHash.delete(note.features.hash);
            }
            // 移除deck索引
            if (note.deck_id) {
                this.byDeckId.get(note.deck_id)?.delete(noteId);
                // 移除byDeckIdAndPath索引
                const pathKey = this.pathToKey(note.path);
                const indexKey = `${note.deck_id}:${pathKey}`;
                const pathNotes = this.byDeckIdAndPath.get(indexKey);
                if (pathNotes) {
                    pathNotes.delete(noteId);
                    if (pathNotes.size === 0) {
                        this.byDeckIdAndPath.delete(indexKey);
                    }
                }
            }
            // 更新deck统计
            this.updateDeckStats(note, 'remove');
            Object.values(this.specialDecks).forEach(set => set.delete(noteId));
            // 更新 deck 标签索引
            if (note.deck_id && !note._deleted_at && this.byDeckTagCount.has(note.deck_id)) {
                const deckTagCount = this.byDeckTagCount.get(note.deck_id)!;
                note.tags?.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    const currentCount = deckTagCount.get(normalizedTag) || 0;
                    if (currentCount > 1) {
                        deckTagCount.set(normalizedTag, currentCount - 1);
                    } else {
                        deckTagCount.delete(normalizedTag);
                    }
                });
            }
            // 移除标题索引（使用规范化后的标题）
            if (note.title) {
                this.byTitle.delete(note.title);
            }
            // 移除tag索引
            note.tags?.forEach(tag => {
                this.byTag.get(tag.toLowerCase())?.delete(noteId);
            });
            // 移除复习日期索引
            if (note.recall?.due) {
                const dueDate = this.getDueDateString(note.recall.due);
                if (dueDate) {
                    const dueSet = this.byDueDate.get(dueDate);
                    if (dueSet) {
                        dueSet.delete(noteId);
                        if (dueSet.size === 0) {
                            this.byDueDate.delete(dueDate);
                        }
                    }
                }
            }

            // 移除双向链接索引
            const incomingLinks = this.linkedNotes.incoming.get(noteId);
            if (incomingLinks) {
                incomingLinks.forEach(sourceId => {
                    const sourceNote = this.notesMap.get(sourceId);
                    if (sourceNote?.links?.from) {
                        sourceNote.links.from = sourceNote.links.from.filter(id => id !== noteId);
                    }
                });
                this.linkedNotes.incoming.delete(noteId);
            }
            const outgoingLinks = this.linkedNotes.outgoing.get(noteId);
            if (outgoingLinks && note.links?.to) {
                note.links.to.forEach(targetId => {
                    const targetNote = this.notesMap.get(targetId);
                    if (targetNote?.links?.from) {
                        targetNote.links.from = targetNote.links.from.filter(id => id !== noteId);
                    }
                    const incomingSet = this.linkedNotes.incoming.get(targetId);
                    if (incomingSet) {
                        incomingSet.delete(noteId);
                        if (incomingSet.size === 0) {
                            this.linkedNotes.incoming.delete(targetId);
                        }
                    }
                });
                this.linkedNotes.outgoing.delete(noteId);
            }
        }
        catch (error) {
            console.error('Error removing note from index:', error);
        }
    }


    // 清空
    clear() {
        useNoteStore.getState().setNotesMap(new Map());
        useNoteStore.getState().setDecksMap(new Map());
        this.decksMap.clear();
        this.notesMap.clear();
        this.byDeckId.clear();
        this.byTag.clear();
        this.byTitle.clear();
        this.byHash.clear();
        this.byDueDate.clear();
        this.byDeckTagCount.clear();
        Object.values(this.specialDecks).forEach(set => set.clear());
        this.linkedNotes.outgoing.clear();
        this.linkedNotes.incoming.clear();
        this.byDeckIdAndPath.clear();
    }


    // 根据笔记的添加和移除，对应更新 deck 统计信息
    private updateDeckStats(note: Note, operation: 'add' | 'remove') {
        const deckId = note.deck_id || 'all';
        const deck = this.decksMap.get(deckId);
        const today = new Date().toISOString().split('T')[0];
        // 检查笔记是否到期（与 getReviewableNotes 逻辑一致）
        const isDue = note.recall.due && this.getDueDateString(note.recall.due) <= today;
        if (!deck) return;
        if (!deck.stats) {
            deck.stats = {
                notes_count: 0,
                new_count: 0,
                archived_count: 0,
                reviewable_count: 0,
                total_stability: 0,
            };
        }
        const modifier = operation === 'add' ? 1 : -1;
        const noteStability = note.recall.stability || 0;
        // 更新总笔记数
        deck.stats.notes_count = Math.max(0, deck.stats.notes_count + modifier);
        // 更新新笔记数（仅限非归档笔记）
        if (note.recall.state === CardState.LEARNING && !note.archived) {
            deck.stats.new_count = Math.max(0, deck.stats.new_count + modifier);
        }
        // 更新归档笔记数
        if (note.archived) {
            deck.stats.archived_count = Math.max(0, deck.stats.archived_count + modifier);
        } else {
            // 仅非归档笔记计入稳定性统计
            deck.stats.total_stability = Math.max(0, deck.stats.total_stability + (modifier * noteStability));
        }
        // 更新可复习笔记数（与 getReviewableNotes 逻辑完全一致）
        if (!note.archived &&
            note.recall.state !== CardState.LEARNING &&
            isDue) {
            deck.stats.reviewable_count = Math.max(0, deck.stats.reviewable_count + modifier);
        }
        useNoteStore.getState().setDecksMap(this.decksMap);
    }



    private getDueDateString(timestamp: string | Date | null): string {
        if (!timestamp) {
            return new Date().toISOString().split('T')[0];
        }
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }


    // 处理同步变更,从数据库中重新加载这些数据并更新索引
    public async handleSyncChanges(changes: DataChangeSet) {
        if (changes.delete.size === 0 && changes.put.size === 0) return;
        try {
            const reloadNoteIds = new Set<string>();
            const reloadDeckIds = new Set<string>();
            const removeNoteIds = new Set<string>();
            const removeDeckIds = new Set<string>();
            changes.delete.forEach((changeArray, storeName) => {
                changeArray.forEach(change => {
                    if (storeName === 'localNotes') {
                        removeNoteIds.add(change.id);
                    } else if (storeName === 'localDecks') {
                        removeDeckIds.add(change.id);
                    }
                });
            });
            changes.put.forEach((changeArray, storeName) => {
                changeArray.forEach(change => {
                    if (storeName === 'localNotes') {
                        reloadNoteIds.add(change.id);
                    } else if (storeName === 'localDecks') {
                        reloadDeckIds.add(change.id);
                    }
                });
            });
            //处理deck删除
            removeDeckIds.size > 0 && removeDeckIds.forEach(id => {
                this.removeDeckIndex(id);
            });
            // 处理deck更新
            if (reloadDeckIds.size > 0) {
                const updatedDecks = await Promise.all(
                    Array.from(reloadDeckIds).map(id => noteRepo.getDeck(id))
                );
                updatedDecks.forEach(deck => {
                    if (deck) {
                        this.updateDeckIndex(deck);
                    }
                });
            }
            // 处理note删除
            removeNoteIds.size > 0 && removeNoteIds.forEach(id => {
                this.removeNoteIndex(id)
            });
            // 处理note更新
            if (reloadNoteIds.size > 0) {
                const updatedNotes = await Promise.all(
                    Array.from(reloadNoteIds).map(id => noteRepo.getNote(id))
                );
                updatedNotes.forEach(note => {
                    if (note) {
                        this.removeNoteIndex(note.id);
                        this.addNoteIndex(note);
                    }
                });
            }
            // 同步完成后刷新查询
            const currentQuery = useNoteStore.getState().searchQuery;
            if (currentQuery) {
                await this.handleSetQuery(currentQuery);
            }
        } catch (error) {
            console.error('Error handling sync changes:', error);
            throw error;
        }
    }


}


export const indicesService = new IndicesService();
export default indicesService;