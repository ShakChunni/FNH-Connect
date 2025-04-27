import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt } from "react-icons/fa";
import { TaskData, UserSummary } from "../AnalyticsTable";

interface RenderAdHocTasksProps {
  task: TaskData;
  user: UserSummary;
  date: string;
  
  expandedAdHocTasks: {
    [username: string]: {
      [date: string]: {
        [taskId: number]: boolean;
      };
    };
  };
  handleAdHocTaskClick: (
    username: string,
    date: string,
    taskId: number
  ) => void;
  animationVariants: any;
  renderQuantityWithTarget: (
    quantity: number,
    targetQuantity: number
  ) => React.ReactNode;
  renderTimeWithTarget: (
    timeSpent: number,
    targetTime: number
  ) => React.ReactNode;
  convertMinutesToHours: (minutes: number) => string;
  getTaskDateRange: (
    tasks: TaskData[],
    taskId: number
  ) => { startDate: string; endDate: string };
}

const RenderAdHocTasks: React.FC<RenderAdHocTasksProps> = ({
  task,
  user,
  date,
  expandedAdHocTasks,
  handleAdHocTaskClick,
  animationVariants,
  renderQuantityWithTarget,
  renderTimeWithTarget,
  convertMinutesToHours,
  getTaskDateRange,
}) => {
  const isExpanded = expandedAdHocTasks[user.username]?.[date]?.[task.taskId];
  const dateRange = getTaskDateRange(user.taskDetails, task.taskId);
  const isCompleted = task.completed;

  const cumulativeTimeSpent = useMemo(() => {
    return user.taskDetails
      .filter((t) => t.taskId === task.taskId)
      .reduce((total, t) => total + t.timeSpent, 0);
  }, [user.taskDetails, task.taskId]);

  return (
    <React.Fragment key={`adhoc-${task.taskId}-${date}-${user.username}`}>
      <motion.tr
        className="bg-gray-200"
        variants={animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <td colSpan={2}></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{task.name}</span>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  isCompleted
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-yellow-100 text-yellow-900 border border-yellow-200"
                }`}
              >
                {isCompleted ? "COMPLETED" : "ONGOING"}
              </span>
            </div>
            <FaCalendarAlt
              className={`cursor-pointer h-4 w-4 transition-colors duration-200 ${
                isExpanded ? "text-blue-900" : "text-gray-400"
              }`}
              onClick={() =>
                handleAdHocTaskClick(user.username, date, task.taskId)
              }
            />
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderQuantityWithTarget(task.quantity, task.targetQuantity || 0)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderTimeWithTarget(task.timeSpent, task.targetTime || 0)}
        </td>
      </motion.tr>
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            className="bg-gray-100"
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <td colSpan={2}></td>
            <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div>
                  <span className="font-medium">Start:</span>{" "}
                  {dateRange.startDate}
                </div>
                <div>
                  <span className="font-medium">End:</span>{" "}
                  <span
                    className={
                      dateRange.endDate === "Ongoing"
                        ? "text-yellow-600 font-semibold"
                        : ""
                    }
                  >
                    {dateRange.endDate}
                  </span>
                </div>
              </div>
            </td>
            <td colSpan={1}></td>
            <td className="px-6 py-2 whitespace-nowrap text-xs">
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  <span className="font-bold text-blue-950">
                    {convertMinutesToHours(cumulativeTimeSpent)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    (Cumulative time spent)
                  </span>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
};

export default memo(RenderAdHocTasks);
