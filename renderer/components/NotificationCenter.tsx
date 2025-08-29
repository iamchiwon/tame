import React, { useState, useEffect } from "react";
import { Search, Filter, X, Check, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationGroup } from "./NotificationGroup";
import { Notification } from "@/lib/types";
import { useNotificationStore } from "@/store/notification-store";
import { useTabStore } from "@/store/tab-store";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">(
    "all"
  );
  const [filterService, setFilterService] = useState<string>("all");

  const {
    notifications,
    markAllAsRead,
    deleteAllNotifications,
    loadNotifications,
  } = useNotificationStore();
  const { tabs } = useTabStore();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // 필터링된 알림
  const filteredNotifications = notifications.filter((notification) => {
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        notification.title.toLowerCase().includes(searchLower) ||
        (notification.body &&
          notification.body.toLowerCase().includes(searchLower)) ||
        (notification.tag &&
          notification.tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // 상태 필터
    if (filterStatus === "unread" && notification.isRead) return false;
    if (filterStatus === "read" && !notification.isRead) return false;

    // 서비스 필터
    if (filterService !== "all") {
      const tab = tabs.find((t) => t.id === notification.tabId);
      if (!tab) return false;

      const serviceId = filterService;
      if (serviceId === "gmail" && !tab.url.includes("mail.google.com"))
        return false;
      if (serviceId === "linkedin" && !tab.url.includes("linkedin.com"))
        return false;
      if (serviceId === "slack" && !tab.url.includes("slack.com")) return false;
    }

    return true;
  });

  // 서비스별로 그룹화
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const tabId = notification.tabId;
      if (!groups[tabId]) {
        groups[tabId] = [];
      }
      groups[tabId].push(notification);
      return groups;
    },
    {} as Record<number, Notification[]>
  );

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const handleNavigate = (notification: Notification) => {
    if (onNavigate) {
      onNavigate(notification);
      onClose();
    }
  };

  const totalUnread = notifications.filter((n) => !n.isRead).length;
  const totalNotifications = notifications.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              알림 센터
            </h2>
            {totalUnread > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {totalUnread}개 새 알림
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={totalUnread === 0}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              모두 읽음
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              disabled={totalNotifications === 0}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              모두 삭제
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="알림 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value: "all" | "unread" | "read") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 알림</SelectItem>
                <SelectItem value="unread">읽지 않음</SelectItem>
                <SelectItem value="read">읽음</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 서비스</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedNotifications).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Archive className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">알림이 없습니다</h3>
              <p className="text-sm text-center">
                {searchTerm || filterStatus !== "all" || filterService !== "all"
                  ? "검색 조건에 맞는 알림이 없습니다."
                  : "아직 수집된 알림이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(
                ([tabId, notifications]) => (
                  <NotificationGroup
                    key={tabId}
                    tabId={parseInt(tabId)}
                    notifications={notifications}
                    onNavigate={handleNavigate}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
