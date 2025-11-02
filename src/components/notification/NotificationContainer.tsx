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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:right-6 md:bottom-8 md:right-8">
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
