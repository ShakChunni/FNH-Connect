import React, { useCallback, useState } from "react";
import { useMediaQuery } from "react-responsive";
import useUpdateTasks from "../hooks/useUpdateTasks";
import TaskRow from "./components/TaskRow";
import Notification from "./components/Notification";

export interface TaskData {
  id: number;
  name: string;
  type: string;
  qty: string;
  time: string;
  timeUnit: string;
  goal: number;
  measurementType?: "QUANTITY_ONLY" | "TIME_ONLY" | "BOTH" | "COMPLETION_ONLY";
  targetQuantity?: number;
  taskType?: string;
  targetTime?: number;
}

interface PredefinedTasksProps {
  dailyTasks: TaskData[];
  handleDailyQtyChange: (index: number, value: string) => void;
  handleDailyTimeChange: (index: number, value: string) => void;
  handleDailyTimeUnitChange: (index: number) => void;
  getProgressWidth: (qty: string, goal: number) => string;
  getProgressColor: (qty: string, goal: number) => string;
  getTextColor: (qty: string, goal: number) => string;
}

const PredefinedTasks: React.FC<PredefinedTasksProps> = ({
  dailyTasks,
  handleDailyQtyChange,
  handleDailyTimeChange,
  handleDailyTimeUnitChange,
  getProgressWidth,
  getProgressColor,
  getTextColor,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 1280px)" });
  const { updateTask, notification, clearNotification } = useUpdateTasks();

  const handleInputChange = useCallback(
    (task: TaskData, index: number, field: "qty" | "time", value: string) => {
      // Update local state first
      if (field === "qty") {
        handleDailyQtyChange(index, value);
      } else {
        handleDailyTimeChange(index, value);
      }

      // Don't trigger immediate update - let TaskInput handle it
    },
    [handleDailyQtyChange, handleDailyTimeChange]
  );

  const customSortOrder = [
    "Cold Calls (MY)",
    "WhatsApp Messages (MY)",
    "Cold Emails (MY)",
    "Interested Prospects (MY)",
    "Cold Calls (SG)",
    "WhatsApp Messages (SG)",
    "Cold Emails (SG)",
    "Interested Prospects (SG)",
    "Shopee/Lazada/Instagram Messages",
    "LinkedIn Messages",
    "Follow-up with Previous Leads",
    "Follow-up with High Priority Leads",
    "Book Meetings",
  ];

  const customSort = (a: TaskData, b: TaskData) => {
    const indexA = customSortOrder.indexOf(a.name);
    const indexB = customSortOrder.indexOf(b.name);
    return indexA - indexB;
  };

  return (
    <div className="mb-8 px-4 xl:px-0 py-4">
      <div className="py-6 px-2 xl:px-0">
        <div className="px-4 lg:px-12 mx-auto">
          <div className="bg-[#F4F8FC] rounded-2xl p-8 shadow-md">
            <h2 className="text-lg xl:text-2xl font-bold mb-8 text-blue-900">
              Daily Pre-Defined Tasks
            </h2>
            <div className="space-y-4">
              {/* Column Headers */}
              <div className="hidden xl:flex text-center w-full space-x-2">
                <div className="w-[15%] font-semibold text-sm xl:text-base">
                  Type
                </div>
                <div className="w-[35%] font-semibold text-sm xl:text-base">
                  Name
                </div>
                <div className="w-[10%] font-semibold text-sm xl:text-base">
                  Qty
                </div>
                <div className="w-[15%] font-semibold text-sm xl:text-base">
                  Time Taken
                </div>
                <div className="w-[25%] font-semibold text-sm xl:text-base">
                  Target
                </div>
              </div>

              {/* Task Rows */}
              {[...dailyTasks].map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={dailyTasks.findIndex((t) => t.id === task.id)}
                  isMobile={isMobile}
                  handleInputChange={handleInputChange}
                  handleDailyTimeUnitChange={handleDailyTimeUnitChange}
                  updateTask={updateTask}
                  getProgressWidth={getProgressWidth}
                  getProgressColor={getProgressColor}
                  getTextColor={getTextColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </div>
  );
};

export default React.memo(PredefinedTasks);
