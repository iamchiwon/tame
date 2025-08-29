export interface Tab {
  id: number;
  title: string;
  url: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  tabId: number;
  title: string;
  message?: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  tabId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  autoMarkAsRead: boolean;
  defaultViewMode: 'all' | 'grouped';
}

export interface TabStore {
  tabs: Tab[];
  activeTabId: number | null;
  isLoading: boolean;

  addTab: (tab: Omit<Tab, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeTab: (id: number) => Promise<void>;
  updateTab: (id: number, updates: Partial<Tab>) => Promise<void>;
  setActiveTab: (id: number) => void;
  reorderTabs: (orderMap: Map<number, number>) => Promise<void>;
  loadTabs: () => Promise<void>;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  viewMode: 'all' | 'grouped';
  filters: NotificationFilters;

  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markGroupAsRead: (tabId: number) => Promise<void>;
  setViewMode: (mode: 'all' | 'grouped') => void;
  setFilters: (filters: NotificationFilters) => void;
  loadNotifications: () => Promise<void>;
}

export interface SettingsStore {
  settings: AppSettings;

  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}
