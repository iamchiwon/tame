import { create } from 'zustand';
import { AppSettings } from '@/lib/types';
import { getDatabase } from '@/lib/database';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  notificationsEnabled: true,
  autoMarkAsRead: false,
  defaultViewMode: 'all'
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  updateSettings: async (updates) => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        const { settings } = get();
        const newSettings = { ...settings, ...updates };

        // 각 설정을 개별적으로 저장
        await Promise.all([
          db.setSetting('theme', newSettings.theme),
          db.setSetting('notificationsEnabled', newSettings.notificationsEnabled.toString()),
          db.setSetting('autoMarkAsRead', newSettings.autoMarkAsRead.toString()),
          db.setSetting('defaultViewMode', newSettings.defaultViewMode)
        ]);

        set({
          settings: newSettings,
          isLoading: false
        });
      } else {
        // 클라이언트 사이드에서는 로컬 상태만 업데이트
        const { settings } = get();
        const newSettings = { ...settings, ...updates };
        set({
          settings: newSettings,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      set({ isLoading: false });
    }
  },

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();

        const [theme, notificationsEnabled, autoMarkAsRead, defaultViewMode] = await Promise.all([
          db.getSetting('theme'),
          db.getSetting('notificationsEnabled'),
          db.getSetting('autoMarkAsRead'),
          db.getSetting('defaultViewMode')
        ]);

        const settings: AppSettings = {
          theme: (theme as AppSettings['theme']) || defaultSettings.theme,
          notificationsEnabled: notificationsEnabled === 'true' || defaultSettings.notificationsEnabled,
          autoMarkAsRead: autoMarkAsRead === 'true' || defaultSettings.autoMarkAsRead,
          defaultViewMode: (defaultViewMode as AppSettings['defaultViewMode']) || defaultSettings.defaultViewMode
        };

        set({
          settings,
          isLoading: false
        });
      } else {
        // 클라이언트 사이드에서는 기본 설정 사용
        set({
          settings: defaultSettings,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  resetSettings: async () => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();

        // 모든 설정 삭제
        await Promise.all([
          db.setSetting('theme', defaultSettings.theme),
          db.setSetting('notificationsEnabled', defaultSettings.notificationsEnabled.toString()),
          db.setSetting('autoMarkAsRead', defaultSettings.autoMarkAsRead.toString()),
          db.setSetting('defaultViewMode', defaultSettings.defaultViewMode)
        ]);

        set({
          settings: defaultSettings,
          isLoading: false
        });
      } else {
        // 클라이언트 사이드에서는 로컬 상태만 리셋
        set({
          settings: defaultSettings,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      set({ isLoading: false });
    }
  }
}));
