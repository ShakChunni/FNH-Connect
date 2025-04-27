import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/app/AuthContext";

interface TaskAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null;
}

interface EditTaskPayload {
  id: number;
  name: string;
  type: string;
  measurementType: string; // Changed from enum to string
  targetType: string | null; // Changed from union type to string | null
  isActive?: boolean;
  assignments: TaskAssignment[];
}

interface EditTaskResponse {
  success: boolean;
  task?: {
    id: number;
    name: string;
    type: string;
    measurementType: string;
    targetType: string | null;
    isActive: boolean;
  };
  error?: string;
}

interface UseEditPreDefinedTasksResult {
  updateTask: (taskData: EditTaskPayload) => Promise<EditTaskResponse>;
  toggleTaskStatus: (
    taskId: number,
    isActive: boolean
  ) => Promise<EditTaskResponse>;
  isLoading: boolean;
  error: string | null;
}

export function useEditPreDefinedTasks(): UseEditPreDefinedTasksResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = useMemo(() => "/api/admin/pre-defined-tasks/update", []);

  const updateTask = useCallback(
    async (taskData: EditTaskPayload): Promise<EditTaskResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...taskData,
            actor: user?.username,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update task");
        }

        return {
          success: true,
          task: data.task,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, user?.username]
  );

  const toggleTaskStatus = useCallback(
    async (taskId: number, isActive: boolean): Promise<EditTaskResponse> => {
      return updateTask({
        id: taskId,
        name: "",
        type: "",
        measurementType: "BOTH",
        targetType: null,
        isActive,
        assignments: [],
      });
    },
    [updateTask]
  );

  return useMemo(
    () => ({
      updateTask,
      toggleTaskStatus,
      isLoading,
      error,
    }),
    [updateTask, toggleTaskStatus, isLoading, error]
  );
}

export default useEditPreDefinedTasks;
