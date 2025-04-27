import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  motion,
  Reorder,
  AnimatePresence,
  useDragControls,
} from "framer-motion";
import { SimplifiedTask } from "../hooks/useFetchPreDefinedTasks";
import { X, GripVertical } from "lucide-react";
import { FaInfoCircle } from "react-icons/fa";
import { useMediaQuery } from "react-responsive";

interface SortingProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: SimplifiedTask[];
  onSave: (sortedTasks: { id: number; sortOrder: number }[]) => Promise<void>;
  isLoading: boolean;
}

const LoadingDots = () => {
  return (
    <div className="flex space-x-1 items-center">
      <motion.span
        className="h-1.5 w-1.5 bg-white rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.25 }}
      />
      <motion.span
        className="h-1.5 w-1.5 bg-white rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{
          repeat: Infinity,
          duration: 1,
          delay: 0.2,
          repeatDelay: 0.25,
        }}
      />
      <motion.span
        className="h-1.5 w-1.5 bg-white rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{
          repeat: Infinity,
          duration: 1,
          delay: 0.4,
          repeatDelay: 0.25,
        }}
      />
    </div>
  );
};

interface TaskItemProps {
  task: SimplifiedTask;
  handleSortOrderChange: (id: number, value: string) => void;
  sortedTasks: SimplifiedTask[];
  isTouchDevice: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  handleSortOrderChange,
  sortedTasks,
  isTouchDevice,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={task.id}
      value={task}
      dragControls={isTouchDevice ? dragControls : undefined}
      dragListener={!isTouchDevice} // Enable default drag behavior for mouse, disable for touch
      className="touch-manipulation" // Improve touch behavior
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`bg-white border rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-4 shadow-sm ${
          !isTouchDevice ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        {/* Only show drag handle for touch devices */}
        {isTouchDevice && (
          <div
            className="touch-none p-1 md:p-2 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.preventDefault();
              dragControls.start(e);
            }}
          >
            <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
        )}

        <div className="w-14 md:w-16">
          <input
            type="number"
            value={task.sortOrder === null ? "" : task.sortOrder}
            onChange={(e) => handleSortOrderChange(task.id, e.target.value)}
            onBlur={() => {
              // Ensure all tasks have sequential sort orders on blur
              // Implementation stays the same
            }}
            className="w-full px-2 md:px-3 py-1 md:py-2 border rounded-lg text-center text-sm md:text-base transition-all duration-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
            placeholder="---"
            min="1"
            max={sortedTasks.length}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-blue-950 text-sm md:text-base truncate">
            {task.name}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {task.type}
          </p>
        </div>

        <div
          className={`px-2 md:px-3 py-1 rounded-full text-2xs md:text-sm flex-shrink-0 ${
            task.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {task.isActive ? "Active" : "Inactive"}
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

const Sorting: React.FC<SortingProps> = ({
  isOpen,
  onClose,
  tasks,
  onSave,
  isLoading,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [sortedTasks, setSortedTasks] = useState<SimplifiedTask[]>([]);

  // Use react-responsive for better device detection
  const isTouchDevice = useMediaQuery({ query: "(hover: none)" });

  // Initialize sortedTasks
  useEffect(() => {
    if (tasks) {
      const initialSorted = [...tasks].sort((a, b) => {
        if (a.sortOrder === null && b.sortOrder === null) return a.id - b.id;
        if (a.sortOrder === null) return 1;
        if (b.sortOrder === null) return -1;
        return a.sortOrder - b.sortOrder;
      });

      const withSequentialOrder = initialSorted.map((task, index) => ({
        ...task,
        sortOrder: index + 1,
      }));

      setSortedTasks(withSequentialOrder);
    }
  }, [tasks]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
  }, []);

  // Handle animation complete
  const handleAnimationComplete = useCallback(() => {
    if (isAnimatingOut) {
      onClose();
      setIsAnimatingOut(false);
    }
  }, [isAnimatingOut, onClose]);

  // Other handlers remain the same
  const handleSortOrderChange = useCallback((id: number, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    if (numValue !== null && (isNaN(numValue) || numValue < 1)) return;

    setSortedTasks((prev) => {
      // Find the task to update and its current position
      const taskToUpdate = prev.find((task) => task.id === id);
      if (!taskToUpdate) return prev;

      const oldIndex = prev.findIndex((task) => task.id === id);
      const newIndex =
        numValue === null
          ? prev.length - 1
          : Math.min(Math.max(0, numValue - 1), prev.length - 1);

      // Create a copy of the tasks array without the task we're updating
      const tasksWithoutUpdated = prev.filter((task) => task.id !== id);

      // Insert the task at the new position
      const updatedTasksList = [
        ...tasksWithoutUpdated.slice(0, newIndex),
        { ...taskToUpdate, sortOrder: numValue },
        ...tasksWithoutUpdated.slice(newIndex),
      ];

      // Reassign sequential sort orders to all tasks
      return updatedTasksList.map((task, index) => ({
        ...task,
        sortOrder: index + 1,
      }));
    });
  }, []);

  const handleReorder = useCallback((reorderedTasks: SimplifiedTask[]) => {
    // Update sortOrder values based on new positions
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      sortOrder: index + 1, // Start from 1 for better UX
    }));
    setSortedTasks(updatedTasks);
  }, []);

  const handleSaveOrder = useCallback(async () => {
    const updatedSortOrders = sortedTasks.map((task) => ({
      id: task.id,
      sortOrder: task.sortOrder === null ? 9999 : task.sortOrder,
    }));
    await onSave(updatedSortOrders);
  }, [sortedTasks, onSave]);

  // Animation props
  const overlayAnimationProps = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: isAnimatingOut ? { opacity: 0 } : { opacity: 1 },
      exit: { opacity: 0 },
      onAnimationComplete: handleAnimationComplete,
      transition: { duration: 0.2 },
    }),
    [isAnimatingOut, handleAnimationComplete]
  );

  const modalAnimationProps = useMemo(
    () => ({
      initial: { scale: 0.9, opacity: 0 },
      animate: isAnimatingOut
        ? { scale: 0.9, opacity: 0 }
        : { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      transition: { duration: 0.2 },
    }),
    [isAnimatingOut]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          {...overlayAnimationProps}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4"
          onClick={handleClose}
        >
          <motion.div
            {...modalAnimationProps}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg md:text-2xl font-semibold text-blue-950">
                  Reorder Tasks
                </h2>
                <motion.button
                  onClick={handleClose}
                  className="text-red-700 hover:text-red-900"
                  disabled={isLoading}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
              </div>
              {/* Context-aware instructions */}
              <div className="text-xs md:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <FaInfoCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-900 flex-shrink-0" />
                  <span className="text-2xs md:text-xs text-gray-500">
                    {isTouchDevice
                      ? "Use the grip handle to drag tasks and reorder them."
                      : "Click and drag tasks to reorder them, or manually update their sort order values."}
                  </span>
                </span>
              </div>
            </div>

            {/* Task List with improved touch handling */}
            <div className="overflow-y-auto flex-1 p-2 md:p-3 overscroll-contain -webkit-overflow-scrolling-touch">
              <Reorder.Group
                axis="y"
                values={sortedTasks}
                onReorder={handleReorder}
                className="flex flex-col gap-2 md:gap-3"
              >
                {sortedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    handleSortOrderChange={handleSortOrderChange}
                    sortedTasks={sortedTasks}
                    isTouchDevice={isTouchDevice}
                  />
                ))}
              </Reorder.Group>
            </div>

            {/* Actions */}
            <div className="p-4 md:p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-3 py-2 md:px-4 md:py-2 rounded-lg border hover:bg-gray-50 transition-colors duration-300 text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-950 transition-colors duration-300 min-w-[80px] md:min-w-[100px] flex justify-center items-center text-sm"
                disabled={isLoading}
              >
                {isLoading ? <LoadingDots /> : "Save Order"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(Sorting);
