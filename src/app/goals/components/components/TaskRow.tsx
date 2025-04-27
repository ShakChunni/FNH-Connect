import React, { useMemo, useCallback } from "react";
import TaskInput from "./TaskInput";
import TaskProgress from "./TaskProgress";
import { TaskData } from "../PreDefinedTasks";
import { FaInfoCircle, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface TaskRowProps {
  task: TaskData & {
    historicalTimeSpent?: number;
    totalTimeSpent?: number;
    measurementType?:
      | "QUANTITY_ONLY"
      | "TIME_ONLY"
      | "BOTH"
      | "COMPLETION_ONLY";
    targetType?: string | null;
    targetQuantity?: number;
    targetTime?: number;
    completed?: boolean;
    createdAt?: string;
  };
  index: number;
  isMobile: boolean;
  isAdHoc?: boolean;
  customAction?: React.ReactNode;
  handleInputChange: (
    task: TaskData,
    index: number,
    field: "qty" | "time",
    value: string
  ) => void;
  handleDailyTimeUnitChange: (index: number) => void;
  updateTask: (id: number, qty: number, time: number) => void;
  getProgressWidth: (qty: string, goal: number) => string;
  getProgressColor: (qty: string, goal: number) => string;
  getTextColor: (qty: string, goal: number) => string;
  onCompleteTask?: (taskId: number) => void;
  onEditClick?: (task: TaskData) => void;
  onDeleteClick?: (taskId: number) => void;
}

const taskDescriptions: { [key: string]: string } = {
  "Cold Calls (MY)":
    "Number of successful direct phone calls where the recipient in Malaysia answered and engaged in conversation.",
  "Interested Prospects (MY)":
    "Number of leads in Malaysia who have expressed interest in our services and are open to exploring potential collaboration.",
  "WhatsApp Messages (MY)":
    "Number of WhatsApp messages successfully sent and received by potential clients in Malaysia.",
  "Cold Emails (MY)":
    "Number of cold emails successfully delivered to clients in Malaysia.",
  "Cold Calls (SG)":
    "Number of successful direct phone calls where the recipient in Singapore answered and engaged in conversation.",
  "Interested Prospects (SG)":
    "Number of leads in Singapore who have expressed interest in our services and are open to exploring potential collaboration.",
  "WhatsApp Messages (SG)":
    "Number of WhatsApp messages successfully sent and received by potential clients in Singapore.",
  "Cold Emails (SG)":
    "Number of cold emails successfully delivered to clients in Singapore.",
  "Shopee/Lazada/Instagram Messages":
    "Number of direct messages sent to potential clients via Shopee, Lazada, or Instagram.",
  "LinkedIn Messages":
    "Number of message replies to potential clients on LinkedIn.",
  "Follow-up (MY)":
    "Number of follow-ups with previous leads in Malaysia to assess continued interest in our services.",
  "Follow-up (SG)":
    "Number of follow-ups with previous leads in Singapore  to assess continued interest in our services.",
  "Book Meetings":
    "Number of confirmed meetings scheduled with potential clients.",
};

const TaskRow: React.FC<TaskRowProps> = React.memo(
  ({
    task,
    index,
    isMobile,
    isAdHoc,
    customAction,
    handleInputChange,
    handleDailyTimeUnitChange,
    updateTask,
    getProgressWidth,
    getProgressColor,
    getTextColor,
    onCompleteTask,
    onEditClick,
    onDeleteClick,
  }) => {
    const containerClasses = useMemo(
      () =>
        `flex flex-col ${
          isMobile
            ? "space-y-2"
            : "xl:flex-row space-y-2 xl:space-y-0 xl:space-x-4"
        } py-2 ${isMobile ? "border-b border-gray-300 pb-4 mb-4" : ""} w-full`,
      [isMobile]
    );

    const typeAndNameClasses = useMemo(
      () => ({
        base: "rounded-xl bg-[#fff] h-16 p-4 flex items-center justify-center cursor-not-allowed shadow-md border border-gray-50 text-gray-600 text-xs xl:text-sm",
        type: "xl:w-[15%] font-bold",
        name: "xl:w-[35%] font-medium relative",
        qty: "w-[10%]",
        time: "w-[15%]",
        target: "w-[30%]",
      }),
      []
    );

    // Format short date (just month day, year)
    const formatShortDate = useCallback((dateString: string) => {
      try {
        const date = new Date(dateString);
        const month = date.toLocaleString("default", { month: "short" });
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();

        return `${month} ${day}, ${year}`;
      } catch (error) {
        console.error("Date parsing error:", error);
        return "Invalid date";
      }
    }, []);

    // Format full date with time for tooltip
    const formatFullDateTime = useCallback((dateString: string) => {
      try {
        const date = new Date(dateString);
        // Manual conversion from UTC to local time (UTC+8)
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        const month = date.toLocaleString("default", { month: "short" });
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();

        return `${month} ${day}, ${year} at ${hour12}:${minutes
          .toString()
          .padStart(2, "0")} ${ampm}`;
      } catch (error) {
        console.error("Date parsing error:", error);
        return "Invalid date";
      }
    }, []);

    const handleEditClick = useCallback(() => {
      if (onEditClick) onEditClick(task);
    }, [onEditClick, task]);

    const handleDeleteClick = useCallback(() => {
      if (onDeleteClick) onDeleteClick(task.id);
    }, [onDeleteClick, task.id]);

    return (
      <div className={containerClasses}>
        <div
          className={`${typeAndNameClasses.base} ${typeAndNameClasses.type} flex flex-col`}
        >
          <span className="text-gray-800">{task.type}</span>
          {isAdHoc && task.createdAt && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span
                className="text-2xs text-gray-400 cursor-pointer hover:text-gray-700"
                data-tooltip-id={`time-tooltip-${task.id}`}
              >
                {formatShortDate(task.createdAt)}
              </span>
              <ReactTooltip
                id={`time-tooltip-${task.id}`}
                content={formatFullDateTime(task.createdAt)}
                place="top"
                style={{
                  borderRadius: "8px",
                  backgroundColor: "rgb(55 65 81)",
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                }}
              />
            </div>
          )}
        </div>

        {/* Rest of the component remains unchanged */}
        <div
          className={`${typeAndNameClasses.base} ${typeAndNameClasses.name} justify-between`}
          onClick={handleEditClick}
        >
          <div className="flex items-center w-full justify-start">
            <span className="text-gray-800">{task.name}</span>
            {!isAdHoc && (
              <FaInfoCircle
                data-tooltip-id={`tooltip-${task.id}`}
                className="text-gray-600 cursor-pointer ml-2"
              />
            )}
            {isAdHoc && (
              <span className="ml-2 px-2 py-0.5 rounded-2xl bg-orange-500 text-white text-2xs whitespace-nowrap">
                IN PROGRESS
              </span>
            )}
          </div>
          {!isAdHoc && (
            <ReactTooltip
              id={`tooltip-${task.id}`}
              content={taskDescriptions[task.name]}
              place="top"
              style={{
                borderRadius: "16px",
                backgroundColor: "rgb(55 65 81)",
                padding: "8px 12px",
                maxWidth: "32rem",
                zIndex: 50,
              }}
            />
          )}
        </div>

        <TaskInput
          task={{
            ...task,
            ...(isAdHoc && {
              historicalTimeSpent: task.historicalTimeSpent,
              totalTimeSpent: task.totalTimeSpent,
            }),
          }}
          index={index}
          isMobile={isMobile}
          handleInputChange={handleInputChange}
          handleDailyTimeUnitChange={handleDailyTimeUnitChange}
          updateTask={updateTask}
          isAdHoc={isAdHoc}
        />

        {!isAdHoc && (
          <TaskProgress
            task={task}
            getProgressWidth={getProgressWidth}
            getProgressColor={getProgressColor}
            getTextColor={getTextColor}
          />
        )}

        {isAdHoc && (
          <div className="xl:w-[25%] flex items-center h-auto xl:h-16 bg-transparent">
            <div className="flex justify-center items-center w-full">
              <div className="flex space-x-3">
                <button
                  className="rounded-full bg-green-700 text-white p-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-green-800"
                  onClick={() => onCompleteTask && onCompleteTask(task.id)}
                  data-tooltip-id={`complete-tooltip-${task.id}`}
                >
                  <FaCheck className="w-5 h-5" />
                </button>
                <ReactTooltip
                  id={`complete-tooltip-${task.id}`}
                  content="Mark as complete"
                  place="top"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "rgb(55 65 81)",
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                  }}
                />

                <button
                  className="rounded-full bg-blue-900 text-white p-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-blue-950"
                  onClick={handleEditClick}
                  data-tooltip-id={`edit-tooltip-${task.id}`}
                >
                  <FaEdit className="w-5 h-5" />
                </button>
                <ReactTooltip
                  id={`edit-tooltip-${task.id}`}
                  content="Edit task"
                  place="top"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "rgb(55 65 81)",
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                  }}
                />

                <button
                  className="rounded-full bg-red-700 text-white p-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-red-800"
                  onClick={handleDeleteClick}
                  data-tooltip-id={`delete-tooltip-${task.id}`}
                >
                  <FaTrash className="w-5 h-5" />
                </button>
                <ReactTooltip
                  id={`delete-tooltip-${task.id}`}
                  content="Delete task"
                  place="top"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "rgb(55 65 81)",
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TaskRow.displayName = "TaskRow";

export default TaskRow;
