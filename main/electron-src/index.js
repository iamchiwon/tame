"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const path_1 = require("path");
const url_1 = require("url");
// Packages
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_next_1 = __importDefault(require("electron-next"));
const webview_manager_1 = require("./webview-manager");
// Prepare the renderer once the app is ready
electron_1.app.on("ready", async () => {
    await (0, electron_next_1.default)("./renderer");
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, "preload.js"),
            webviewTag: true,
            webSecurity: false,
        },
    });
    const url = electron_is_dev_1.default
        ? "http://localhost:8000/"
        : (0, url_1.format)({
            pathname: (0, path_1.join)(__dirname, "../renderer/out/index.html"),
            protocol: "file:",
            slashes: true,
        });
    mainWindow.loadURL(url);
    // WebViewManager 초기화
    const webViewManager = new webview_manager_1.WebViewManager(mainWindow);
    // 웹뷰 등록 이벤트 처리
    electron_1.ipcMain.on("register-webview", (_event, tabId, url, _title) => {
        // webview의 webContents를 가져오는 방법은 복잡하므로
        // 실제 구현에서는 webview 요소에서 직접 호출해야 함
        console.log(`Registering webview for tab ${tabId}: ${url}`);
    });
    // 웹뷰 해제 이벤트 처리
    electron_1.ipcMain.on("unregister-webview", (_event, tabId) => {
        webViewManager.unregisterWebView(tabId);
    });
    // 앱 종료 시 정리
    electron_1.app.on("before-quit", () => {
        webViewManager.destroy();
    });
});
// Quit the app once all windows are closed
electron_1.app.on("window-all-closed", electron_1.app.quit);
// listen the channel `message` and resend the received message to the renderer process
electron_1.ipcMain.on("message", (event, message) => {
    console.log(message);
    setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
// Handle external link opening
electron_1.ipcMain.on("open-external", (_event, url) => {
    electron_1.shell.openExternal(url);
});
