import { create } from 'zustand';
import { Notification, NotificationFilters } from '@/lib/types';
import { getDatabase } from '@/lib/database';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  viewMode: 'all' | 'grouped';
  filters: NotificationFilters;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markGroupAsRead: (tabId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: (ids: number[]) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  setViewMode: (mode: 'all' | 'grouped') => void;
  setFilters: (filters: NotificationFilters) => void;
  loadNotifications: () => Promise<void>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  viewMode: 'all',
  filters: {},

  addNotification: (notification) => {
    set(state => {
      const newNotifications = [notification, ...state.notifications];
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;

      return {
        notifications: newNotifications,
        unreadCount: newUnreadCount
      };
    });
  },

  markAsRead: async (id) => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.markAsRead(id);
      }

      set(state => {
        const updatedNotifications = state.notifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        );

        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.isRead).length
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markGroupAsRead: async (tabId) => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.markGroupAsRead(tabId);
      }

      set(state => {
        const updatedNotifications = state.notifications.map(notification =>
          notification.tabId === tabId ? { ...notification, isRead: true } : notification
        );

        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.isRead).length
        };
      });
    } catch (error) {
      console.error('Failed to mark group as read:', error);
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setFilters: (filters) => {
    set({ filters });
  },

  loadNotifications: async () => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        const { filters } = get();
        const notifications = await db.getNotifications(filters);

        set({
          notifications,
          unreadCount: notifications.filter(n => !n.isRead).length
        });
      } else {
        // 클라이언트 사이드에서는 빈 배열로 초기화
        set({
          notifications: [],
          unreadCount: 0
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0
    });
  },

  deleteNotifications: async (ids: number[]) => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.deleteNotifications(ids);
      }

      set(state => {
        const updatedNotifications = state.notifications.filter(
          notification => !ids.includes(notification.id)
        );

        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.isRead).length
        };
      });
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.markAllAsRead();
      }

      set(state => {
        const updatedNotifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));

        return {
          notifications: updatedNotifications,
          unreadCount: 0
        };
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteAllNotifications: async () => {
    try {
      if (typeof window === 'undefined') {
        const db = getDatabase();
        await db.deleteAllNotifications();
      }

      set({
        notifications: [],
        unreadCount: 0
      });
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }
}));
