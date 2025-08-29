import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "./NotificationItem";
import { Notification } from "@/lib/types";
import { useNotificationStore } from "@/store/notification-store";
import { useTabStore } from "@/store/tab-store";
import { defaultSites } from "@/lib/site-list";
import { cn } from "@/lib/utils";

interface NotificationGroupProps {
  tabId: number;
  notifications: Notification[];
  onNavigate?: (notification: Notification) => void;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({
  tabId,
  notifications,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { markGroupAsRead, deleteNotifications } = useNotificationStore();
  const { tabs } = useTabStore();

  const tab = tabs.find((t) => t.id === tabId);
  const siteInfo = tab
    ? defaultSites.find((site) =>
        tab.url.includes(site.url.split("//")[1]?.split("/")[0])
      )
    : null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalCount = notifications.length;

  const handleMarkAllAsRead = async () => {
    try {
      await markGroupAsRead(tabId);
    } catch (error) {
      console.error("Failed to mark group as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const notificationIds = notifications.map((n) => n.id);
      await deleteNotifications(notificationIds);
    } catch (error) {
      console.error("Failed to delete notifications:", error);
    }
  };

  const handleNavigate = (notification: Notification) => {
    if (onNavigate) {
      onNavigate(notification);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 그룹 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-sm">{siteInfo?.icon || "🌐"}</span>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                {siteInfo?.name || tab?.title || "알 수 없는 서비스"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {siteInfo?.description || tab?.url}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {unreadCount}/{totalCount}
          </Badge>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 px-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <Check className="h-3 w-3 mr-1" />
                모두 읽음
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              모두 삭제
            </Button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
