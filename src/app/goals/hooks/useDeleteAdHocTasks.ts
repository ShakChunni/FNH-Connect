import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

const useDeleteAdHocTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const deleteTask = async (id: number) => {
    if (!user?.username) return false; // Return false if no user

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/delete/adHocTask", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`);
      }

      setMessage("Task deleted successfully");
      return true; // Return true on successful deletion
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete task"
      );
      return false; // Return false on error
    } finally {
      setLoading(false);
    }
  };

  return { deleteTask, loading, error, message };
};

export default useDeleteAdHocTasks;
