import { WebContents } from 'electron';
import { getDatabase } from '../renderer/lib/database';

export interface NotificationData {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  tabId: number;
  timestamp: string;
  isRead: boolean;
}

export class NotificationHandler {
  private webContents: WebContents;
  private tabId: number;

  constructor(webContents: WebContents, tabId: number) {
    this.webContents = webContents;
    this.tabId = tabId;
    this.setupNotificationInterception();
  }

  private setupNotificationInterception() {
    // Notification API 가로채기
    this.webContents.executeJavaScript(`
      const originalNotification = window.Notification;
      
      window.Notification = function(title, options = {}) {
        // 알림 데이터를 메인 프로세스로 전송
        window.electronAPI.sendNotification({
          title,
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          data: options.data,
          timestamp: new Date().toISOString()
        });
        
        // 원래 Notification API 호출
        return new originalNotification(title, options);
      };
      
      // Notification 생성자 속성들 복사
      Object.setPrototypeOf(window.Notification, originalNotification);
      window.Notification.prototype = originalNotification.prototype;
      window.Notification.permission = originalNotification.permission;
      window.Notification.requestPermission = originalNotification.requestPermission;
    `);

    // 알림 이벤트 리스너 등록
    this.webContents.on('ipc-message', (_event, channel, data) => {
      if (channel === 'notification') {
        this.handleNotification(data);
      }
    });
  }

  private async handleNotification(notificationData: any) {
    try {
      const db = getDatabase();
      const notification: NotificationData = {
        id: this.generateNotificationId(),
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon,
        tag: notificationData.tag,
        data: notificationData.data,
        tabId: this.tabId,
        timestamp: notificationData.timestamp,
        isRead: false
      };

      await db.addNotification(notification);

      // 렌더러 프로세스에 알림 추가 알림
      this.webContents.send('notification-added', notification);

      console.log('Notification captured:', notification);
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy() {
    // 정리 작업
    this.webContents = null as any;
  }
}
