import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaExpandAlt, FaCompressAlt } from "react-icons/fa";
import { TaskData, UserSummary } from "../AnalyticsTable";
import RenderTasksByCategory from "./RenderTasksByCategory";

interface TableRowProps {
  user: UserSummary;
  date: string;
  types: {
    predefined: { [type: string]: TaskData[] };
    adHoc: { [type: string]: TaskData[] };
  };
  expandedDates: { [key: string]: string[] };
  expandedTypes: {
    [username: string]: {
      [date: string]: {
        predefined: string[];
        adHoc: string[];
      };
    };
  };
  expandedAdHocTasks: {
    [username: string]: {
      [date: string]: {
        [taskId: number]: boolean;
      };
    };
  };
  handleDateClick: (username: string, date: string) => void;
  handleTypeClick: (
    username: string,
    date: string,
    type: string,
    category: "predefined" | "adHoc"
  ) => void;
  handleAdHocTaskClick: (
    username: string,
    date: string,
    taskId: number
  ) => void;
  animationVariants: any;
  calculateTotals: (tasks: TaskData[]) => {
    quantity: number;
    timeSpent: number;
    targetQuantity: number;
    targetTime: number;
  };
  convertMinutesToHours: (minutes: number) => string;
  handleExpandDateAll: (
    username: string,
    date: string,
    isExpanded: boolean
  ) => void;
  isDateFullyExpanded: (username: string, date: string) => boolean;
}

