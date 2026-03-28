// @/stores/settingStore.ts

import { create } from "zustand";
import {
  NoteLayout,
  NoteDisplayMode,
  defaultNoteDisplayMode,
  CardStyle,
} from '../deck/deck_model';
import { ConfigKey, configManager } from '../storage/configManager';




export interface SettingStore {
  noteLayout: NoteLayout;
  noteDisplayMode: NoteDisplayMode;
  cardStyle: CardStyle;
  isFullscreenReading: boolean;
  isColumnViewEnabled: boolean;
  isSoundEnabled: boolean;
  isVibrationEnabled: boolean;
  isStudyVibrationEnabled: boolean;
  showAppBarLabels: boolean;
  showNotesCount: boolean;
  showSidebarOnWideScreen: boolean;
  isBlankClickFlipEnabled: boolean;
  setShowSidebarOnWideScreen: (value: boolean) => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleStudyVibration: () => void;
  setNoteLayout: (layout: NoteLayout) => void;
  setNoteDisplayMode: (mode: Partial<NoteDisplayMode>) => void;
  setCardStyle: (style: CardStyle) => void;
  setShowAppBarLabels: (value: boolean) => void;
  setShowNotesCount: (value: boolean) => void;
  toggleFullscreenReading: () => void;
  toggleColumnView: () => void;
  toggleBlankClickFlip: () => void;
}


type SettingStateSlice = Omit<
  SettingStore,
  | 'setShowSidebarOnWideScreen'
  | 'toggleSound'
  | 'toggleVibration'
  | 'toggleStudyVibration'
  | 'setNoteLayout'
  | 'setNoteDisplayMode'
  | 'setCardStyle'
  | 'setShowAppBarLabels'
  | 'setShowNotesCount'
  | 'toggleFullscreenReading'
  | 'toggleColumnView'
  | 'toggleBlankClickFlip'
>;


/** 仅内存默认；模块 load 时 adapter 未就绪，不能读 configManager */
const defaultSettingState: SettingStateSlice = {
  noteLayout: NoteLayout.masonry,
  noteDisplayMode: defaultNoteDisplayMode,
  cardStyle: CardStyle.default,
  isFullscreenReading: false,
  isColumnViewEnabled: false,
  showSidebarOnWideScreen: true,
  isSoundEnabled: true,
  isVibrationEnabled: true,
  isStudyVibrationEnabled: true,
  showAppBarLabels: false,
  showNotesCount: true,
  isBlankClickFlipEnabled: true,
};


