"use client";
import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip as ReactTooltip } from "react-tooltip";
import Image from "next/image";
import TableHeader from "./components/TableHeader";
import TableRow from "./components/TableRow";
import {
  FaChevronRight,
  FaUserCircle,
  FaExpandAlt,
  FaCompressAlt,
} from "react-icons/fa";

// List of users with profile images
const usersWithImages = [
  "ashfaq",
  "amelie",
  "amra",
  "charlotte",
  "jouya",
  "manon",
  "marwan",
  "nana",
  "russell",
  "ikhwan",
  "tanvir",
];

export interface TaskData {
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

interface Totals {
  quantity: number;
  timeSpent: number;
  targetQuantity: number;
  targetTime: number; // Add this
}
interface Totals {
  quantity: number;
  timeSpent: number;
  targetQuantity: number;
}
export interface UserSummary {
  username: string;
  fullName: string;
  totalQuantity: number;
  totalTimeSpent: number; // in minutes
  taskDetails: TaskData[];
}

interface AnalyticsTableProps {
  tableData: UserSummary[];
  customOptions?: any;
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
  tableData = [],
  customOptions,
}) => {
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [expandedDates, setExpandedDates] = useState<{
    [key: string]: string[];
  }>({});
  const [expandedTypes, setExpandedTypes] = useState<{
    [username: string]: {
      [date: string]: {
        predefined: string[];
        adHoc: string[];
      };
    };
  }>({});

  const [expandedAdHocTasks, setExpandedAdHocTasks] = useState<{
    [username: string]: {
      [date: string]: {
        [taskId: number]: boolean;
      };
    };
  }>({});

  const getUserProfileImage = useCallback((username: string) => {
    if (usersWithImages.includes(username.toLowerCase())) {
      return `/${username.toLowerCase()}.jpg`;
    }
    return null;
  }, []);
  const [hoveredControl, setHoveredControl] = useState<{
    username: string;
    type: "expand" | "chevron";
  } | null>(null);
  const handleUserClick = useCallback((username: string) => {
    setExpandedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((user) => user !== username)
        : [...prev, username]
    );
  }, []);

  const handleDateClick = useCallback((username: string, date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [username]: prev[username]?.includes(date)
        ? prev[username].filter((d) => d !== date)
        : [...(prev[username] || []), date],
    }));
  }, []);

  const handleTypeClick = useCallback(
    (
      username: string,
      date: string,
      type: string,
      category: "predefined" | "adHoc"
    ) => {
      setExpandedTypes((prev) => ({
        ...prev,
        [username]: {
          ...(prev[username] || {}),
          [date]: {
            ...(prev[username]?.[date] || { predefined: [], adHoc: [] }),
            [category]: prev[username]?.[date]?.[category]?.includes(type)
              ? prev[username][date][category].filter((t) => t !== type)
              : [...(prev[username]?.[date]?.[category] || []), type],
          },
        },
      }));
    },
    []
  );

  const handleAdHocTaskClick = useCallback(
    (username: string, date: string, taskId: number) => {
      setExpandedAdHocTasks((prev) => ({
        ...prev,
        [username]: {
          ...(prev[username] || {}),
          [date]: {
            ...(prev[username]?.[date] || {}),
            [taskId]: !prev[username]?.[date]?.[taskId],
          },
        },
      }));
    },
    []
  );

  const groupTasksByDateAndType = useCallback((tasks: TaskData[]) => {
    const groupedTasks: {
      [date: string]: {
        predefined: { [type: string]: TaskData[] };
        adHoc: { [type: string]: TaskData[] };
      };
    } = {};

    tasks.forEach((task) => {
      // Format the date string directly from the ISO components without timezone conversion
      const rawDate = task.lastUpdated.split("T")[0]; // Get YYYY-MM-DD part
      const [year, month, day] = rawDate.split("-").map(Number);
      const date = `${day}/${month}/${year}`;

      if (!groupedTasks[date]) {
        groupedTasks[date] = {
          predefined: {},
          adHoc: {},
        };
      }

      const category = task.resetType === "continuous" ? "adHoc" : "predefined";

      if (!groupedTasks[date][category][task.type]) {
        groupedTasks[date][category][task.type] = [];
      }
      groupedTasks[date][category][task.type].push(task);
    });

    // Sort dates in descending order
    const sortedEntries = Object.entries(groupedTasks).sort((a, b) => {
      const [dayA, monthA, yearA] = a[0].split("/").map(Number);
      const [dayB, monthB, yearB] = b[0].split("/").map(Number);

      if (yearA !== yearB) return yearB - yearA;
      if (monthA !== monthB) return monthB - monthA;
      return dayB - dayA;
    });

    return Object.fromEntries(sortedEntries);
  }, []);

  const calculateTotals = useCallback((tasks: TaskData[]): Totals => {
    return tasks.reduce(
      (totals, task) => {
        totals.quantity += task.quantity;
        totals.timeSpent += task.timeSpent;
        totals.targetQuantity += task.targetQuantity || 0;
        totals.targetTime += task.targetTime || 0; // Add this line
        return totals;
      },
      { quantity: 0, timeSpent: 0, targetQuantity: 0, targetTime: 0 } // Update initial value
    );
  }, []);

  const handleExpandAll = useCallback(
    (username: string, isExpanded: boolean) => {
      const userTasks =
        tableData.find((u) => u.username === username)?.taskDetails || [];
      const groupedTasks = groupTasksByDateAndType(userTasks);

      if (isExpanded) {
        // Collapse everything
        setExpandedUsers((prev) => prev.filter((u) => u !== username));
        setExpandedDates((prev) => ({ ...prev, [username]: [] }));
        setExpandedTypes((prev) => ({ ...prev, [username]: {} }));
        setExpandedAdHocTasks((prev) => ({ ...prev, [username]: {} }));
      } else {
        // Expand everything
        setExpandedUsers((prev) => [...prev, username]);

        // Get all dates
        const dates = Object.keys(groupedTasks);
        setExpandedDates((prev) => ({ ...prev, [username]: dates }));

        // Expand all types for each date
        const newExpandedTypes = dates.reduce((acc, date) => {
          const predefinedTypes = Object.keys(
            groupedTasks[date].predefined || {}
          );
          const adHocTypes = Object.keys(groupedTasks[date].adHoc || {});

          return {
            ...acc,
            [date]: {
              predefined: predefinedTypes,
              adHoc: adHocTypes,
            },
          };
        }, {});

        setExpandedTypes((prev) => ({
          ...prev,
          [username]: newExpandedTypes,
        }));

        // Expand all ad hoc tasks
        const newExpandedAdHocTasks = dates.reduce((acc, date) => {
          const adHocTasks = Object.values(
            groupedTasks[date].adHoc || {}
          ).flat();
          const taskIds = adHocTasks.reduce(
            (taskAcc, task) => ({
              ...taskAcc,
              [task.taskId]: true,
            }),
            {}
          );

          return {
            ...acc,
            [date]: taskIds,
          };
        }, {});

        setExpandedAdHocTasks((prev) => ({
          ...prev,
          [username]: newExpandedAdHocTasks,
        }));
      }
    },
    [groupTasksByDateAndType, tableData]
  );

  const headers = useMemo(
    () => [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "task", label: "Task" },
      { key: "quantity", label: "Quantity" },
      { key: "timeSpent", label: "Time Spent" },
    ],
    []
  );

  const animationVariants = useMemo(
    () => ({
      initial: {
        opacity: 0,
        height: 0,
        scale: 0.98,
      },
      animate: {
        opacity: 1,
        height: "auto",
        scale: 1,
        transition: {
          height: {
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1,
          },
          opacity: {
            duration: 0.15,
            ease: "easeIn",
          },
          scale: {
            duration: 0.15,
            ease: "easeOut",
          },
        },
      },
      exit: {
        opacity: 0,
        height: 0,
        scale: 0.98,
        transition: {
          height: {
            duration: 0.2,
            ease: "easeInOut",
          },
          opacity: {
            duration: 0.12,
            ease: "easeIn",
          },
          scale: {
            duration: 0.12,
            ease: "easeIn",
          },
        },
      },
    }),
    []
  );

  const convertMinutesToHours = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  }, []);

  const isDateFullyExpanded = useCallback(
    (username: string, date: string) => {
      // Get all task types for this date
      const userTasks =
        tableData.find((u) => u.username === username)?.taskDetails || [];
      const groupedTasks = groupTasksByDateAndType(userTasks)[date];

      if (!groupedTasks) return false;

      const predefinedTypes = Object.keys(groupedTasks.predefined || {});
      const adHocTypes = Object.keys(groupedTasks.adHoc || {});

      // Check if the date is expanded
      if (!expandedDates[username]?.includes(date)) return false;

      // Check if all predefined types are expanded
      const allPredefinedExpanded = predefinedTypes.every((type) =>
        expandedTypes[username]?.[date]?.predefined?.includes(type)
      );

      // Check if all adHoc types are expanded
      const allAdHocExpanded = adHocTypes.every((type) =>
        expandedTypes[username]?.[date]?.adHoc?.includes(type)
      );

      // Check if all adHoc tasks are expanded
      const allAdHocTasksExpanded = Object.values(groupedTasks.adHoc || {})
        .flat()
        .every((task) => expandedAdHocTasks[username]?.[date]?.[task.taskId]);

      return allPredefinedExpanded && allAdHocExpanded && allAdHocTasksExpanded;
    },
    [
      tableData,
      groupTasksByDateAndType,
      expandedDates,
      expandedTypes,
      expandedAdHocTasks,
    ]
  );

  const handleExpandDateAll = useCallback(
    (username: string, date: string, isExpanded: boolean) => {
      const userTasks =
        tableData.find((u) => u.username === username)?.taskDetails || [];
      const groupedTasks = groupTasksByDateAndType(userTasks)[date];

      if (!groupedTasks) return;

      // First, ensure the date is expanded
      if (!expandedDates[username]?.includes(date)) {
        setExpandedDates((prev) => ({
          ...prev,
          [username]: [...(prev[username] || []), date],
        }));
      }

      if (isDateFullyExpanded(username, date)) {
        // Collapse all types and tasks
        setExpandedTypes((prev) => ({
          ...prev,
          [username]: {
            ...(prev[username] || {}),
            [date]: { predefined: [], adHoc: [] },
          },
        }));

        setExpandedAdHocTasks((prev) => ({
          ...prev,
          [username]: {
            ...(prev[username] || {}),
            [date]: {},
          },
        }));
      } else {
        // Expand all types
        const predefinedTypes = Object.keys(groupedTasks.predefined || {});
        const adHocTypes = Object.keys(groupedTasks.adHoc || {});

        setExpandedTypes((prev) => ({
          ...prev,
          [username]: {
            ...(prev[username] || {}),
            [date]: {
              predefined: predefinedTypes,
              adHoc: adHocTypes,
            },
          },
        }));

        // Expand all adHoc tasks
        const adHocTasks = Object.values(groupedTasks.adHoc || {}).flat();
        const adHocTaskIds = adHocTasks.reduce(
          (acc, task) => ({
            ...acc,
            [task.taskId]: true,
          }),
          {}
        );

        setExpandedAdHocTasks((prev) => ({
          ...prev,
          [username]: {
            ...(prev[username] || {}),
            [date]: adHocTaskIds,
          },
        }));
      }
    },
    [tableData, groupTasksByDateAndType, expandedDates, isDateFullyExpanded]
  );

  return (
    <div className="bg-[#fff] rounded-3xl shadow-lg p-6 mb-8">
      <div className="overflow-x-auto max-h-[600px] w-full rounded-3xl">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <TableHeader headers={headers} />
          <tbody className="bg-white divide-y divide-gray-200">
            {[...tableData]
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((user) => (
                <React.Fragment key={user.username}>
                  <tr className="bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      {getUserProfileImage(user.username) ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <Image
                            src={getUserProfileImage(user.username)!}
                            alt={`${user.username}'s profile`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <FaUserCircle className="inline-block h-8 w-8 mr-2" />
                      )}
                      {user.username.charAt(0).toUpperCase() +
                        user.username.slice(1)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center justify-between">
                      <span>Total</span>
                      <div className="flex items-center gap-2 relative">
                        <span
                          onClick={() => {
                            handleExpandAll(
                              user.username,
                              expandedUsers.includes(user.username)
                            );
                            // Clear the hover state immediately on click
                            setHoveredControl(null);
                          }}
                          className="cursor-pointer relative"
                          onMouseEnter={() =>
                            setHoveredControl({
                              username: user.username,
                              type: "expand",
                            })
                          }
                          onMouseLeave={() => setHoveredControl(null)}
                        >
                          {expandedUsers.includes(user.username) ? (
                            <FaCompressAlt className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                          ) : (
                            <FaExpandAlt className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                          )}
                          {hoveredControl?.username === user.username &&
                            hoveredControl?.type === "expand" && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#172554] rounded-lg whitespace-nowrap z-50">
                                {expandedUsers.includes(user.username)
                                  ? "Collapse All"
                                  : "Expand All"}
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#172554] rotate-45"></div>
                              </div>
                            )}
                        </span>
                        <span
                          onClick={() => {
                            handleUserClick(user.username);
                            // Clear the hover state immediately on click
                            setHoveredControl(null);
                          }}
                          className="cursor-pointer relative"
                          onMouseEnter={() =>
                            setHoveredControl({
                              username: user.username,
                              type: "chevron",
                            })
                          }
                          onMouseLeave={() => setHoveredControl(null)}
                        >
                          <FaChevronRight
                            className={`transition-transform h-4 w-4 text-gray-500 hover:text-gray-700 ${
                              expandedUsers.includes(user.username)
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                          {hoveredControl?.username === user.username &&
                            hoveredControl?.type === "chevron" && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#172554] rounded-lg whitespace-nowrap z-50">
                                {expandedUsers.includes(user.username)
                                  ? "Hide Details"
                                  : "Show Details"}
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#172554] rotate-45"></div>
                              </div>
                            )}
                        </span>
                      </div>
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {convertMinutesToHours(user.totalTimeSpent)}
                    </td>
                  </tr>
                  <AnimatePresence mode="sync" initial={false}>
                    {expandedUsers.includes(user.username) &&
                      Object.entries(groupTasksByDateAndType(user.taskDetails))
                        .filter(([_, types]) => {
                          const allTasks = [
                            ...Object.values(types.predefined || {}).flat(),
                            ...Object.values(types.adHoc || {}).flat(),
                          ];
                          const dateTotals = calculateTotals(allTasks);
                          return (
                            dateTotals.quantity > 0 || dateTotals.timeSpent > 0
                          );
                        })
                        .map(([date, types]) => (
                          <TableRow
                            key={date}
                            user={user}
                            date={date}
                            types={types}
                            expandedDates={expandedDates}
                            expandedTypes={expandedTypes}
                            handleDateClick={handleDateClick}
                            handleTypeClick={handleTypeClick}
                            animationVariants={animationVariants}
                            calculateTotals={calculateTotals}
                            convertMinutesToHours={convertMinutesToHours}
                            expandedAdHocTasks={expandedAdHocTasks}
                            handleAdHocTaskClick={handleAdHocTaskClick}
                            handleExpandDateAll={handleExpandDateAll}
                            isDateFullyExpanded={isDateFullyExpanded}
                          />
                        ))}
                  </AnimatePresence>
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(AnalyticsTable);
