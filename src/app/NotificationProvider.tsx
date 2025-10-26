"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { NotificationContainer } from "@/components/notification/NotificationContainer";
import { useNotification } from "@/hooks/useNotification";

const NotificationContext = createContext<ReturnType<
  typeof useNotification
> | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notification = useNotification();

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
