import { useState, useCallback } from "react";
import { useNotificationContext } from "@/app/NotificationProvider";

export type NotificationType = "success" | "error" | "info" | "loading";

export interface NotificationState {
  id: number;
  message: string;
  type: NotificationType;
  timestamp: number;
}

let notificationId = 0;
const MAX_VISIBLE_NOTIFICATIONS = 4;

export interface NotificationHookReturn {
  notifications: NotificationState[];
  showNotification: (message: string, type?: NotificationType) => number;
  hideNotification: (id: number) => void;
  clearAll: () => void;
}

export function useNotificationState(): NotificationHookReturn {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType = "info") => {
      const id = ++notificationId;
      const timestamp = Date.now();

      setNotifications((prev) => {
        // Remove loading notifications of the same type if showing success/error
        const next =
          type === "success" || type === "error"
            ? [
                ...prev.filter((n) => n.type !== "loading"),
                { id, message, type, timestamp },
              ]
            : [...prev, { id, message, type, timestamp }];
        // Keep the stack short so toasts never cover the page
        return next.slice(-MAX_VISIBLE_NOTIFICATIONS);
      });

      return id;
    },
    []
  );

  const hideNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
  };
}

export function useNotification(): NotificationHookReturn {
  return useNotificationContext();
}
