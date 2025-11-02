"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { NotificationContainer } from "@/components/notification/NotificationContainer";
import {
  useNotificationState,
  NotificationHookReturn,
} from "@/hooks/useNotification";

const NotificationContext = createContext<NotificationHookReturn | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notification = useNotificationState();

  return (
    <NotificationContext.Provider value={notification}>
      {children}
      <NotificationContainer
        notifications={notification.notifications}
        onClose={notification.hideNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
}
