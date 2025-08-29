// Native
import { join } from "path";
import { format } from "url";

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, shell } from "electron";
import isDev from "electron-is-dev";
import prepareNext from "electron-next";
import { WebViewManager } from "./webview-manager";

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
      webviewTag: true,
      webSecurity: false,
    },
  });

  const url = isDev
    ? "http://localhost:8000/"
    : format({
      pathname: join(__dirname, "../renderer/out/index.html"),
      protocol: "file:",
      slashes: true,
    });

  mainWindow.loadURL(url);

  // WebViewManager 초기화
  const webViewManager = new WebViewManager(mainWindow);

  // 웹뷰 등록 이벤트 처리
  ipcMain.on("register-webview", (_event, tabId: number, url: string, _title: string) => {
    // webview의 webContents를 가져오는 방법은 복잡하므로
    // 실제 구현에서는 webview 요소에서 직접 호출해야 함
    console.log(`Registering webview for tab ${tabId}: ${url}`);
  });

  // 웹뷰 해제 이벤트 처리
  ipcMain.on("unregister-webview", (_event, tabId: number) => {
    webViewManager.unregisterWebView(tabId);
  });

  // 앱 종료 시 정리
  app.on("before-quit", () => {
    webViewManager.destroy();
  });
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});

// Handle external link opening
ipcMain.on("open-external", (_event: IpcMainEvent, url: string) => {
  shell.openExternal(url);
});
