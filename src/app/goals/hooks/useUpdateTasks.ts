import { useCallback, useState, useEffect } from "react";
import { useAuth } from "@/app/AuthContext";
import { useTaskBatcher } from "./useTaskBatcher";
import { usePreventUnload } from "./usePreventUnload";

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
  duration?: number;
}

interface TaskUpdate {
  taskId: number;
  qty: number;
  time: number;
  timestamp: number;
}

const useUpdateTasks = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const { enablePreventUnload, disablePreventUnload } = usePreventUnload();

  const processBatchUpdates = useCallback(
    async (updates: TaskUpdate[]) => {
      console.log("[processBatchUpdates] Called", {
        username: user?.username,
        updatesCount: updates.length,
      });

      if (!user?.username || updates.length === 0) return;

      setNotification({
        message: "Saving changes...",
        type: "info",
        timestamp: Date.now(),
      });

      try {
        console.log("[processBatchUpdates] Sending request");
        const response = await fetch("/api/update/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: user.username,
            updates: updates,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        console.log("[processBatchUpdates] Request successful");
        setNotification({
          message: "Changes saved successfully",
          type: "success",
          timestamp: Date.now(),
          duration: 2000,
        });
        disablePreventUnload();
      } catch (error) {
        setNotification({
          message: `Failed to save: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          type: "error",
          timestamp: Date.now(),
          duration: 3000,
        });
        throw error;
      }
    },
    [user?.username, disablePreventUnload]
  );

  const { queueUpdate, isSaving, hasPendingChanges, forceSave } =
    useTaskBatcher(processBatchUpdates);

  useEffect(() => {
    if (hasPendingChanges) {
      const cleanup = enablePreventUnload();
      return () => cleanup();
    } else {
      disablePreventUnload();
    }
  }, [hasPendingChanges, enablePreventUnload, disablePreventUnload]);

  const updateTask = useCallback(
    (taskId: number, qty: number, time: number) => {
      queueUpdate(taskId, qty, time);
      if (!isSaving) {
        setNotification({
          message: "Unsaved changes...",
          type: "info",
          timestamp: Date.now(),
        });
      }
    },
    [queueUpdate, isSaving]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    updateTask,
    notification,
    clearNotification,
    isSaving,
    hasPendingChanges,
    forceSave,
  };
};

export default useUpdateTasks;
