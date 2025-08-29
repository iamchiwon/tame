import React from "react";
import { Clock, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/lib/types";
import { useNotificationStore } from "@/store/notification-store";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onNavigate?: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onNavigate,
}) => {
  const { markAsRead } = useNotificationStore();

  const handleMarkAsRead = async () => {
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(notification);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "p-4 border-b border-gray-200 dark:border-gray-700 transition-colors",
        !notification.isRead && "bg-blue-50 dark:bg-blue-900/10"
      )}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          {notification.icon ? (
            <span className="text-lg">{notification.icon}</span>
          ) : (
            <span className="text-lg">🔔</span>
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                새
              </Badge>
            )}
          </div>

          {notification.body && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {notification.body}
            </p>
          )}

          {/* 태그 */}
          {notification.tag && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {notification.tag}
              </Badge>
            </div>
          )}

          {/* 하단 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>
                {formatTime(notification.timestamp || notification.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-7 px-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Check className="h-3 w-3 mr-1" />
                  읽음
                </Button>
              )}
              {onNavigate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigate}
                  className="h-7 px-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  보기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
