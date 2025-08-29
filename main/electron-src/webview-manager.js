"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewManager = void 0;
const notification_handler_1 = require("./notification-handler");
class WebViewManager {
    webViews = new Map();
    mainWindow;
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }
    registerWebView(tabId, webContents, url, title) {
        // 기존 웹뷰가 있다면 정리
        this.unregisterWebView(tabId);
        // 알림 핸들러 생성
        const notificationHandler = new notification_handler_1.NotificationHandler(webContents, tabId);
        // 웹뷰 정보 저장
        const webViewInfo = {
            id: tabId,
            webContents,
            notificationHandler,
            url,
            title
        };
        this.webViews.set(tabId, webViewInfo);
        // 웹뷰 이벤트 리스너 등록
        this.setupWebViewEventListeners(tabId, webContents);
        console.log(`WebView registered for tab ${tabId}: ${url}`);
    }
    unregisterWebView(tabId) {
        const webViewInfo = this.webViews.get(tabId);
        if (webViewInfo) {
            // 알림 핸들러 정리
            webViewInfo.notificationHandler.destroy();
            // 웹뷰 정보 제거
            this.webViews.delete(tabId);
            console.log(`WebView unregistered for tab ${tabId}`);
        }
    }
    updateWebViewInfo(tabId, updates) {
        const webViewInfo = this.webViews.get(tabId);
        if (webViewInfo) {
            Object.assign(webViewInfo, updates);
            console.log(`WebView info updated for tab ${tabId}:`, updates);
        }
    }
    getWebViewInfo(tabId) {
        return this.webViews.get(tabId);
    }
    getAllWebViews() {
        return Array.from(this.webViews.values());
    }
    getWebViewByUrl(url) {
        return Array.from(this.webViews.values()).find(webView => webView.url.includes(url) || url.includes(webView.url));
    }
    setupWebViewEventListeners(tabId, webContents) {
        // 페이지 제목 변경 감지
        webContents.on('page-title-updated', (_event, title) => {
            this.updateWebViewInfo(tabId, { title });
            this.notifyRenderer('title-updated', { tabId, title });
        });
        // URL 변경 감지
        webContents.on('did-navigate', (_event, url) => {
            this.updateWebViewInfo(tabId, { url });
            this.notifyRenderer('url-updated', { tabId, url });
        });
        // 웹뷰 로드 완료
        webContents.on('did-finish-load', () => {
            this.notifyRenderer('webview-loaded', { tabId });
        });
        // 웹뷰 로드 실패
        webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
            console.error(`WebView load failed for tab ${tabId}:`, errorDescription);
            this.notifyRenderer('webview-load-failed', { tabId, errorCode, errorDescription });
        });
        // 웹뷰 크래시
        webContents.on('crashed', () => {
            console.error(`WebView crashed for tab ${tabId}`);
            this.notifyRenderer('webview-crashed', { tabId });
        });
    }
    notifyRenderer(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
    destroy() {
        // 모든 웹뷰 정리
        for (const [tabId, _webViewInfo] of this.webViews) {
            this.unregisterWebView(tabId);
        }
        this.webViews.clear();
        this.mainWindow = null;
    }
}
exports.WebViewManager = WebViewManager;
