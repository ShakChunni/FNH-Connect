import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/app/AuthContext";

interface TaskData {
  id: number;
  name: string;
  type: string;
  sortOrder: number | null;
  measurementType: "QUANTITY_ONLY" | "TIME_ONLY" | "BOTH" | "COMPLETION_ONLY"; // Add this
  targetType: string | null; // Add this
  targetQuantity: number;
  targetTime: number; // Add this
  currentQuantity: number;
  timeSpent: number;
  historicalTimeSpent: number;
  totalTimeSpent: number;
  isDailyReset: boolean;
  isWeeklyReset: boolean;
  isContinuous: boolean;
  isTemplate: boolean;
  isActive: boolean;
  lastReset: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  meetingType?: string;
}

interface TasksResponse {
  tasks: TaskData[];
  error?: string;
}

const useFetchTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user?.username) {
      setTasks([]);
      setError("No user logged in");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/fetch/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: user.username }),
      });

      const data: TasksResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`);
      }

      // Format and validate task data
      const formattedTasks = data.tasks.map((task) => ({
        ...task,
        sortOrder: task.sortOrder || null,
        timeSpent: task.timeSpent || 0,
        historicalTimeSpent: task.historicalTimeSpent || 0,
        totalTimeSpent: task.totalTimeSpent || 0,
        lastReset: task.lastReset || new Date().toISOString(),
        notes: task.notes || "",
        meetingType: task.meetingType || "",
      }));


      // Sort the tasks based on sortOrder first, then by id
      const sortedTasks = [...formattedTasks].sort((a, b) => {
        // If both have sortOrder, compare them
        if (a.sortOrder !== null && b.sortOrder !== null) {
          return a.sortOrder - b.sortOrder;
        }

        // Tasks with sortOrder come before tasks without sortOrder
        if (a.sortOrder !== null && b.sortOrder === null) {
          return -1;
        }

        if (a.sortOrder === null && b.sortOrder !== null) {
          return 1;
        }

        // If neither has sortOrder, compare by id
        return a.id - b.id;
      });

      setTasks(sortedTasks);
      setError(null);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch tasks"
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTimeDisplay = useCallback((task: TaskData) => {
    const currentTime = task.timeSpent;
    const historicalTime = task.historicalTimeSpent;
    const totalTime = task.totalTimeSpent;

    if (!task.isTemplate && task.isActive && historicalTime > 0) {
      return {
        current: `${currentTime}m`,
        historical: `${historicalTime}m`,
        total: `${totalTime}m`,
      };
    }

    return {
      current: `${currentTime}m`,
      historical: null,
      total: null,
    };
  }, []);

  // Sort tasks by sortOrder/id whenever the tasks array changes
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // If both have sortOrder, compare them
      if (a.sortOrder !== null && b.sortOrder !== null) {
        return a.sortOrder - b.sortOrder;
      }

      // Tasks with sortOrder come before tasks without sortOrder
      if (a.sortOrder !== null && b.sortOrder === null) {
        return -1;
      }

      if (a.sortOrder === null && b.sortOrder !== null) {
        return 1;
      }

      // If neither has sortOrder, compare by id
      return a.id - b.id;
    });
  }, [tasks]);

  return {
    tasks: sortedTasks, // Return the sorted tasks
    loading,
    error,
    refetch: fetchTasks,
    getTimeDisplay,
  };
};

export default useFetchTasks;
