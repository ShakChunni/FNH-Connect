import { useState, useCallback } from "react";
import { useAuth } from "@/app/AuthContext";

interface TaskAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null; // Add this field
}
interface CreateTaskPayload {
  name: string;
  type: string;
  measurementType: string; // Add measurementType
  targetType: string | null; // Add targetType
  assignments: TaskAssignment[];
  notes?: string;
}

interface CreateTaskResponse {
  success: boolean;
  task?: {
    id: number;
    name: string;
    type: string;
    measurementType: string; // Add measurementType
    targetType: string | null; // Add targetType
    isActive: boolean;
  };
  error?: string;
}

interface UseCreatePreDefinedTasksResult {
  createTask: (taskData: CreateTaskPayload) => Promise<CreateTaskResponse>;
  isLoading: boolean;
  error: string | null;
}

export function useCreatePreDefinedTasks(): UseCreatePreDefinedTasksResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(
    async (taskData: CreateTaskPayload): Promise<CreateTaskResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/pre-defined-tasks/add", {
          method: "POST",
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
          throw new Error(data.message || "Failed to create task");
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
    [user?.username]
  );

  return {
    createTask,
    isLoading,
    error,
  };
}

export default useCreatePreDefinedTasks;
