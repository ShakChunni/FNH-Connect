import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/app/AuthContext";

interface DeleteResponse {
  success: boolean;
  message?: string;
}

const useDeletePreDefinedTasks = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a memoized API endpoint
  const apiEndpoint = useMemo(() => "/api/admin/pre-defined-tasks/delete", []);

  // Use useCallback to memoize the deleteTask function
  const deleteTask = useCallback(
    async (taskId: number): Promise<DeleteResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            actor: user?.username,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to delete task");
        }

        setIsLoading(false);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, message: errorMessage };
      }
    },
    [apiEndpoint, user?.username]
  );

  // Memoize the return value
  return useMemo(
    () => ({
      deleteTask,
      isLoading,
      error,
    }),
    [deleteTask, isLoading, error]
  );
};

export default useDeletePreDefinedTasks;
