import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface TaskData {
  name: string;
  type: string;
  taskId: number;
  metrics: {
    completion: number;
    efficiency: number;
  };
  quantity: number;
  completed: boolean;
  resetType: string;
  targetMet: boolean;
  timeSpent: number;
  lastUpdated: string;
  completionTime: string | null;
  targetQuantity: number;
  targetTime?: number;
  targetType?: string | null;
  measurementType?: string;
  createdAt: string;
}

interface ChartTaskData {
  label: string;
  quantity: number;
  timeSpent: number;
  targetQuantity: number;
  targetTime: number;
  targetType: string | null;
  measurementType: string;
  taskId: number;
}

interface ChartDataStructure {
  predefinedTasks: ChartTaskData[];
  adHocTasks: ChartTaskData[];
}

interface DailyTaskSummary {
  id: number;
  userId: number;
  date: string;
  taskData: TaskData[];
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface CacheEntry {
  data: {
    data: DailyTaskSummary[];
    customOptions: any;
  };
  timestamp: number;
}

interface Filters {
  pic: string[];
  taskType: string[];
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
}

interface UserSummary {
  username: string;
  fullName: string;
  totalQuantity: number;
  totalTimeSpent: number;
  taskDetails: TaskData[];
}

const CACHE_DURATION = 5 * 60 * 1000;

const useFetchGoalsAnalytics = (filters: Filters, shouldFetch: boolean) => {
  const [userData, setUserData] = useState<UserSummary[]>([]);
  const [chartData, setChartData] = useState<ChartDataStructure>({
    predefinedTasks: [],
    adHocTasks: [],
  });
  const [customOptions, setCustomOptions] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const processChartData = useCallback(
    (userData: UserSummary[]): ChartDataStructure => {
      const predefinedTasksMap = new Map<string, ChartTaskData>();
      const adHocTasksMap = new Map<string, ChartTaskData>();

      userData.forEach((user) => {
        user.taskDetails.forEach((task) => {
          const isAdHoc = task.resetType === "continuous";
          let targetType = task.targetType || null;

          if ([1, 5, 9, 10, 244, 245].includes(task.taskId)) {
            targetType = "TIME";
          } else if ([2, 7].includes(task.taskId)) {
            targetType = "QUANTITY";
          }

          const targetTime = task.targetTime || 0;
          const measurementType = task.measurementType || "BOTH";

          if (isAdHoc) {
            if (!adHocTasksMap.has(task.type)) {
              adHocTasksMap.set(task.type, {
                taskId: task.taskId,
                label: task.type,
                quantity: 0,
                timeSpent: 0,
                targetQuantity: 0,
                targetTime: 0,
                targetType: null,
                measurementType: measurementType,
              });
            }
            const typeData = adHocTasksMap.get(task.type)!;
            typeData.quantity += task.quantity;
            typeData.timeSpent += task.timeSpent;
            typeData.targetQuantity += task.targetQuantity || 0;
            typeData.targetTime += targetTime;
            if (targetType) typeData.targetType = targetType;
            if (task.measurementType)
              typeData.measurementType = task.measurementType;
          } else {
            if (!predefinedTasksMap.has(task.name)) {
              predefinedTasksMap.set(task.name, {
                taskId: task.taskId,
                label: task.name,
                quantity: 0,
                timeSpent: 0,
                targetQuantity: 0,
                targetTime: 0,
                targetType: null,
                measurementType: measurementType,
              });
            }
            const nameData = predefinedTasksMap.get(task.name)!;
            nameData.quantity += task.quantity;
            nameData.timeSpent += task.timeSpent;
            nameData.targetQuantity += task.targetQuantity || 0;
            nameData.targetTime += targetTime;
            if (targetType) nameData.targetType = targetType;
            if (task.measurementType)
              nameData.measurementType = task.measurementType;
          }
        });
      });

      const processWithTaskIds = (
        taskMap: Map<string, ChartTaskData>
      ): ChartTaskData[] => {
        return Array.from(taskMap.values());
      };

      return {
        predefinedTasks: processWithTaskIds(predefinedTasksMap),
        adHocTasks: processWithTaskIds(adHocTasksMap),
      };
    },
    []
  );

  const groupDataByUser = useCallback(
    (data: DailyTaskSummary[]): UserSummary[] => {
      const userMap = new Map<number, UserSummary>();

      data.forEach((summary) => {
        const { userId, user, taskData } = summary;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            username: user.username,
            fullName: user.fullName,
            totalQuantity: 0,
            totalTimeSpent: 0,
            taskDetails: [],
          });
        }

        const userSummary = userMap.get(userId)!;
        taskData.forEach((task) => {
          userSummary.totalQuantity += task.quantity;
          userSummary.totalTimeSpent += task.timeSpent;
          userSummary.taskDetails.push(task);
        });
      });

      return Array.from(userMap.values());
    },
    []
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const cacheKey = JSON.stringify(filters);
    const cachedData = cache.current.get(cacheKey);
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      const groupedData = groupDataByUser(cachedData.data.data);
      setUserData(groupedData);
      setChartData(processChartData(groupedData));
      setCustomOptions(cachedData.data.customOptions);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/goals-analytics/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      const parsedResult = Array.isArray(result) ? result : [];
      const groupedData = groupDataByUser(parsedResult);
      const processedChartData = processChartData(groupedData);

      cache.current.set(cacheKey, {
        data: {
          data: parsedResult,
          customOptions: {},
        },
        timestamp: now,
      });

      setUserData(groupedData);
      setChartData(processedChartData);
      setCustomOptions({});
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters, groupDataByUser, processChartData]);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  useEffect(() => {
    if (!shouldFetch) return;
    fetchData();
  }, [shouldFetch, fetchData]);

  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, value] of cache.current.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);


  const returnValue = useMemo(
    () => ({
      data: userData,
      chartData,
      customOptions,
      isLoading,
      error,
      refetch: fetchData,
      clearCache,
    }),
    [
      userData,
      chartData,
      customOptions,
      isLoading,
      error,
      fetchData,
      clearCache,
    ]
  );
  return returnValue;
};

export default useFetchGoalsAnalytics;
