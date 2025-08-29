import React from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabStore } from "@/store/tab-store";
import { Tab } from "@/lib/types";

interface TabBarProps {
  onAddTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ onAddTab }) => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();

  const handleTabSelect = (tabId: string) => {
    setActiveTab(parseInt(tabId));
  };

  const handleTabClose = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-between bg-background border-b px-4 py-2">
        <div className="text-sm text-muted-foreground">No tabs</div>
        <Button variant="ghost" size="sm" onClick={onAddTab}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-background border-b px-4 py-2">
      <Tabs
        value={activeTabId?.toString()}
        onValueChange={handleTabSelect}
        className="flex-1"
      >
        <TabsList className="h-8 bg-transparent border-0 p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id.toString()}
              className="flex items-center gap-2 px-3 py-1 h-7 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <span className="truncate max-w-32">{tab.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => handleTabClose(e, tab.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button variant="ghost" size="sm" onClick={onAddTab}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
