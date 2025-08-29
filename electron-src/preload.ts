/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from "electron";
import { IpcRendererEvent } from "electron/main";

// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
contextBridge.exposeInMainWorld("electron", {
  sayHello: () => ipcRenderer.send("message", "hi from next"),
  receiveHello: (handler: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("message", handler),
  stopReceivingHello: (
    handler: (event: IpcRendererEvent, ...args: any[]) => void,
  ) => ipcRenderer.removeListener("message", handler),
  openExternal: (url: string) => ipcRenderer.send("open-external", url),

  // 웹뷰 관리 API
  registerWebView: (tabId: number, url: string, title: string) =>
    ipcRenderer.send("register-webview", tabId, url, title),
  unregisterWebView: (tabId: number) =>
    ipcRenderer.send("unregister-webview", tabId),

  // 알림 관련 API
  onNotificationAdded: (callback: (event: IpcRendererEvent, notification: any) => void) =>
    ipcRenderer.on("notification-added", callback),
  onTitleUpdated: (callback: (event: IpcRendererEvent, data: { tabId: number; title: string }) => void) =>
    ipcRenderer.on("title-updated", callback),
  onUrlUpdated: (callback: (event: IpcRendererEvent, data: { tabId: number; url: string }) => void) =>
    ipcRenderer.on("url-updated", callback),

  // 알림 전송 API (웹뷰 내부에서 사용)
  sendNotification: (notificationData: any) =>
    ipcRenderer.send("notification", notificationData),
});
