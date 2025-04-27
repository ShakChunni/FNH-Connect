import { useCallback, useState } from "react";
import { useAuth } from "@/app/AuthContext";

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
  duration?: number;
}

const useCompleteAdHocTasks = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [isCompleting, setIsCompleting] = useState(false);

  const completeTask = useCallback(
    async (taskId: number) => {
      if (!user?.username) return;

      setNotification({
        message: "Completing task...",
        type: "info",
        timestamp: Date.now(),
      });
      setIsCompleting(true);

      try {
        const response = await fetch(`/api/complete/adhoc-task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            taskId,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setNotification({
          message: "Task completed successfully",
          type: "success",
          timestamp: Date.now(),
          duration: 2000,
        });
        return data;
      } catch (error) {
        setNotification({
          message: `Failed to complete task: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          type: "error",
          timestamp: Date.now(),
          duration: 3000,
        });
        console.error("Failed to complete task:", error);
        throw error;
      } finally {
        setIsCompleting(false);
      }
    },
    [user?.username]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    completeTask,
    notification,
    clearNotification,
    isCompleting,
  };
};

export default useCompleteAdHocTasks;
