import React from "react";
import Notification from "./Notification";
import { NotificationState } from "@/hooks/useNotification";

interface NotificationContainerProps {
  notifications: NotificationState[];
  onClose: (id: number) => void;
}

export function NotificationContainer({
  notifications,
  onClose,
}: NotificationContainerProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-4 sm:left-auto sm:right-4 z-999999 flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification
            message={notification.message}
            type={notification.type}
            timestamp={notification.timestamp}
            onClose={() => onClose(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
