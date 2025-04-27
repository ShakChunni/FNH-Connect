import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

const useCreateAdHocTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const createTask = async (
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
      const response = await fetch("/api/add/adHocTask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

      setMessage("Task created successfully");
      return data.task;
    } catch (error) {
      console.error("Error creating task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create task"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createTask, loading, error, message };
};

export default useCreateAdHocTasks;
