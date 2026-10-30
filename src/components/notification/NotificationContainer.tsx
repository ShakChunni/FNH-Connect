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
    // Top centre: bottom-right would sit on top of modal Save buttons while an error is showing.
    <div
      aria-live="polite"
      className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-4 z-999999 flex flex-col items-stretch sm:items-center gap-2 pointer-events-none"
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
