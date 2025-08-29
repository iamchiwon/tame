# Tame 기술 명세서

## 🏗️ 아키텍처 개요

### 전체 구조

```
Tame App
├── Electron Main Process (electron-src/)
│   ├── index.ts - 메인 프로세스 진입점
│   ├── notification-handler.ts - 알림 수집
│   ├── webview-manager.ts - 웹뷰 관리
│   └── deep-link-handler.ts - 딥링킹 처리
├── Next.js Renderer Process (renderer/)
│   ├── components/ - UI 컴포넌트
│   ├── lib/ - 유틸리티 및 서비스
│   ├── store/ - 상태 관리
│   └── pages/ - 페이지 컴포넌트
└── Shared
    ├── types/ - 공통 타입 정의
    └── constants/ - 상수 정의
```

---

## 🗄️ 데이터베이스 설계

### SQLite 스키마

```sql
-- 탭 구성 저장
CREATE TABLE tabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 알림 데이터
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tab_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

-- 앱 설정
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_notifications_tab_id ON notifications(tab_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_tabs_order_index ON tabs(order_index);
```

### 데이터베이스 접근 패턴

```typescript
// renderer/lib/database.ts
export class Database {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(app.getPath("userData"), "tame.db"));
    this.initSchema();
  }

  private initSchema(): void {
    // 스키마 초기화
  }

  // 탭 관련 메서드
  async getTabs(): Promise<Tab[]>;
  async addTab(tab: Omit<Tab, "id">): Promise<Tab>;
  async updateTab(id: number, updates: Partial<Tab>): Promise<void>;
  async deleteTab(id: number): Promise<void>;
  async reorderTabs(orderMap: Map<number, number>): Promise<void>;

  // 알림 관련 메서드
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<Notification[]>;
  async addNotification(
    notification: Omit<Notification, "id">
  ): Promise<Notification>;
  async markAsRead(id: number): Promise<void>;
  async markGroupAsRead(tabId: number): Promise<void>;

  // 설정 관련 메서드
  async getSetting(key: string): Promise<string | null>;
  async setSetting(key: string, value: string): Promise<void>;
}
```

---

## 🔄 상태 관리 (Zustand)

### 탭 상태 관리

```typescript
// renderer/store/tab-store.ts
interface TabState {
  tabs: Tab[];
  activeTabId: number | null;
  isLoading: boolean;

  // Actions
  addTab: (tab: Omit<Tab, "id">) => Promise<void>;
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
    const newTab = await tabService.addTab(tab);
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  // ... 기타 액션들
}));
```

### 알림 상태 관리

```typescript
// renderer/store/notification-store.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  viewMode: "all" | "grouped";
  filters: NotificationFilters;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markGroupAsRead: (tabId: number) => Promise<void>;
  setViewMode: (mode: "all" | "grouped") => void;
  setFilters: (filters: NotificationFilters) => void;
  loadNotifications: () => Promise<void>;
}
```

---

## 🖥️ 웹뷰 관리 시스템

### Electron 메인 프로세스

```typescript
// electron-src/webview-manager.ts
export class WebViewManager {
  private webViews: Map<number, BrowserView> = new Map();
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  createWebView(tabId: number, url: string): BrowserView {
    const webView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        partition: `persist:tab-${tabId}`, // 탭별 독립 세션
      },
    });

    webView.webContents.loadURL(url);
    this.setupWebViewListeners(webView, tabId);
    this.webViews.set(tabId, webView);

    return webView;
  }

  private setupWebViewListeners(webView: BrowserView, tabId: number): void {
    // 페이지 제목 변경 감지
    webView.webContents.on("page-title-updated", (event, title) => {
      this.handleTitleUpdate(tabId, title);
    });

    // 알림 요청 가로채기
    webView.webContents.on("notification-request", (event, notification) => {
      this.handleNotification(tabId, notification);
    });
  }

  private handleTitleUpdate(tabId: number, title: string): void {
    // 탭 제목 업데이트 및 알림 생성
    ipcMain.emit("tab-title-updated", { tabId, title });
  }

  private handleNotification(tabId: number, notification: any): void {
    // 알림 데이터베이스에 저장
    ipcMain.emit("notification-received", { tabId, notification });
  }
}
```

### 알림 수집 시스템

