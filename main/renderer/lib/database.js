"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = exports.DatabaseManager = void 0;
// Electron 환경에서만 실행
let Database;
let path;
let app;
if (typeof window === 'undefined') {
    // 서버 사이드에서만 import
    Database = require('better-sqlite3');
    path = require('path');
    app = require('electron').app;
}
class DatabaseManager {
    db;
    constructor() {
        if (typeof window === 'undefined' && Database && path && app) {
            const dbPath = path.join(app.getPath('userData'), 'tame.db');
            this.db = new Database(dbPath);
            this.initSchema();
        }
    }
    initSchema() {
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
        body TEXT,
        icon TEXT,
        tag TEXT,
        data TEXT,
        timestamp TEXT,
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
    async getTabs() {
        const stmt = this.db.prepare(`
      SELECT id, title, url, order_index as orderIndex, 
             created_at as createdAt, updated_at as updatedAt
      FROM tabs 
      ORDER BY order_index
    `);
        return stmt.all();
    }
    async addTab(tab) {
        const stmt = this.db.prepare(`
      INSERT INTO tabs (title, url, order_index)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(tab.title, tab.url, tab.orderIndex);
        const newTab = await this.getTabById(result.lastInsertRowid);
        return newTab;
    }
    async updateTab(id, updates) {
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);
        values.push(id);
        const stmt = this.db.prepare(`
      UPDATE tabs 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        stmt.run(...values);
    }
    async deleteTab(id) {
        const stmt = this.db.prepare('DELETE FROM tabs WHERE id = ?');
        stmt.run(id);
    }
    async reorderTabs(orderMap) {
        const stmt = this.db.prepare('UPDATE tabs SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        orderMap.forEach((orderIndex, id) => {
            stmt.run(orderIndex, id);
        });
    }
    async getTabById(id) {
        const stmt = this.db.prepare(`
      SELECT id, title, url, order_index as orderIndex, 
             created_at as createdAt, updated_at as updatedAt
      FROM tabs 
      WHERE id = ?
    `);
        return stmt.get(id);
    }
    // 알림 관련 메서드
    async getNotifications(filters) {
        let query = `
      SELECT id, tab_id as tabId, title, message, url, is_read as isRead, created_at as createdAt
      FROM notifications 
      WHERE 1=1
    `;
        const params = [];
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
        return stmt.all(params);
    }
    async addNotification(notification) {
        const stmt = this.db.prepare(`
      INSERT INTO notifications (tab_id, title, message, url, is_read, body, icon, tag, data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(notification.tabId, notification.title, notification.message || '', notification.url || '', notification.isRead ? 1 : 0, notification.body || '', notification.icon || '', notification.tag || '', JSON.stringify(notification.data || {}), notification.timestamp || new Date().toISOString());
        const newNotification = await this.getNotificationById(result.lastInsertRowid);
        return newNotification;
    }
    async addNotificationFromData(notificationData) {
        const notification = {
            title: notificationData.title,
            message: notificationData.body || '',
            body: notificationData.body,
            icon: notificationData.icon,
            tag: notificationData.tag,
            data: notificationData.data,
            tabId: notificationData.tabId,
            url: '',
            timestamp: notificationData.timestamp,
            isRead: false
        };
        return this.addNotification(notification);
    }
    async markAsRead(id) {
        const stmt = this.db.prepare('UPDATE notifications SET is_read = TRUE WHERE id = ?');
        stmt.run(id);
    }
    async markGroupAsRead(tabId) {
        const stmt = this.db.prepare('UPDATE notifications SET is_read = TRUE WHERE tab_id = ?');
        stmt.run(tabId);
    }
    async markAllAsRead() {
        const stmt = this.db.prepare('UPDATE notifications SET is_read = TRUE');
        stmt.run();
    }
    async deleteNotifications(ids) {
        const placeholders = ids.map(() => '?').join(',');
        const stmt = this.db.prepare(`DELETE FROM notifications WHERE id IN (${placeholders})`);
        stmt.run(...ids);
    }
    async deleteAllNotifications() {
        const stmt = this.db.prepare('DELETE FROM notifications');
        stmt.run();
    }
    async getNotificationById(id) {
        const stmt = this.db.prepare(`
      SELECT id, tab_id as tabId, title, message, url, is_read as isRead, created_at as createdAt
      FROM notifications 
      WHERE id = ?
    `);
        return stmt.get(id);
    }
    // 설정 관련 메서드
    async getSetting(key) {
        const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
        const result = stmt.get(key);
        return result?.value || null;
    }
    async setSetting(key, value) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
        stmt.run(key, value);
    }
    // 데이터베이스 연결 종료
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}
exports.DatabaseManager = DatabaseManager;
// 싱글톤 인스턴스
let dbInstance = null;
const getDatabase = () => {
    if (!dbInstance && typeof window === 'undefined') {
        dbInstance = new DatabaseManager();
    }
    return dbInstance;
};
exports.getDatabase = getDatabase;
