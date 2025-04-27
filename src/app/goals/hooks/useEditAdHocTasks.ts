import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

const useEditAdHocTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const editTask = async (
    id: number,
    name: string,
    type: string,
    note: string,
    meetingType: string | null
  ) => {
    if (!user?.username) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/update/adHocTask", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          type,
          notes: note,
          meetingType,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`);
      }

      setMessage("Task updated successfully");
      return data.task;
    } catch (error) {
      console.error("Error updating task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update task"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { editTask, loading, error, message };
};

export default useEditAdHocTasks;
