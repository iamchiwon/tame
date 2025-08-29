"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const electron_1 = require("electron");
// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
electron_1.contextBridge.exposeInMainWorld("electron", {
    sayHello: () => electron_1.ipcRenderer.send("message", "hi from next"),
    receiveHello: (handler) => electron_1.ipcRenderer.on("message", handler),
    stopReceivingHello: (handler) => electron_1.ipcRenderer.removeListener("message", handler),
    openExternal: (url) => electron_1.ipcRenderer.send("open-external", url),
    // 웹뷰 관리 API
    registerWebView: (tabId, url, title) => electron_1.ipcRenderer.send("register-webview", tabId, url, title),
    unregisterWebView: (tabId) => electron_1.ipcRenderer.send("unregister-webview", tabId),
    // 알림 관련 API
    onNotificationAdded: (callback) => electron_1.ipcRenderer.on("notification-added", callback),
    onTitleUpdated: (callback) => electron_1.ipcRenderer.on("title-updated", callback),
    onUrlUpdated: (callback) => electron_1.ipcRenderer.on("url-updated", callback),
    // 알림 전송 API (웹뷰 내부에서 사용)
    sendNotification: (notificationData) => electron_1.ipcRenderer.send("notification", notificationData),
});
