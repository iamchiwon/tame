import React, { useState } from "react";
import { Plus, Settings, Bell, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTabStore } from "@/store/tab-store";
import { useNotificationStore } from "@/store/notification-store";
import { defaultSites, Site } from "@/lib/site-list";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./NotificationCenter";

interface SidebarProps {
  onAddTab: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddTab }) => {
  const { tabs, activeTabId, setActiveTab } = useTabStore();
  const { unreadCount } = useNotificationStore();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState(false);

  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId);
  };

  const getSiteInfo = (url: string): Site | undefined => {
    return defaultSites.find((site) =>
      url.includes(site.url.split("//")[1]?.split("/")[0])
    );
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Tame
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white relative"
              onClick={() => setIsNotificationCenterOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 앱 추가 버튼 */}
        <Button
          onClick={onAddTab}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
        >
          <Plus className="h-4 w-4 mr-2" />앱 추가
        </Button>
      </div>

      {/* 탭 목록 */}
      <div className="flex-1 overflow-y-auto">
        {tabs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              앱을 추가해보세요
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              위의 "앱 추가" 버튼을 클릭하여 첫 번째 앱을 추가하세요
            </p>
          </div>
        ) : (
          <div className="p-3">
            {tabs.map((tab) => {
              const siteInfo = getSiteInfo(tab.url);
              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2",
                    activeTabId === tab.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                  )}
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-lg">
                    {siteInfo?.icon || "🌐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {siteInfo?.name || tab.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {siteInfo?.description || tab.url}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 알림 센터 */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNavigate={(notification) => {
          // 해당 탭으로 이동
          setActiveTab(notification.tabId);
        }}
      />
    </div>
  );
};