const TableRow: React.FC<TableRowProps> = ({
  user,
  date,
  types,
  expandedDates,
  expandedTypes,
  expandedAdHocTasks,
  handleDateClick,
  handleTypeClick,
  handleAdHocTaskClick,
  animationVariants,
  calculateTotals,
  convertMinutesToHours,
  handleExpandDateAll,
  isDateFullyExpanded,
}) => {
  const renderQuantityWithTarget = useCallback(
    (quantity: number, targetQuantity: number) => {
      if (targetQuantity === 0) {
        return `${quantity}`;
      }

      return (
        <div className="flex items-center gap-1">
          <span>{quantity}</span>
          <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-[9px] sm:text-[11px] whitespace-nowrap flex-shrink-0">
            {targetQuantity}
          </span>
        </div>
      );
    },
    []
  );

  const renderTimeWithTarget = useCallback(
    (timeSpent: number, targetTime: number) => {
      if (targetTime === 0) {
        return convertMinutesToHours(timeSpent);
      }

      return (
        <div className="flex items-center gap-1">
          <span>{convertMinutesToHours(timeSpent)}</span>
          <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-[9px] sm:text-[11px] whitespace-nowrap flex-shrink-0">
            {convertMinutesToHours(targetTime)}
          </span>
        </div>
      );
    },
    [convertMinutesToHours]
  );

  const getTaskDateRange = useCallback((tasks: TaskData[], taskId: number) => {
    const task = tasks.find((t) => t.taskId === taskId);

    if (!task) {
      return {
        startDate: "Unknown",
        endDate: "Unknown",
      };
    }

    const formatISODate = (dateString: string) => {
      if (!dateString) return "Unknown";

      const [datePart] = dateString.split("T");
      if (!datePart) return "Unknown";

      const [year, month, day] = datePart.split("-").map(Number);
      if (!year || !month || !day) return "Unknown";

      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const startDate = formatISODate(task.createdAt);
    const endDate = task.completed
      ? formatISODate(task.completionTime!)
      : "Ongoing";

    return {
      startDate,
      endDate,
    };
  }, []);

  const allTasks = useMemo(
    () => [
      ...Object.values(types.predefined || {}).flat(),
      ...Object.values(types.adHoc || {}).flat(),
    ],
    [types]
  );

  const dateTotals = useMemo(
    () => calculateTotals(allTasks),
    [allTasks, calculateTotals]
  );
  const handleExpandDateAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const isFullyExpanded = isDateFullyExpanded(user.username, date);
      const isDateExpanded = expandedDates[user.username]?.includes(date);

      // If fully expanded and we're collapsing, also collapse the date row
      if (isFullyExpanded) {
        // First collapse all inner content
        handleExpandDateAll(user.username, date, true);

        // Then collapse the date row if it's expanded
        if (isDateExpanded) {
          handleDateClick(user.username, date);
        }
      } else {
        // If not fully expanded, we need to ensure date is expanded first
        if (!isDateExpanded) {
          handleDateClick(user.username, date);
        }
        // Then expand all inner content
        handleExpandDateAll(user.username, date, false);
      }
    },
    [
      user.username,
      date,
      isDateFullyExpanded,
      expandedDates,
      handleExpandDateAll,
      handleDateClick,
    ]
  );

  return (
    <React.Fragment key={`${date}-${user.username}`}>
      <motion.tr
        className="bg-gray-50"
        variants={animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center justify-between">
          <span>{date}</span>
          <div className="flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                const isFullyExpanded = isDateFullyExpanded(
                  user.username,
                  date
                );

                if (isFullyExpanded) {
                  handleExpandDateAll(user.username, date, true);
                  if (expandedDates[user.username]?.includes(date)) {
                    handleDateClick(user.username, date);
                  }
                } else {
                  if (!expandedDates[user.username]?.includes(date)) {
                    handleDateClick(user.username, date);
                  }
                  handleExpandDateAll(user.username, date, false);
                }
              }}
              className="cursor-pointer relative group"
            >
              {isDateFullyExpanded(user.username, date) ? (
                <FaCompressAlt className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
              ) : (
                <FaExpandAlt className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#172554] rounded-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDateFullyExpanded(user.username, date)
                  ? "Collapse All"
                  : "Expand All"}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#172554] rotate-45"></div>
              </div>
            </span>

            <span
              onClick={(e) => {
                e.stopPropagation();
                handleDateClick(user.username, date);
              }}
              className="cursor-pointer relative group"
            >
              <FaChevronRight
                className={`inline-block h-4 w-4 transform transition-all duration-200 ease-out ${
                  expandedDates[user.username]?.includes(date)
                    ? "rotate-90"
                    : "rotate-0"
                }`}
              />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#172554] rounded-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                {expandedDates[user.username]?.includes(date)
                  ? "Hide Details"
                  : "Show Details"}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#172554] rotate-45"></div>
              </div>
            </span>
          </div>
        </td>
        <td colSpan={2}></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderQuantityWithTarget(
            dateTotals.quantity,
            dateTotals.targetQuantity
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderTimeWithTarget(dateTotals.timeSpent, dateTotals.targetTime)}
        </td>
      </motion.tr>
      <AnimatePresence>
        {expandedDates[user.username]?.includes(date) && (
          <>
            <RenderTasksByCategory
              category="predefined"
              label="Pre Defined Tasks"
              types={types}
              user={user}
              date={date}
              expandedTypes={expandedTypes}
              expandedAdHocTasks={expandedAdHocTasks}
              handleTypeClick={handleTypeClick}
              handleAdHocTaskClick={handleAdHocTaskClick}
              animationVariants={animationVariants}
              calculateTotals={calculateTotals}
              renderQuantityWithTarget={renderQuantityWithTarget}
              renderTimeWithTarget={renderTimeWithTarget}
              convertMinutesToHours={convertMinutesToHours}
              getTaskDateRange={getTaskDateRange}
            />
            <RenderTasksByCategory
              category="adHoc"
              label="Ad Hoc Tasks"
              types={types}
              user={user}
              date={date}
              expandedTypes={expandedTypes}
              expandedAdHocTasks={expandedAdHocTasks}
              handleTypeClick={handleTypeClick}
              handleAdHocTaskClick={handleAdHocTaskClick}
              animationVariants={animationVariants}
              calculateTotals={calculateTotals}
              renderQuantityWithTarget={renderQuantityWithTarget}
              renderTimeWithTarget={renderTimeWithTarget}
              convertMinutesToHours={convertMinutesToHours}
              getTaskDateRange={getTaskDateRange}
            />
          </>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
};

export default React.memo(TableRow);
