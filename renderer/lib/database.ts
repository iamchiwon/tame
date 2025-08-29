import { Tab, Notification, NotificationFilters, AppSettings } from './types';

// Electron 환경에서만 실행
let Database: any;
let path: any;
let app: any;

if (typeof window === 'undefined') {
  // 서버 사이드에서만 import
  Database = require('better-sqlite3');
  path = require('path');
  app = require('electron').app;
}

export class DatabaseManager {
  private db: any;

  constructor() {
    if (typeof window === 'undefined' && Database && path && app) {
      const dbPath = path.join(app.getPath('userData'), 'tame.db');
      this.db = new Database(dbPath);
      this.initSchema();
    }
  }

  private initSchema(): void {
    // 탭 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 알림 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tab_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE CASCADE
      )
    `);

    // 설정 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notifications_tab_id ON notifications(tab_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_tabs_order_index ON tabs(order_index);
    `);
  }

  // 탭 관련 메서드
  async getTabs(): Promise<Tab[]> {
    const stmt = this.db.prepare(`
      SELECT id, title, url, order_index as orderIndex, 
             created_at as createdAt, updated_at as updatedAt
      FROM tabs 
      ORDER BY order_index
    `);
    return stmt.all() as Tab[];
  }

  async addTab(tab: Omit<Tab, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tab> {
    const stmt = this.db.prepare(`
      INSERT INTO tabs (title, url, order_index)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(tab.title, tab.url, tab.orderIndex);
    const newTab = await this.getTabById(result.lastInsertRowid as number);
    return newTab!;
  }

  async updateTab(id: number, updates: Partial<Tab>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE tabs 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(...values);
  }

  async deleteTab(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM tabs WHERE id = ?');
    stmt.run(id);
  }

  async reorderTabs(orderMap: Map<number, number>): Promise<void> {
    const stmt = this.db.prepare('UPDATE tabs SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

    orderMap.forEach((orderIndex, id) => {
      stmt.run(orderIndex, id);
    });
  }

  private async getTabById(id: number): Promise<Tab | null> {
    const stmt = this.db.prepare(`
      SELECT id, title, url, order_index as orderIndex, 
             created_at as createdAt, updated_at as updatedAt
      FROM tabs 
      WHERE id = ?
    `);
    return stmt.get(id) as Tab | null;
  }

  // 알림 관련 메서드
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    let query = `
      SELECT id, tab_id as tabId, title, message, url, is_read as isRead, created_at as createdAt
      FROM notifications 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.isRead !== undefined) {
      query += ` AND is_read = ?`;
      params.push(filters.isRead);
    }

    if (filters?.tabId) {
      query += ` AND tab_id = ?`;
      params.push(filters.tabId);
    }

    if (filters?.search) {
      query += ` AND (title LIKE ? OR message LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Notification[];
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const stmt = this.db.prepare(`
      INSERT INTO notifications (tab_id, title, message, url, is_read)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      notification.tabId,
      notification.title,
      notification.message,
      notification.url,
      notification.isRead
    );

    const newNotification = await this.getNotificationById(result.lastInsertRowid as number);
    return newNotification!;
  }

  async markAsRead(id: number): Promise<void> {
    const stmt = this.db.prepare('UPDATE notifications SET is_read = TRUE WHERE id = ?');
    stmt.run(id);
  }

  async markGroupAsRead(tabId: number): Promise<void> {
    const stmt = this.db.prepare('UPDATE notifications SET is_read = TRUE WHERE tab_id = ?');
    stmt.run(tabId);
  }

  private async getNotificationById(id: number): Promise<Notification | null> {
    const stmt = this.db.prepare(`
      SELECT id, tab_id as tabId, title, message, url, is_read as isRead, created_at as createdAt
      FROM notifications 
      WHERE id = ?
    `);
    return stmt.get(id) as Notification | null;
  }

  // 설정 관련 메서드
  async getSetting(key: string): Promise<string | null> {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | null;
    return result?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, value);
  }

  // 데이터베이스 연결 종료
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// 싱글톤 인스턴스
let dbInstance: DatabaseManager | null = null;

export const getDatabase = (): DatabaseManager => {
  if (!dbInstance && typeof window === 'undefined') {
    dbInstance = new DatabaseManager();
  }
  return dbInstance!;
};
