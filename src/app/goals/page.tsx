"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import PredefinedTasks from "./components/PreDefinedTasks";
import AdHocTasks from "./components/AdHocTasks";
import useFetchTasks from "./hooks/useFetchTasks";
import SkeletonGoalsPage from "./components/SkeletonGoalsPage";

interface TaskData {
  id: number;
  name: string;
  type: string;
  qty: string;
  time: string;
  timeUnit: string;
  goal: number;
  notes?: string;
  meetingType?: string;
  historicalTimeSpent?: number;
  totalTimeSpent?: number;
  createdAt?: string;
}

const GoalsPage = () => {
  const { tasks, loading, error, refetch } = useFetchTasks();
  const [dailyTasks, setDailyTasks] = useState<TaskData[]>([]);
  const [adHocTasks, setAdHocTasks] = useState<TaskData[]>([]);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    const daily = tasks
      .filter((task) => task.isDailyReset)
      .map((task) => ({
        id: task.id,
        name: task.name,
        type: task.type,
        qty: task.currentQuantity.toString(),
        time: task.timeSpent.toString(),
        timeUnit: "hr",
        targetType: task.targetType,
        goal: task.targetQuantity || 0,
        measurementType: task.measurementType,
        targetQuantity: task.targetQuantity || 0,
        targetTime: task.targetTime || 0,
        completed: task.completed || false,
      }));

    const adHoc = tasks
      .filter((task) => !task.isTemplate)
      .map((task) => ({
        id: task.id,
        name: task.name,
        type: task.type,
        qty: task.currentQuantity.toString(),
        time: task.timeSpent.toString(),
        timeUnit: "hr",
        goal: task.targetQuantity,
        notes: task.notes,
        meetingType: task.meetingType,
        historicalTimeSpent: task.historicalTimeSpent || 0,
        totalTimeSpent: task.totalTimeSpent || 0,
        createdAt: task.createdAt,
      }));

    setDailyTasks(daily);
    setAdHocTasks(adHoc);
  }, [tasks]);

  const handleDailyTaskQtyChange = useCallback(
    (index: number, value: string) => {
      if (/^\d*$/.test(value)) {
        setDailyTasks((prev) =>
          prev.map((task, i) => (i === index ? { ...task, qty: value } : task))
        );
      }
    },
    []
  );

  const handleDailyTaskTimeChange = useCallback(
    (index: number, value: string) => {
      setDailyTasks((prev) =>
        prev.map((task, i) => (i === index ? { ...task, time: value } : task))
      );
    },
    []
  );

  const handleDailyTaskTimeUnitChange = useCallback((index: number) => {
    setDailyTasks((prev) =>
      prev.map((task, i) =>
        i === index
          ? { ...task, timeUnit: task.timeUnit === "hr" ? "min" : "hr" }
          : task
      )
    );
  }, []);

  const handleAdHocTaskQtyChange = useCallback(
    (index: number, value: string) => {
      if (/^\d*$/.test(value)) {
        setAdHocTasks((prev) =>
          prev.map((task, i) => (i === index ? { ...task, qty: value } : task))
        );
      }
    },
    []
  );

  const handleAdHocTaskTimeChange = useCallback(
    (index: number, value: string) => {
      setAdHocTasks((prev) =>
        prev.map((task, i) => (i === index ? { ...task, time: value } : task))
      );
    },
    []
  );

  const handleAdHocTaskTimeUnitChange = useCallback((index: number) => {
    setAdHocTasks((prev) =>
      prev.map((task, i) =>
        i === index
          ? { ...task, timeUnit: task.timeUnit === "hr" ? "min" : "hr" }
          : task
      )
    );
  }, []);

  const getProgressWidth = useMemo(
    () => (qty: string, goal: number) => {
      const numQty = parseInt(qty) || 0;
      return `${Math.min((numQty / goal) * 100, 100)}%`;
    },
    []
  );

  const getProgressColor = useMemo(
    () => (qty: string, goal: number) => {
      const numQty = parseInt(qty) || 0;
      return numQty >= goal ? "bg-green-500" : "bg-blue-500";
    },
    []
  );

  const getTextColor = useMemo(
    () => (qty: string, goal: number) => {
      const numQty = parseInt(qty) || 0;
      return numQty > goal / 2 ? "text-white" : "text-black";
    },
    []
  );

  if (loading) {
    return <SkeletonGoalsPage />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <PredefinedTasks
        dailyTasks={dailyTasks}
        handleDailyQtyChange={handleDailyTaskQtyChange}
        handleDailyTimeChange={handleDailyTaskTimeChange}
        handleDailyTimeUnitChange={handleDailyTaskTimeUnitChange}
        getProgressWidth={getProgressWidth}
        getProgressColor={getProgressColor}
        getTextColor={getTextColor}
      />
      <AdHocTasks
        adHocTasks={adHocTasks}
        handleDailyQtyChange={handleAdHocTaskQtyChange}
        handleDailyTimeChange={handleAdHocTaskTimeChange}
        handleDailyTimeUnitChange={handleAdHocTaskTimeUnitChange}
        getProgressWidth={getProgressWidth}
        getProgressColor={getProgressColor}
        getTextColor={getTextColor}
        onTaskAdded={refetch}
      />
    </div>
  );
};

export default React.memo(GoalsPage);
