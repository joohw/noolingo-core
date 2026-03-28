// @/services/note.service.ts
// 笔记服务层，提供了绝大多数的笔记和笔记本的操作的接口


import { SearchQuery } from '../types/search_model';
import { Note } from '../note';
import { createDefaultDeck, Deck, DeckAction, NoteLayout, defaultSortState, SortState, SPECIAL_DECK_IDS, SpecialDeckId } from '../deck';
import { useNoteStore, ContextOperation } from '../stores/noteStore';
import { useSettingStore } from '../stores/settingStore';
import { ConfigKey, configManager } from '../storage/configManager'
import noteRepo from '../repo/NoteRepository';
import nooCloud from "../cloud";
import { Service } from './service'
import indicesService from './indices.service';
import noteService from './note.service';
import { sortDecks } from '../deck/sort';
import { Paths } from '../deck/Paths';


export class DeckService implements Service {


    constructor() {
    }


    async init() {

    }



    public async createDeck(deckData: Partial<Deck>): Promise<Deck> {
        try {
            const deck = createDefaultDeck(deckData);
            const newDeck = await noteRepo.createDeck(deck);
            indicesService.addDeckIndex(newDeck);
            return newDeck;
        } catch (error) {
            throw error;
        }
    }


    public async updateDeck(deckId: string, deckUpdate: Partial<Deck>) {
        try {
            const deck = await noteRepo.updateDeck(deckId, deckUpdate);
            indicesService.updateDeckIndex(deck);
        } catch (error) {
            console.error('Error updating deck:', error);
            throw error;
        }
    }


    public async deleteDeck(deckId: string) {
        try {
            await noteRepo.hardDeleteDeck(deckId);
            indicesService.removeDeckIndex(deckId);
            if (deckId === useNoteStore.getState().searchQuery.deckId) {
                await this.handleSetQuery({ deckId: 'unorganized' });
            }
            useNoteStore.getState().clearProgress(deckId);
        } catch (error) {
            console.error('Error deleting deck:', error);
            throw error;
        }
    }




