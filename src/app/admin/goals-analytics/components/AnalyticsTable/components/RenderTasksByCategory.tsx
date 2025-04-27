import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight } from "react-icons/fa";
import { TaskData, UserSummary } from "../AnalyticsTable";
import RenderAdHocTasks from "./RenderAdHocTasks";

interface RenderTasksByCategoryProps {
  category: "predefined" | "adHoc";
  label: string;
  types: {
    predefined: { [type: string]: TaskData[] };
    adHoc: { [type: string]: TaskData[] };
  };
  user: UserSummary;
  date: string;
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

const RenderTasksByCategory: React.FC<RenderTasksByCategoryProps> = ({
  category,
  label,
  types,
  user,
  date,
  expandedTypes,
  expandedAdHocTasks,
  handleTypeClick,
  handleAdHocTaskClick,
  animationVariants,
  calculateTotals,
  renderQuantityWithTarget,
  renderTimeWithTarget,
  convertMinutesToHours,
  getTaskDateRange,
}) => {
  const categoryTypes = types[category];

  const hasData = useMemo(
    () =>
      categoryTypes
        ? Object.values(categoryTypes).some((tasks) =>
            tasks.some((task) => task.quantity > 0 || task.timeSpent > 0)
          )
        : false,
    [categoryTypes]
  );

  const categoryTotals = useMemo(
    () =>
      categoryTypes
        ? Object.values(categoryTypes)
            .flat()
            .reduce(
              (acc, task) => ({
                quantity: acc.quantity + task.quantity,
                targetQuantity: acc.targetQuantity + (task.targetQuantity || 0),
                timeSpent: acc.timeSpent + task.timeSpent,
                targetTime: acc.targetTime + (task.targetTime || 0),
              }),
              { quantity: 0, targetQuantity: 0, timeSpent: 0, targetTime: 0 }
            )
        : { quantity: 0, targetQuantity: 0, timeSpent: 0, targetTime: 0 },
    [categoryTypes]
  );

  if (!categoryTypes || !hasData) return null;

  return (
    <React.Fragment key={`${category}-${date}-${user.username}`}>
      <motion.tr
        className="bg-gray-100"
        variants={animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <td colSpan={1}></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
          {label}
        </td>
        <td></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderQuantityWithTarget(
            categoryTotals.quantity,
            categoryTotals.targetQuantity
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {renderTimeWithTarget(
            categoryTotals.timeSpent,
            categoryTotals.targetTime
          )}
        </td>
      </motion.tr>
      {Object.entries(categoryTypes)
        .filter(([_, tasks]) => {
          const typeTotals = calculateTotals(tasks);
          return typeTotals.quantity > 0 || typeTotals.timeSpent > 0;
        })
        .map(([type, tasks]) => {
          const typeTotals = calculateTotals(tasks);
          return (
            <React.Fragment
              key={`${category}-${type}-${date}-${user.username}`}
            >
              <motion.tr
                className="bg-gray-50"
                variants={animationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <td colSpan={1}></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                  {type}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeClick(user.username, date, type, category);
                    }}
                    className="cursor-pointer ml-2"
                  >
                    <FaChevronRight
                      className={`inline-block h-4 w-4 transform transition-all duration-200 ease-out ${
                        expandedTypes[user.username]?.[date]?.[
                          category
                        ]?.includes(type)
                          ? "rotate-90"
                          : "rotate-0"
                      }`}
                    />
                  </span>
                </td>
                <td></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderQuantityWithTarget(
                    typeTotals.quantity,
                    typeTotals.targetQuantity
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderTimeWithTarget(
                    typeTotals.timeSpent,
                    typeTotals.targetTime
                  )}
                </td>
              </motion.tr>
              <AnimatePresence>
                {expandedTypes[user.username]?.[date]?.[category]?.includes(
                  type
                ) &&
                  tasks
                    .filter((task) => task.quantity > 0 || task.timeSpent > 0)
                    .map((task) =>
                      category === "adHoc" ? (
                        <RenderAdHocTasks
                          key={task.taskId}
                          task={task}
                          user={user}
                          date={date}
                          expandedAdHocTasks={expandedAdHocTasks}
                          handleAdHocTaskClick={handleAdHocTaskClick}
                          animationVariants={animationVariants}
                          renderQuantityWithTarget={renderQuantityWithTarget}
                          renderTimeWithTarget={renderTimeWithTarget}
                          convertMinutesToHours={convertMinutesToHours}
                          getTaskDateRange={getTaskDateRange}
                        />
                      ) : (
                        <motion.tr
                          className="bg-gray-200"
                          variants={animationVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          key={`${category}-${type}-${task.taskId}-${date}-${user.username}`}
                        >
                          <td colSpan={2}></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>{task.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderQuantityWithTarget(
                              task.quantity,
                              task.targetQuantity || 0
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderTimeWithTarget(
                              task.timeSpent,
                              task.targetTime || 0
                            )}
                          </td>
                        </motion.tr>
                      )
                    )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
    </React.Fragment>
  );
};

export default memo(RenderTasksByCategory);
