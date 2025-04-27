import { useState, useEffect, useCallback, useMemo } from "react";

// Updated interfaces to match the API response structure
export interface TaskAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null;
  isDailyReset: boolean;
  isWeeklyReset: boolean;
  startDate: string;
  endDate: string | null;
  isContinuous: boolean;
  user: {
    id: number;
    username: string;
    fullName: string | null;
  };
}

export interface PreDefinedTask {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  sortOrder: number | null; // Added sortOrder field
  measurementType: string; // Added measurementType field
  targetType: string | null; // Added targetType field
  taskAssignments: TaskAssignment[];
}

// Simplified interface for UI components
export interface SimplifiedTaskAssignment {
  userId: number;
  username: string;
  fullName: string | null;
  targetQuantity: number | null;
  targetTime: number | null;
}

// Simplified task interface for UI components
export interface SimplifiedTask {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  sortOrder: number | null; // Added sortOrder field
  measurementType: string; // Added measurementType field
  targetType: string | null; // Added targetType field
  assignments: SimplifiedTaskAssignment[];
}

interface UseFetchPreDefinedTasksResult {
  tasks: SimplifiedTask[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  tasksByType: Record<string, SimplifiedTask[]>;
  activeTasksCount: number;
  tasksWithAssignments: SimplifiedTask[];
  rawData: PreDefinedTask[]; // Original data for advanced use cases
}

export function useFetchPreDefinedTasks(): UseFetchPreDefinedTasksResult {
  const [rawData, setRawData] = useState<PreDefinedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/pre-defined-tasks/fetch");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Error fetching pre-defined tasks: ${response.status}`
        );
      }

      const data = await response.json();
      setRawData(data.tasks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      console.error("Error fetching pre-defined tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Transform raw data to simplified format for UI
  const tasks = useMemo(() => {
    return rawData
      .map((task) => ({
        id: task.id,
        name: task.name,
        type: task.type,
        isActive: task.isActive,
        sortOrder: task.sortOrder, // Include sortOrder in the transformed data
        measurementType: task.measurementType, // Include measurementType
        targetType: task.targetType, // Include targetType
        assignments: task.taskAssignments.map((assignment) => ({
          userId: assignment.userId,
          username: assignment.user.username,
          fullName: assignment.user.fullName,
          targetQuantity: assignment.targetQuantity,
          targetTime: assignment.targetTime,
        })),
      }))
      .sort((a, b) => {
        if (a.sortOrder !== null && b.sortOrder !== null) {
          return a.sortOrder - b.sortOrder;
        } else if (a.sortOrder !== null) {
          return -1; // a comes first
        } else if (b.sortOrder !== null) {
          return 1; // b comes first
        }
        return a.id - b.id;
      });
  }, [rawData]);

  console.log(tasks);
  // Derive task statistics with memoization
  const tasksByType = useMemo(() => {
    return tasks.reduce<Record<string, SimplifiedTask[]>>((acc, task) => {
      const type = task.type || "Other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const activeTasksCount = useMemo(() => {
    return tasks.filter((task) => task.isActive).length;
  }, [tasks]);

  // Get tasks that have at least one assignment
  const tasksWithAssignments = useMemo(() => {
    return tasks.filter(
      (task) => task.assignments && task.assignments.length > 0
    );
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    tasksByType,
    activeTasksCount,
    tasksWithAssignments,
    rawData,
  };
}

export default useFetchPreDefinedTasks;
