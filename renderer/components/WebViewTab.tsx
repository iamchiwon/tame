import React, { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tab } from "@/lib/types";

interface WebViewTabProps {
  tab: Tab;
  isActive: boolean;
  onTitleChange: (id: number, title: string) => void;
  onUrlChange: (id: number, url: string) => void;
}

export const WebViewTab: React.FC<WebViewTabProps> = ({
  tab,
  isActive,
  onTitleChange,
  onUrlChange,
}) => {
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadStop = () => {
      setIsLoading(false);
    };

    const handlePageTitleUpdated = (event: any) => {
      const newTitle = event.title;
      if (newTitle && newTitle !== tab.title) {
        onTitleChange(tab.id, newTitle);
      }
    };

    const handleDidNavigate = (event: any) => {
      const newUrl = event.url;
      if (newUrl && newUrl !== tab.url) {
        onUrlChange(tab.id, newUrl);
      }
    };

    const handleDidNavigateInPage = (event: any) => {
      const newUrl = event.url;
      if (newUrl && newUrl !== tab.url) {
        onUrlChange(tab.id, newUrl);
      }
    };

    const updateNavigationState = () => {
      setCanGoBack((webview as any).canGoBack());
      setCanGoForward((webview as any).canGoForward());
    };

    // 웹뷰 등록
    const registerWebView = () => {
      try {
        ((window as any).electron as any).registerWebView(
          tab.id,
          tab.url,
          tab.title
        );
      } catch (error) {
        console.error("Failed to register webview:", error);
      }
    };

    // 웹뷰 해제
    const unregisterWebView = () => {
      try {
        ((window as any).electron as any).unregisterWebView(tab.id);
      } catch (error) {
        console.error("Failed to unregister webview:", error);
      }
    };

    webview.addEventListener("load-start", handleLoadStart);
    webview.addEventListener("load-stop", handleLoadStop);
    webview.addEventListener("page-title-updated", handlePageTitleUpdated);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    webview.addEventListener("did-navigate", updateNavigationState);
    webview.addEventListener("did-navigate-in-page", updateNavigationState);

    // 웹뷰 로드 완료 시 등록
    webview.addEventListener("did-finish-load", registerWebView);

    return () => {
      webview.removeEventListener("load-start", handleLoadStart);
      webview.removeEventListener("load-stop", handleLoadStop);
      webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener(
        "did-navigate-in-page",
        handleDidNavigateInPage
      );
      webview.removeEventListener("did-navigate", updateNavigationState);
      webview.removeEventListener(
        "did-navigate-in-page",
        updateNavigationState
      );
      webview.removeEventListener("did-finish-load", registerWebView);

      // 컴포넌트 언마운트 시 웹뷰 해제
      unregisterWebView();
    };
  }, [tab.id, tab.title, tab.url, onTitleChange, onUrlChange]);

  const handleRefresh = () => {
    (webviewRef.current as any)?.reload();
  };

  const handleGoBack = () => {
    (webviewRef.current as any)?.goBack();
  };

  const handleGoForward = () => {
    (webviewRef.current as any)?.goForward();
  };

  const handleOpenExternal = () => {
    if (webviewRef.current) {
      ((window as any).electron as any).openExternal(tab.url);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 웹뷰 툴바 */}
      <div className="flex items-center gap-1 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          disabled={!canGoBack}
          className="h-9 w-9 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
          ←
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="h-9 w-9 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
          →
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-9 w-9 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 mx-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">
            {tab.title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {tab.url}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenExternal}
          className="h-9 w-9 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* 웹뷰 컨테이너 */}
      <div className="flex-1 relative">
        <webview
          ref={webviewRef}
          src={tab.url}
          className="w-full h-full"
          webpreferences="contextIsolation=false, nodeIntegration=false"
          allowpopups={true}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                로딩 중...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