```typescript
// electron-src/notification-handler.ts
export class NotificationHandler {
  private db: Database;

  constructor() {
    this.db = new Database();
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    ipcMain.on("notification-received", async (event, data) => {
      const { tabId, notification } = data;

      // 알림 데이터베이스에 저장
      const savedNotification = await this.db.addNotification({
        tabId,
        title: notification.title,
        message: notification.body,
        url: notification.url || "",
        isRead: false,
      });

      // 렌더러 프로세스에 알림 전송
      event.sender.send("notification-added", savedNotification);
    });
  }
}
```

---

## 🔗 딥링킹 시스템

### URL 스키마 처리

```typescript
// electron-src/deep-link-handler.ts
export class DeepLinkHandler {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupUrlHandler();
  }

  private setupUrlHandler(): void {
    // macOS
    app.on("open-url", (event, url) => {
      this.handleDeepLink(url);
    });

    // Windows
    app.on("second-instance", (event, commandLine) => {
      const url = commandLine.find((arg) => arg.startsWith("tame://"));
      if (url) {
        this.handleDeepLink(url);
      }
    });
  }

  private handleDeepLink(url: string): void {
    const urlObj = new URL(url);
    const notificationId = urlObj.searchParams.get("notification");
    const tabId = urlObj.searchParams.get("tab");

    if (notificationId && tabId) {
      // 해당 탭으로 이동하고 알림 위치로 스크롤
      this.mainWindow.webContents.send("navigate-to-notification", {
        tabId: parseInt(tabId),
        notificationId: parseInt(notificationId),
      });
    }
  }
}
```

### 렌더러 프로세스 네비게이션

```typescript
// renderer/lib/navigation-service.ts
export class NavigationService {
  private tabStore: typeof useTabStore;

  constructor() {
    this.tabStore = useTabStore.getState();
    this.setupIpcListeners();
  }

  private setupIpcListeners(): void {
    ipcRenderer.on("navigate-to-notification", (event, data) => {
      const { tabId, notificationId } = data;

      // 탭 활성화
      this.tabStore.setActiveTab(tabId);

      // 알림 위치로 스크롤
      this.scrollToNotification(notificationId);
    });
  }

  private scrollToNotification(notificationId: number): void {
    // DOM에서 알림 요소 찾기 및 스크롤
    const element = document.querySelector(
      `[data-notification-id="${notificationId}"]`
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      element.classList.add("highlight");
      setTimeout(() => element.classList.remove("highlight"), 2000);
    }
  }
}
```

---

## 🎨 UI 컴포넌트 구조

### 탭 바 컴포넌트

```typescript
// renderer/components/TabBar.tsx
interface TabBarProps {
  tabs: Tab[];
  activeTabId: number | null;
  onTabSelect: (id: number) => void;
  onTabClose: (id: number) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
}) => {
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tabs" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex bg-gray-100 border-b"
          >
            {tabs.map((tab, index) => (
              <Draggable
                key={tab.id}
                draggableId={tab.id.toString()}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`tab-item ${
                      activeTabId === tab.id ? "active" : ""
                    }`}
                    onClick={() => onTabSelect(tab.id)}
                  >
                    <span>{tab.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### 알림 센터 컴포넌트

```typescript
// renderer/components/NotificationCenter.tsx
interface NotificationCenterProps {
  notifications: Notification[];
  viewMode: "all" | "grouped";
  onViewModeChange: (mode: "all" | "grouped") => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: number) => void;
  onMarkGroupAsRead: (tabId: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  viewMode,
  onViewModeChange,
  onNotificationClick,
  onMarkAsRead,
  onMarkGroupAsRead,
}) => {
  const groupedNotifications = useMemo(() => {
    if (viewMode === "grouped") {
      return groupBy(notifications, "tabId");
    }
    return null;
  }, [notifications, viewMode]);

  return (
    <div className="notification-center">
      <div className="header">
        <h2>Notifications</h2>
        <div className="view-mode-toggle">
          <button
            className={viewMode === "all" ? "active" : ""}
            onClick={() => onViewModeChange("all")}
          >
            All
          </button>
          <button
            className={viewMode === "grouped" ? "active" : ""}
            onClick={() => onViewModeChange("grouped")}
          >
            Grouped
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {viewMode === "all"
          ? notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => onNotificationClick(notification)}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
              />
            ))
          : Object.entries(groupedNotifications).map(
              ([tabId, groupNotifications]) => (
                <NotificationGroup
                  key={tabId}
                  tabId={parseInt(tabId)}
                  notifications={groupNotifications}
                  onNotificationClick={onNotificationClick}
                  onMarkAsRead={onMarkAsRead}
                  onMarkGroupAsRead={() => onMarkGroupAsRead(parseInt(tabId))}
                />
              )
            )}
      </div>
    </div>
  );
};
```

---

## 🔧 성능 최적화 전략

### 웹뷰 메모리 관리

```typescript
// 웹뷰 비활성화 시 메모리 해제
export class WebViewManager {
  private inactiveWebViews: Set<number> = new Set();

