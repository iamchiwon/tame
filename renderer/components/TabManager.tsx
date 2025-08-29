import React from "react";
import { WebViewTab } from "./WebViewTab";
import { useTabStore } from "@/store/tab-store";
import { Tab } from "@/lib/types";

export const TabManager: React.FC = () => {
  const { tabs, activeTabId, updateTab } = useTabStore();

  const handleTitleChange = (id: number, title: string) => {
    updateTab(id, { title });
  };

  const handleUrlChange = (id: number, url: string) => {
    updateTab(id, { url });
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No tabs open</h2>
          <p className="text-sm">Add a new tab to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {tabs.map((tab) => (
        <WebViewTab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onTitleChange={handleTitleChange}
          onUrlChange={handleUrlChange}
        />
      ))}
    </div>
  );
};