export const useSettingStore = create<SettingStore>()((set) => ({
  ...defaultSettingState,
  setNoteLayout: (layout) =>
    set(() => {
      configManager.saveConfig(ConfigKey.NOTE_LAYOUT, layout);
      return { noteLayout: layout };
    }),
  setNoteDisplayMode: (mode) =>
    set((state) => {
      const newMode = { ...state.noteDisplayMode, ...mode };
      configManager.saveConfig(ConfigKey.NOTE_DISPLAY_MODE, newMode);
      return { noteDisplayMode: newMode };
    }),
  setCardStyle: (style) =>
    set(() => {
      configManager.saveConfig(ConfigKey.CARD_STYLE, style);
      return { cardStyle: style };
    }),
  setShowSidebarOnWideScreen: (value: boolean) => {
    configManager.saveConfig(ConfigKey.SHOW_SIDEBAR_WIDE_SCREEN, value);
    set({ showSidebarOnWideScreen: value });
  },
  toggleFullscreenReading: () =>
    set((state) => {
      const newValue = !state.isFullscreenReading;
      configManager.saveConfig(ConfigKey.IS_FULLSCREEN_READING, newValue);
      return { isFullscreenReading: newValue };
    }),
  toggleColumnView: () =>
    set((state) => {
      const newValue = !state.isColumnViewEnabled;
      configManager.saveConfig(ConfigKey.IS_COLUMN_VIEW_ENABLED, newValue);
      return { isColumnViewEnabled: newValue };
    }),
  setShowAppBarLabels: (value: boolean) =>
    set(() => {
      configManager.saveConfig(ConfigKey.HIDE_APPBAR_LABELS, !value);
      return { showAppBarLabels: value };
    }),
  setShowNotesCount: (value: boolean) =>
    set(() => {
      configManager.saveConfig(ConfigKey.SHOW_NOTES_COUNT, value);
      return { showNotesCount: value };
    }),
  toggleSound: () =>
    set((state) => {
      const newValue = !state.isSoundEnabled;
      configManager.saveConfig(ConfigKey.SOUND_ENABLED, newValue);
      return { isSoundEnabled: newValue };
    }),
  toggleVibration: () =>
    set((state) => {
      const newValue = !state.isVibrationEnabled;
      configManager.saveConfig(ConfigKey.VIBRATION_ENABLED, newValue);
      return { isVibrationEnabled: newValue };
    }),
  toggleStudyVibration: () =>
    set((state) => {
      const newValue = !state.isStudyVibrationEnabled;
      configManager.saveConfig(ConfigKey.VIBRATION_STUDY_ENABLED, newValue);
      return { isStudyVibrationEnabled: newValue };
    }),
  toggleBlankClickFlip: () =>
    set((state) => {
      const newValue = !state.isBlankClickFlipEnabled;
      configManager.saveConfig(ConfigKey.BLANK_CLICK_FLIP_ENABLED, newValue);
      return { isBlankClickFlipEnabled: newValue };
    }),
}));




/** 在 setAdapter 之后调用（见 Noolingo 构造函数）：从 config 灌入持久化状态 */
export function initSettingStoreFromConfig(): void {
  useSettingStore.setState({
    noteLayout:
      configManager.getConfig<NoteLayout>(ConfigKey.NOTE_LAYOUT) || defaultSettingState.noteLayout,
    noteDisplayMode:
      configManager.getConfig<NoteDisplayMode>(ConfigKey.NOTE_DISPLAY_MODE) ||
      defaultSettingState.noteDisplayMode,
    cardStyle:
      configManager.getConfig<CardStyle>(ConfigKey.CARD_STYLE) || defaultSettingState.cardStyle,
    isFullscreenReading:
      configManager.getConfig<boolean>(ConfigKey.IS_FULLSCREEN_READING) ??
      defaultSettingState.isFullscreenReading,
    isColumnViewEnabled:
      configManager.getConfig<boolean>(ConfigKey.IS_COLUMN_VIEW_ENABLED) ??
      defaultSettingState.isColumnViewEnabled,
    showSidebarOnWideScreen:
      configManager.getConfig<boolean>(ConfigKey.SHOW_SIDEBAR_WIDE_SCREEN) ??
      defaultSettingState.showSidebarOnWideScreen,
    isSoundEnabled:
      configManager.getConfig<boolean>(ConfigKey.SOUND_ENABLED) ?? defaultSettingState.isSoundEnabled,
    isVibrationEnabled:
      configManager.getConfig<boolean>(ConfigKey.VIBRATION_ENABLED) ??
      defaultSettingState.isVibrationEnabled,
    isStudyVibrationEnabled:
      configManager.getConfig<boolean>(ConfigKey.VIBRATION_STUDY_ENABLED) ??
      defaultSettingState.isStudyVibrationEnabled,
    showAppBarLabels: !(
      configManager.getConfig<boolean>(ConfigKey.HIDE_APPBAR_LABELS) ?? true
    ),
    showNotesCount:
      configManager.getConfig<boolean>(ConfigKey.SHOW_NOTES_COUNT) ??
      defaultSettingState.showNotesCount,
    isBlankClickFlipEnabled:
      configManager.getConfig<boolean>(ConfigKey.BLANK_CLICK_FLIP_ENABLED) ??
      defaultSettingState.isBlankClickFlipEnabled,
  });
}
