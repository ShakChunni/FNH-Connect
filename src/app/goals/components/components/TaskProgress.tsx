import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskData } from "../PreDefinedTasks";
import { FaClock, FaClipboardList } from "react-icons/fa";

interface TaskProgressProps {
  task: TaskData & {
    measurementType?:
      | "QUANTITY_ONLY"
      | "TIME_ONLY"
      | "BOTH"
      | "COMPLETION_ONLY";
    targetType?: string | null;
    targetQuantity?: number;
    targetTime?: number;
    totalTimeSpent?: number;
    completed?: boolean;
  };
  getProgressWidth: (qty: string, goal: number) => string;
  getProgressColor: (qty: string, goal: number) => string;
  getTextColor: (qty: string, goal: number) => string;
}

const TaskProgress: React.FC<TaskProgressProps> = ({
  task,
  getProgressWidth,
  getProgressColor,
  getTextColor,
}) => {
  const isTimeTarget = task.targetType === "TIME";
  const isQuantityTarget = task.targetType === "QUANTITY";
  const isNullTarget = task.targetType === null;

  const currentValue = isTimeTarget
    ? task.time?.toString() || "0"
    : task.qty?.toString() || "0";

  const targetValue = isTimeTarget
    ? task.targetTime || 0
    : (isQuantityTarget ? task.targetQuantity : task.goal) || 0;

  const formatTimeDisplay = (minutes: number) => {
    if (minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
    return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
  };

  const currentDisplay = isNullTarget
    ? ""
    : isTimeTarget
    ? formatTimeDisplay(parseInt(currentValue))
    : currentValue;

  const targetDisplay = isNullTarget
    ? "N/A"
    : isTimeTarget
    ? formatTimeDisplay(targetValue)
    : targetValue.toString();

  const getColorClass = (current: number, target: number) => {
    if (isNullTarget) return { text: "text-gray-400", bg: "bg-gray-400" };
    if (target === 0) return { text: "text-gray-500", bg: "bg-gray-500" };

    const percentage = (current / target) * 100;

    if (percentage >= 100) {
      return { text: "text-green-600", bg: "bg-green-600" };
    }
    if (percentage >= 80) {
      return { text: "text-blue-600", bg: "bg-blue-600" };
    }
    if (percentage == 0) {
      return { text: "text-yellow-600", bg: "bg-yellow-600" };
    }
    return { text: "text-red-600", bg: "bg-red-600" };
  };

  const currentNum = parseInt(currentValue);
  const colorClasses = getColorClass(currentNum, targetValue);

  const iconColor = colorClasses.text;
  const progressColor = colorClasses.bg;
  const textColor = colorClasses.text;

  // Calculate progress width as percentage
  const getProgressPercentage = (current: number, target: number): string => {
    if (isNullTarget) return "100%"; // Full width for null target type
    if (target === 0) return "100%"; // Full width for empty targets
    const percentage = (current / target) * 100;
    const formattedPercentage = Math.min(100, percentage).toFixed(2);
    return formattedPercentage.endsWith(".00")
      ? parseInt(formattedPercentage).toString() + "%"
      : formattedPercentage + "%";
  };

  const progressWidth = getProgressPercentage(currentNum, targetValue);

  return (
    <div className="xl:w-[25%] rounded-xl bg-white h-16 p-4 flex flex-col justify-center shadow-md border border-gray-50">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center">
            {isTimeTarget ? (
              <FaClock className={`${iconColor} text-sm`} />
            ) : (
              <FaClipboardList className={`${iconColor} text-sm`} />
            )}
          </div>
          <span
            className={`text-xs font-medium ${textColor} whitespace-nowrap`}
          >
            {currentDisplay} {!isNullTarget && "/"} {targetDisplay}
          </span>
        </div>
        <span className={`text-xs font-medium ${textColor}`}>
          {!isNullTarget ? progressWidth : "N/A"}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <AnimatePresence>
          <motion.div
            className={`${progressColor} h-2 rounded-full relative`}
            style={{ width: progressWidth }}
            initial={{ width: 0 }}
            animate={{ width: progressWidth }}
            exit={{ width: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {(isTimeTarget || isNullTarget) && (
              <div className="absolute top-0 left-0 w-full h-full">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, rgba(255,255,255,.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.3) 50%, rgba(255,255,255,.3) 75%, transparent 75%, transparent)",
                    backgroundSize: "8px 8px",
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskProgress;
