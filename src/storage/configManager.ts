// @/storage/configStorage.ts
// 配置文件存储的适配器
// react-native版本的配置文件存储适配器



import { adapter } from '../adapter';



export enum ConfigKey {
  LOCAL_USER = 'local_user',
  TOKEN = 'token',
  REFRESH_TOKEN = 'refresh_token',
  USER_PROFILE = 'userProfile',
  APP_LAUNCH_COUNT = 'launch_count',
  APP_THEME = 'appTheme',
  HAS_BEEN_GUIDED = 'hasBeenGuided',
  APP_LANGUAGE = 'appLanguage',
  AI_OUTPUT_LANGUAGE = 'aiOutputLanguage',
  NOTE_SORT = 'noteSortState',
  NOTE_LAYOUT = 'noteLayout_v1',
  NOTE_LAYOUT_MAP = 'noteLayoutMap',
  NOTE_DISPLAY_MODE = 'noteDisplayMode',
  AUDIO_AUTO_PLAY = 'audioAutoPlay',
  LAST_VIEWED_DECK_ID = 'lastViewedDeckId',
  LAST_SEARCH_QUERY = 'lastSearchQuery',
  DEFAULT_EDITOR_MODE = 'defaultEditorMode',
  DEFAULT_HIDDEN_MODE = 'defaultHiddenMode',
  LAST_SYNC_TIME = 'lastSyncTime',
  AUTO_SYNC = 'autoSync',
  DECK_SORT = 'deckSortState',
  CACHED_NOTE = 'cachedNote',
  CACHED_NOTES = 'cachedNotes',
  CONTENT_EXPANDED = 'contentExpanded',
  HOTKEY_SET = 'hotkey_set',
  CARD_STYLE = 'card_style',
  SIDEBAR_COLLAPSED = 'sidebar_collapsed',
  PRINT_STYLES = 'print_styles',
  HAS_SEEN_WELCOME = 'hasSeen Welcome',
  TERMS_ACCEPTED = 'terms_accepted',
  SKIPPED_VERSION = 'skipped_version',
  PRIVACY_ACCEPTED = 'privacy_accepted',
  LAST_SELECTED_MODEL = 'lastSelectedModel',
  PROMPT_SETTINGS = 'prompt_settings',
  READ_SETTINGS = 'read_settings_v1',
  LAST_IMPORT_PLATFORM = 'lastImportPlatform',
  IS_FULLSCREEN_READING = 'is_fullscreen_reading',
  IS_COLUMN_VIEW_ENABLED = 'is_column_view_enabled',
  APP_FONT = 'app_font_v2',
  HIDE_APPBAR_LABELS = 'show_appbar_labels',
  SOUND_ENABLED = 'sound_enabled',
  VIBRATION_ENABLED = 'vibration_enabled',
  VIBRATION_STUDY_ENABLED = 'vibration_study_enabled',
  QUEUE_SORT_STATE = 'queue_sort_state',
  LEARNING_MODE = 'learning_mode',
  DEFAULT_EDITOR_TYPE = 'default_editor_type',
  DEFAULT_SETTING_SECTION = 'default_setting_section',
  SHOW_NOTES_COUNT = 'SHOW_NOTES_COUNT',
  LAST_DECK_EXPORT_FORMAT = 'last_deck_export_format',
  LAST_RATING_TIMESTAMP = 'last_rating_time',
  GUIDE_COMPLETION_STATUS = 'guide_completion_status',
  PAGE_VISIT_COUNT = 'page_visit_count',
  SCHEDULED_NOTIFICATIONS = 'scheduled_notifications',
  NOTIFICATION_PREFERENCES = 'notification_preferences',
  SPEECH_RATE = 'speech_rate',
  SHOW_SIDEBAR_WIDE_SCREEN = 'show_sidebar_wide_screen',
  EDIT_TAGS_IN_EDITOR = 'edit_tags_in_editor',
  TARGET_RETENTION_DAYS = 'target_rention_days',
  USE_FIRST_LINE_AS_TITLE = 'use_first_line_as_title',
  SPLIT_NOTES_BY_BLANK_LINES = 'split_notes_by_blank_lines',
  SHOW_CURATED = 'show_curated',
  SIDEBAR_DECK_EXPANDED_PATHS = 'expanded_paths_v1',
  CHAT_MESSAGES = 'chat_messages',
  CHAT_INTRO_CACHE = 'chat_intro_cache',
  BLANK_CLICK_FLIP_ENABLED = 'blank_click_flip_enabled',
}




export class ConfigStorageManager {

  private cache: Map<string, any> = new Map();

  constructor() { }

  public saveConfig(key: string, value: any): void {
    try {
      adapter.config.set(key, value);
      this.cache.set(key, value);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }


  public getConfig<T>(key: string): T | null {
    try {
      const cachedValue = this.cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue as T;
      }
      const value = adapter.config.get(key) as T;
      if (value !== null) {
        this.cache.set(key, value);
      }
      return value;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  }


  public removeConfig(key: string): void {
    try {
      adapter.config.delete(key);
      this.cache.delete(key);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }


  public clearAllConfig(): void {
    try {
      Object.values(ConfigKey).forEach(key => {
        this.removeConfig(key);
      });
      this.cache.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }


}



export const configManager = new ConfigStorageManager();  