  setTabInactive(tabId: number): void {
    const webView = this.webViews.get(tabId);
    if (webView) {
      // 웹뷰를 숨기고 메모리 사용량 줄이기
      webView.webContents.setBackgroundThrottling(true);
      this.inactiveWebViews.add(tabId);
    }
  }

  setTabActive(tabId: number): void {
    const webView = this.webViews.get(tabId);
    if (webView) {
      // 웹뷰 활성화
      webView.webContents.setBackgroundThrottling(false);
      this.inactiveWebViews.delete(tabId);
    }
  }
}
```

### 데이터베이스 최적화

```typescript
// 인덱스 활용 및 쿼리 최적화
export class Database {
  async getNotificationsWithPagination(
    page: number = 1,
    limit: number = 50,
    filters?: NotificationFilters
  ): Promise<{ notifications: Notification[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM notifications 
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

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const notifications = this.db.prepare(query).all(params);
    const total = this.db
      .prepare("SELECT COUNT(*) as count FROM notifications")
      .get().count;

    return { notifications, total };
  }
}
```

---

## 🛡️ 보안 고려사항

### Electron 보안 설정

```typescript
// electron-src/index.ts
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // CSP 헤더 설정
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
          ],
        },
      });
    }
  );
};
```

### 데이터 보호

```typescript
// 사용자 데이터 경로 활용
import { app } from "electron";
import path from "path";

const getUserDataPath = (): string => {
  return path.join(app.getPath("userData"), "tame.db");
};

// 데이터베이스 파일 권한 설정
const ensureSecureDatabase = (): void => {
  const dbPath = getUserDataPath();
  fs.chmodSync(dbPath, 0o600); // 소유자만 읽기/쓰기 가능
};
```

---

## 📊 모니터링 및 로깅

### 성능 모니터링

```typescript
// renderer/lib/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
    };
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // 메트릭이 너무 많아지면 오래된 것 제거
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift();
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }
}
```

### 에러 로깅

```typescript
// renderer/lib/error-logger.ts
export class ErrorLogger {
  private logPath: string;

  constructor() {
    this.logPath = path.join(app.getPath("userData"), "error.log");
  }

  logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${context || "Unknown"}: ${
      error.message
    }\n${error.stack}\n\n`;

    fs.appendFileSync(this.logPath, logEntry);
  }

  getRecentErrors(limit: number = 50): string[] {
    try {
      const content = fs.readFileSync(this.logPath, "utf8");
      return content.split("\n\n").slice(-limit);
    } catch {
      return [];
    }
  }
}
```

---

## 🎨 UI 컴포넌트 라이브러리

### shadcn/ui 컴포넌트 활용

```typescript
// renderer/components/ui/button.tsx
import { Button } from "@/components/ui/button";
import { Plus, X, Settings, Bell } from "lucide-react";

// 탭 추가 버튼
<Button variant="ghost" size="sm">
  <Plus className="h-4 w-4" />
  Add Tab
</Button>

// 알림 센터 버튼
<Button variant="outline" size="sm">
  <Bell className="h-4 w-4" />
  <span className="ml-2">{unreadCount}</span>
</Button>
```

### Tailwind CSS 유틸리티 클래스

```typescript
// 반응형 디자인
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 컴포넌트들 */}
</div>

// 다크 모드 지원
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* 컨텐츠 */}
</div>

// 애니메이션
<div className="transition-all duration-200 hover:scale-105">
  {/* 호버 효과 */}
</div>
```

### Lucide 아이콘 활용

```typescript
import { 
  Bell, 
  Search, 
  Settings, 
  Plus, 
  X, 
  Archive, 
  Filter,
  Clock,
  Check,
  AlertCircle
} from "lucide-react";

// 알림 상태별 아이콘
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <Bell className="h-4 w-4 text-blue-500" />;
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'info':
      return <Clock className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};
```

### 컴포넌트 구조 예시

```typescript
// renderer/components/NotificationItem.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onClick: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClick
}) => {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      notification.isRead ? 'opacity-60' : 'opacity-100'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{notification.title}</span>
          </div>
          <div className="flex items-center space-x-1">
            {!notification.isRead && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {formatTime(notification.createdAt)}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => onClick(notification)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

_이 기술 명세서는 개발 과정에서 지속적으로 업데이트됩니다._