    public async handleDeckAction(deckId: string, action: DeckAction) {
        try {
            switch (action) {
                case 'info': {
                    const deckInfo = indicesService.getDeckById(deckId);
                    console.log(deckInfo);
                    break;
                }
                case 'clearTrash': {
                    if (deckId === 'trash') {
                        const trashNoteIds = indicesService.getDeckNoteIds('trash');
                        if (trashNoteIds.length > 0) {
                            await noteService.deleteNotes(trashNoteIds);
                            this.removeFromNoteList(trashNoteIds);
                        }
                    } break;
                }
                case 'clearFavorites': {
                    if (deckId === 'starred') {
                        const starredNoteIds = indicesService.getDeckNoteIds('starred');
                        if (starredNoteIds.length > 0) {
                            const updates: { [noteId: string]: Partial<Note> } = {};
                            starredNoteIds.forEach(id => {
                                updates[id] = {
                                    starred: false
                                };
                            });
                            await noteService.updateNotes(updates);
                            this.removeFromNoteList(starredNoteIds);
                        }
                    } break;
                }
                case 'clearUnorganized':
                    const unorganizedNoteIds = indicesService.getDeckNoteIds('unorganized');
                    if (unorganizedNoteIds.length === 0) return;
                    const updates: { [noteId: string]: Partial<Note> } = {};
                    unorganizedNoteIds.forEach(noteId => {
                        updates[noteId] = {
                            _deleted_at: Date.now()
                        };
                    });
                    await noteService.updateNotes(updates);
                    break;
                case 'delete': {
                    const deck = indicesService.getDeckById(deckId);
                    if (!deck) return;
                    const noteIds = indicesService.getDeckNoteIds(deckId);
                    if (noteIds.length > 0) {
                        const updates: { [noteId: string]: Partial<Note> } = {};
                        noteIds.forEach(id => {
                            updates[id] = {
                                _deleted_at: Date.now(),
                                deck_id: undefined
                            };
                        });
                        await noteService.updateNotes(updates);
                    }
                    await this.deleteDeck(deckId);
                    if (deckId === useNoteStore.getState().searchQuery.deckId) {
                        await this.handleSetQuery({ deckId: 'unorganized' });
                    }
                    useNoteStore.getState().clearProgress(deckId);
                    break;
                }
                case 'clearHistory': {
                    const deckNotes = indicesService.getDeckNoteIds(deckId);
                    await noteService.handleBatchNoteAction(deckNotes, 'clearHistory');
                    break;
                }
                case 'archive':
                case 'unarchive': {
                    const deck = indicesService.getDeckById(deckId);
                    if (!deck) return;
                    if (deckId === 'all' || deckId === 'trash' || deckId === 'unorganized' || deckId === 'starred') {
                        console.warn('Cannot archive/unarchive special deck:', deckId);
                        return;
                    }
                    const shouldArchive = action === 'archive';
                    await this.updateDeck(deckId, {
                        archived: shouldArchive
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling deck action:', error);
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }



    // 打包笔记
    public async packNotes(noteIds: string[], deckName: string, deckDescription: string = '') {
        try {
            const newDeck= await this.createDeck({
                name: deckName,
                description: deckDescription,
            });
            if (!newDeck) return;
            await noteService.moveNotesToDeck(noteIds, newDeck.id);
            this.handleSetQuery({ deckId: newDeck.id });
        } catch (error) {
            console.error('Error packing notes:', error);
        }
    }


    // 生成唯一的 deck 名称（如果重复则增加序号）
    public generateUniqueDeckName(baseName: string): string {
        const allDecks = Array.from(indicesService.decksMap.values());
        const normalizedBaseName = baseName.trim();
        const existingNames = new Set(allDecks.map(deck => deck.name.toLowerCase()));
        if (!existingNames.has(normalizedBaseName.toLowerCase())) {
            return normalizedBaseName;
        }
        let counter = 1;
        let uniqueName = `${normalizedBaseName} ${counter}`;
        while (existingNames.has(uniqueName.toLowerCase())) {
            counter++;
            uniqueName = `${normalizedBaseName} ${counter}`;
        }
        return uniqueName;
    }



    // 从deck中移除path及其所有子路径，不修改笔记的path字段
    public async deletePath(deckId: string, path: string[]) {
        try {
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const updatedPaths = Paths.deletePath(currentPaths, path);
            if (updatedPaths.length === currentPaths.length) {
                return;
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
            // 检查当前query是否包含被删除的path，如果是则更新query
            const currentQuery = useNoteStore.getState().searchQuery;
            if (currentQuery.deckId === deckId && currentQuery.path) {
                const currentPathKey = JSON.stringify(currentQuery.path);
                const deletedPathKey = JSON.stringify(path);
                if (currentPathKey === deletedPathKey || Paths.isParentPath(path, currentQuery.path)) {
                    const newPath = Paths.getParentPath(path);
                    await this.handleSetQuery({
                        ...currentQuery,
                        path: newPath
                    });
                }
            }
        } catch (error) {
            console.error('Error deleting path:', error);
            throw error;
        }
    }


    // 移动path，需要修改笔记的path字段
    public async movePath(deckId: string, oldPath: string[], newPath: string[]) {
        try {
            const oldPathKey = JSON.stringify(oldPath);
            const newPathKey = JSON.stringify(newPath);
            if (oldPathKey === newPathKey) {
                return;
            }
            useNoteStore.getState().setOperation(ContextOperation.UPDATING);
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const childPathMap = new Map<string, string[]>();
            const updates: { [noteId: string]: Partial<Note> } = {};
            // 处理所有路径：更新目标路径及其子路径
            const updatedPaths = currentPaths.map(p => {
                const pKey = JSON.stringify(p);
                // 如果是目标路径本身
                if (pKey === oldPathKey) {
                    return newPath;
                }
                // 如果是子路径（以目标路径为前缀）
                if (p.length > oldPath.length) {
                    const pathPrefix = p.slice(0, oldPath.length);
                    const pathPrefixKey = JSON.stringify(pathPrefix);
                    if (pathPrefixKey === oldPathKey) {
                        // 构建新的子路径：用 newPath 替换 oldPath 前缀
                        const childSuffix = p.slice(oldPath.length);
                        const newChildPath = [...newPath, ...childSuffix];
                        childPathMap.set(pKey, newChildPath);
                        return newChildPath;
                    }
                }
                // 其他路径保持不变
                return p;
            });
            // 获取所有笔记，然后过滤出匹配路径的笔记
            const allNoteIds = indicesService.getDeckNoteIds(deckId, undefined);
            const directNoteIds = allNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(oldPath);
            });
            directNoteIds.forEach(noteId => {
                updates[noteId] = { path: newPath };
            });
            for (const [originalPathKey, newChildPath] of childPathMap.entries()) {
                const originalChildPath = JSON.parse(originalPathKey);
                const childNoteIds = allNoteIds.filter(noteId => {
                    const note = indicesService.getNoteById(noteId);
                    if (!note) return false;
                    const notePath = note.path ?? null;
                    return JSON.stringify(notePath) === JSON.stringify(originalChildPath);
                });
                childNoteIds.forEach(noteId => {
                    updates[noteId] = { path: newChildPath };
                });
            }
            if (Object.keys(updates).length > 0) {
                await noteService.updateNotes(updates);
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
        } catch (error) {
            console.error('Error moving path:', error);
            throw error;
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }


    // 上移path，在同一层级内调整paths数组中的顺序
    public async movePathUp(deckId: string, path: string[]) {
        try {
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const updatedPaths = Paths.moveUp(currentPaths, path);
            if (updatedPaths === currentPaths) {
                return;
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
        } catch (error) {
            console.error('Error moving path up:', error);
            throw error;
        }
    }


    // 下移path，在同一层级内调整paths数组中的顺序
    public async movePathDown(deckId: string, path: string[]) {
        try {
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const updatedPaths = Paths.moveDown(currentPaths, path);
            if (updatedPaths === currentPaths) {
                return;
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
        } catch (error) {
            console.error('Error moving path down:', error);
            throw error;
        }
    }


    public async movePathLeft(deckId: string, path: string[]) {
        try {
            if (path.length === 0) {
                return;
            }
            useNoteStore.getState().setOperation(ContextOperation.UPDATING);
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const { updatedPaths, newPath, childPathMap } = Paths.moveLeft(currentPaths, path);
            const updates: { [noteId: string]: Partial<Note> } = {};
            // 获取所有笔记，然后过滤出匹配路径的笔记
            const allNoteIds = indicesService.getDeckNoteIds(deckId, undefined);
            const noteIds = allNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
            noteIds.forEach(noteId => {
                updates[noteId] = { path: newPath.length > 0 ? newPath : null };
            });
            for (const [originalPathKey, newChildPath] of childPathMap.entries()) {
                const originalChildPath = JSON.parse(originalPathKey);
                const childNoteIds = allNoteIds.filter(noteId => {
                    const note = indicesService.getNoteById(noteId);
                    if (!note) return false;
                    const notePath = note.path ?? null;
                    return JSON.stringify(notePath) === JSON.stringify(originalChildPath);
                });
                childNoteIds.forEach(noteId => {
                    updates[noteId] = { path: newChildPath.length > 0 ? newChildPath : null };
                });
            }
            if (Object.keys(updates).length > 0) {
                await noteService.updateNotes(updates);
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
        } catch (error) {
            console.error('Error moving path left:', error);
            throw error;
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }


    public async movePathRight(deckId: string, path: string[]) {
        try {
            if (path.length === 0) {
                return;
            }
            useNoteStore.getState().setOperation(ContextOperation.UPDATING);
            const deck = indicesService.getDeckById(deckId);
            if (!deck) {
                throw new Error(`Deck ${deckId} not found`);
            }
            const currentPaths = deck.paths || [];
            const { updatedPaths, newPath, childPathMap } = Paths.moveRight(currentPaths, path);
            const updates: { [noteId: string]: Partial<Note> } = {};
            // 获取所有笔记，然后过滤出匹配路径的笔记
            const allNoteIds = indicesService.getDeckNoteIds(deckId, undefined);
            const noteIds = allNoteIds.filter(noteId => {
                const note = indicesService.getNoteById(noteId);
                if (!note) return false;
                const notePath = note.path ?? null;
                return JSON.stringify(notePath) === JSON.stringify(path);
            });
            noteIds.forEach(noteId => {
                updates[noteId] = { path: newPath.length > 0 ? newPath : null };
            });
            for (const [originalPathKey, newChildPath] of childPathMap.entries()) {
                const originalChildPath = JSON.parse(originalPathKey);
                const childNoteIds = allNoteIds.filter(noteId => {
                    const note = indicesService.getNoteById(noteId);
                    if (!note) return false;
                    const notePath = note.path ?? null;
                    return JSON.stringify(notePath) === JSON.stringify(originalChildPath);
                });
                childNoteIds.forEach(noteId => {
                    updates[noteId] = { path: newChildPath.length > 0 ? newChildPath : null };
                });
            }
            if (Object.keys(updates).length > 0) {
                await noteService.updateNotes(updates);
            }
            await this.updateDeck(deckId, { paths: updatedPaths });
        } catch (error) {
            console.error('Error moving path right:', error);
            throw error;
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }


    public async handleSetQuery(query: SearchQuery) {
        try {
            if(!query.sortState) {
                const sortState = this.getDeckSortState();
                query.sortState = sortState;
            }
            await indicesService.handleSetQuery(query);
        } catch (error) {
            console.error('Error setting query:', error);
            throw error;
        }
    }


    public async shareDeck(deckId: string): Promise<any> {
        try {
            const response = await nooCloud.note.shareDeck(deckId.toLowerCase());
            if (response.success && response.data.deck) {
                this.updateDeck(deckId, response.data.deck);
            } else {
                throw new Error(response.message || 'Failed to share deck');
            }
            return response;
        } catch (error) {
            console.error('Error sharing deck:', error);
            throw error;
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }


    public async unshareDeck(deckId: string): Promise<any> {
        try {
            const response = await nooCloud.note.unshareDeck(deckId.toLowerCase());
            if (response.success && response.data.deck) {
                this.updateDeck(deckId, response.data.deck);
            } else {
                throw new Error(response.message || 'Failed to share deck');
            }
            return response;
        } catch (error) {
            console.error('Error sharing deck:', error);
            throw error;
        } finally {
            useNoteStore.getState().setOperation(ContextOperation.IDLE);
        }
    }



    // 把笔记添加到渲染的笔记列表中
    public addToNoteList(noteIds: string | string[]) {
        const currentNoteList = useNoteStore.getState().noteList;
        const currentNoteSet = new Set(currentNoteList);
        if (Array.isArray(noteIds)) {
            if (noteIds.length === 0) return;
            const newNoteIds = noteIds.filter(id => !currentNoteSet.has(id));
            if (newNoteIds.length > 0) {
                useNoteStore.getState().setNoteList([...newNoteIds, ...currentNoteList]);
            }
        } else {
            if (!currentNoteSet.has(noteIds)) {
                useNoteStore.getState().setNoteList([noteIds, ...currentNoteList]);
            }
        }
    }

    // 从渲染的笔记列表中移除笔记
    public removeFromNoteList(noteIds: string | string[]) {
        const currentNoteList = useNoteStore.getState().noteList;
        if (Array.isArray(noteIds)) {
            if (noteIds.length === 0) return;
            const noteIdSet = new Set(noteIds);
            const updatedNoteList = currentNoteList.filter(id => !noteIdSet.has(id));
            if (updatedNoteList.length !== currentNoteList.length) {
                useNoteStore.getState().setNoteList(updatedNoteList);
            }
        } else {
            const index = currentNoteList.indexOf(noteIds);
            if (index !== -1) {
                const updatedNoteList = [...currentNoteList];
                updatedNoteList.splice(index, 1);
                useNoteStore.getState().setNoteList(updatedNoteList);
            }
        }
    }


    // 获取当前选中deck的排序状态
    public getDeckSortState(): SortState {
        const deckId = useNoteStore.getState().searchQuery.deckId || 'all';
        if (!indicesService || !deckId) {
            return defaultSortState;
        }
        const deck = indicesService.getDeckById(deckId);
        if (deck && deck.sortState) {
            return deck.sortState;
        }
        const savedSortStates = configManager.getConfig<Record<string, SortState>>(ConfigKey.NOTE_SORT) || {};
        return savedSortStates[deckId] || defaultSortState;
    }



    // 更新当前选中deck的排序状态并刷新
    public async updateDeckSortState(sortState: SortState): Promise<void> {
        try {
            const deckId = useNoteStore.getState().searchQuery.deckId || 'all';
            const deck = indicesService.getDeckById(deckId);
            if (deck) {
                await this.updateDeck(deckId, { sortState });
            } else {
                const savedSortStates = configManager.getConfig<Record<string, SortState>>(ConfigKey.NOTE_SORT) || {};
                savedSortStates[deckId] = sortState;
                configManager.saveConfig(ConfigKey.NOTE_SORT, savedSortStates);
            }
            useNoteStore.getState().setCurrentSortState(sortState);
            const currentQuery = useNoteStore.getState().searchQuery;
            // search() 只认 searchQuery.sortState，须并入 query 才会重排 noteList
            await this.handleSetQuery({
                ...currentQuery,
                sortState,
                deckId: currentQuery.deckId ?? deckId,
            });
        } catch (error) {
            console.error('Failed to update deck sort state:', error);
            throw error;
        }
    }



    public getDeckLayout(deckId: string): NoteLayout {
        const deck = indicesService.getDeckById(deckId);
        if (deck?.layout) {
            return deck.layout;
        }
        let savedLayouts = configManager.getConfig<Record<string, NoteLayout>>(ConfigKey.NOTE_LAYOUT_MAP);
        if (savedLayouts?.[deckId]) {
            return savedLayouts[deckId];
        }
        const defaultSpecialDeckLayouts: Record<string, NoteLayout> = {
            'all': NoteLayout.masonry,
            'trash': NoteLayout.masonry,
            'unorganized': NoteLayout.masonry
        };
        return defaultSpecialDeckLayouts[deckId] || useSettingStore.getState().noteLayout;
    }



    public updateDeckLayout(deckId: string, layout: NoteLayout): void {
        if (!indicesService || !deckId) return;
        try {
            useSettingStore.getState().setNoteLayout(layout);
            const deck = indicesService.getDeckById(deckId);
            if (deck) {
                this.updateDeck(deckId, { layout });
            } else {
                let savedLayouts = configManager.getConfig<Record<string, NoteLayout>>(ConfigKey.NOTE_LAYOUT_MAP) || {};
                savedLayouts = { ...savedLayouts, [deckId]: layout };
                configManager.saveConfig(ConfigKey.NOTE_LAYOUT_MAP, savedLayouts);
            }
        } catch (error) {
            console.error('Failed to update deck layout:', error);
        }
    }


    // 获取排序后的 decks（排除特殊 deck）
    public getSortedDecks(): Deck[] {
        const decksMap = indicesService.decksMap;
        const deckSortState = useNoteStore.getState().deckSortState;
        const decksArray = Array.from(decksMap.values()).filter(deck =>
            deck &&
            !SPECIAL_DECK_IDS.includes(deck.id as SpecialDeckId)
        );
        if (!deckSortState) return decksArray;
        return sortDecks([...decksArray], deckSortState.key, deckSortState.order);
    }



}


export const deckService = new DeckService();
export default deckService;
