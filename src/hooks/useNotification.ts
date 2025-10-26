import { useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "info" | "loading";

export interface NotificationState {
  id: number;
  message: string;
  type: NotificationType;
  timestamp: number;
}

let notificationId = 0;

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType = "info") => {
      const id = ++notificationId;
      const timestamp = Date.now();

      setNotifications((prev) => {
        // Remove loading notifications of the same type if showing success/error
        if (type === "success" || type === "error") {
          return [
            ...prev.filter((n) => n.type !== "loading"),
            { id, message, type, timestamp },
          ];
        }
        return [...prev, { id, message, type, timestamp }];
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
