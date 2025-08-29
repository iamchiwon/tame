import { create } from 'zustand';
import { Tab } from '@/lib/types';
import { getDatabase } from '@/lib/database';

interface TabState {
  tabs: Tab[];
  activeTabId: number | null;
  isLoading: boolean;

  // Actions
  addTab: (tab: Omit<Tab, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeTab: (id: number) => Promise<void>;
  updateTab: (id: number, updates: Partial<Tab>) => Promise<void>;
  setActiveTab: (id: number) => void;
  reorderTabs: (orderMap: Map<number, number>) => Promise<void>;
  loadTabs: () => Promise<void>;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isLoading: false,

  addTab: async (tab) => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        const newTab = await db.addTab(tab);

        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          isLoading: false
        }));
      } else {
        // 클라이언트 사이드에서는 임시로 처리
        const tempTab = { ...tab, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({
          tabs: [...state.tabs, tempTab],
          activeTabId: tempTab.id,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to add tab:', error);
      set({ isLoading: false });
    }
  },

  removeTab: async (id) => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.deleteTab(id);
      }

      set(state => {
        const newTabs = state.tabs.filter(tab => tab.id !== id);
        const newActiveTabId = state.activeTabId === id
          ? (newTabs.length > 0 ? newTabs[0].id : null)
          : state.activeTabId;

        return {
          tabs: newTabs,
          activeTabId: newActiveTabId,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Failed to remove tab:', error);
      set({ isLoading: false });
    }
  },

  updateTab: async (id, updates) => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.updateTab(id, updates);
      }

      set(state => ({
        tabs: state.tabs.map(tab =>
          tab.id === id ? { ...tab, ...updates } : tab
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update tab:', error);
      set({ isLoading: false });
    }
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },

  reorderTabs: async (orderMap) => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.reorderTabs(orderMap);
      }

      set(state => ({
        tabs: state.tabs.map(tab => {
          const newOrder = orderMap.get(tab.id);
          return newOrder !== undefined ? { ...tab, orderIndex: newOrder } : tab;
        }).sort((a, b) => a.orderIndex - b.orderIndex),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to reorder tabs:', error);
      set({ isLoading: false });
    }
  },

  loadTabs: async () => {
    try {
      set({ isLoading: true });
      if (typeof window === 'undefined') {
        const db = getDatabase();
        const tabs = await db.getTabs();

        set({
          tabs,
          activeTabId: tabs.length > 0 ? tabs[0].id : null,
          isLoading: false
        });
      } else {
        // 클라이언트 사이드에서는 빈 배열로 초기화
        set({
          tabs: [],
          activeTabId: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
      set({ isLoading: false });
    }
  }
}));
