"use client";
import useViewModeState from "@/app/hooks/useViewModeState";
import React, { useState, useCallback, useMemo } from "react";
import { BsGrid, BsListUl } from "react-icons/bs";
import PreDefinedTasksInterface from "./components/PreDefinedTasksInterface/PreDefinedTasksInterface";
import { motion, AnimatePresence } from "framer-motion";
import useFetchPreDefinedTasks, {
  SimplifiedTask,
} from "./hooks/useFetchPreDefinedTasks";
import useEditPreDefinedTasks from "./hooks/useEditPreDefinedTasks";
import useCreatePreDefinedTasks from "./hooks/useCreatePreDefinedTasks";
import useDeletePreDefinedTasks from "./hooks/useDeletePreDefinedTasks";
import useUpdatePreDefinedTasksSortOrder from "./hooks/useUpdatePreDefinedTasksSortOrder";
import { AlertCircle } from "lucide-react";
import { FaSortAmountDown } from "react-icons/fa";
import TaskCard from "./components/TaskCard";
import SkeletonGoalManagement from "./components/SkletonGoalManagement";
import Sorting from "./components/Sorting";

interface UserAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null;
}

export default function GoalsManagement() {
  // Fetch tasks using our hook
  const {
    tasks,
    loading,
    error,
    refetch,
    activeTasksCount,
    tasksWithAssignments,
  } = useFetchPreDefinedTasks();

  // Use edit hook
  const {
    updateTask,
    toggleTaskStatus,
    isLoading: isEditLoading,
    error: editError,
  } = useEditPreDefinedTasks();

  // Use create hook
  const {
    createTask,
    isLoading: isCreateLoading,
    error: createError,
  } = useCreatePreDefinedTasks();

  // Use delete hook
  const {
    deleteTask,
    isLoading: isDeleteLoading,
    error: deleteError,
  } = useDeletePreDefinedTasks();

  // Use sort order hook
  const {
    updateSortOrders,
    isLoading: isSortingLoading,
    error: sortingError,
  } = useUpdatePreDefinedTasksSortOrder();

  const [selectedTask, setSelectedTask] = useState<SimplifiedTask | null>(null);
  const { viewMode, setViewMode } = useViewModeState();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSortingModalOpen, setIsSortingModalOpen] = useState(false);
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);

  // Display tasks based on filters - memoized to prevent recalculation on every render
  const displayedTasks = useMemo(
    () => (showOnlyAssigned ? tasksWithAssignments : tasks),
    [showOnlyAssigned, tasksWithAssignments, tasks]
  );

  // Memoize handlers to prevent unnecessary re-renders in child components
  const handleTaskClick = useCallback((task: SimplifiedTask) => {
    setSelectedTask(task);
  }, []);

  // Handle task creation with the createTask hook
  const handleCreateTask = useCallback(
    async (taskData: {
      name: string;
      type: string;
      measurementType: string; // Add measurementType
      targetType: string | null; // Add targetType
      assignments: UserAssignment[];
      notes?: string;
    }) => {
      const response = await createTask({
        name: taskData.name,
        type: taskData.type,
        measurementType: taskData.measurementType, // Add measurementType
        targetType: taskData.targetType, // Add targetType
        assignments: taskData.assignments,
        notes: taskData.notes,
      });

      if (response.success) {
        setIsCreateModalOpen(false);
        await refetch();
      }
      // Error handling is done within the hook
    },
    [createTask, refetch]
  );

  const handleEditTask = useCallback(
    async (taskData: {
      id?: number;
      name: string;
      type: string;
      measurementType: string; // Add measurementType
      targetType: string | null; // Add targetType
      assignments: UserAssignment[];
    }) => {
      if (!taskData.id && !selectedTask) return;

      const taskId = taskData.id || selectedTask!.id;

      const response = await updateTask({
        id: taskId,
        name: taskData.name,
        type: taskData.type,
        measurementType: taskData.measurementType, // Add measurementType
        targetType: taskData.targetType, // Add targetType
        assignments: taskData.assignments,
        isActive: selectedTask?.isActive,
      });

      if (response.success) {
        setIsEditModalOpen(false);
        await refetch();
      }
    },
    [updateTask, selectedTask, refetch]
  );

  const handleEditButtonClick = useCallback(
    (task: SimplifiedTask, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setSelectedTask(task);
      setIsEditModalOpen(true);
    },
    []
  );

  const handleToggleTaskStatus = useCallback(
    async (task: SimplifiedTask, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      const response = await toggleTaskStatus(
        task.id,
        !task.isActive // Toggle the current status
      );

      if (response.success) {
        await refetch();
      }
    },
    [toggleTaskStatus, refetch]
  );

  const handleDeleteTask = useCallback(
    async (task: SimplifiedTask, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      const response = await deleteTask(task.id);

      if (response.success) {
        await refetch();
      }
    },
    [deleteTask, refetch]
  );

  // Handler for saving sort orders
  const handleSaveSortOrder = useCallback(
    async (sortedTasks: { id: number; sortOrder: number }[]) => {
      const response = await updateSortOrders(sortedTasks);
      if (response.success) {
        setIsSortingModalOpen(false);
        await refetch();
      }
    },
    [updateSortOrders, refetch]
  );

  // Memoize view mode handlers
  const setGridView = useCallback(() => setViewMode("grid"), [setViewMode]);
  const setListView = useCallback(() => setViewMode("list"), [setViewMode]);

  // Memoize modal open/close handlers
  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);
  const closeEditModal = useCallback(() => setIsEditModalOpen(false), []);
  const openSortingModal = useCallback(() => setIsSortingModalOpen(true), []);
  const closeSortingModal = useCallback(() => setIsSortingModalOpen(false), []);

  // Combined error for display purposes
  const displayError = useMemo(
    () => editError || createError || deleteError || sortingError || null,
    [editError, createError, deleteError, sortingError]
  );

  // Memoize loading state for UI purposes
  const isLoading = useMemo(
    () =>
      isEditLoading || isCreateLoading || isDeleteLoading || isSortingLoading,
    [isEditLoading, isCreateLoading, isDeleteLoading, isSortingLoading]
  );

  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <div className="px-4 lg:px-12 mx-auto">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-blue-950/10 rounded-lg p-1">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-950 text-white"
                    : "text-blue-950 hover:bg-blue-950/10"
                }`}
                onClick={setGridView}
              >
                <BsGrid size={16} />
              </button>
              <button
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-950 text-white"
                    : "text-blue-950 hover:bg-blue-950/10"
                }`}
                onClick={setListView}
              >
                <BsListUl size={16} />
              </button>
            </div>

            <div className="text-sm text-blue-950">
              <span className="font-medium">{activeTasksCount}</span> of{" "}
              <span className="font-medium">{tasks.length}</span> tasks active
            </div>

            {/* Show errors if any */}
            {displayError && (
              <div className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {displayError instanceof Error
                  ? displayError.message
                  : displayError}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              className="bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-2"
              onClick={openSortingModal}
              disabled={isLoading || tasks.length <= 1}
            >
              <FaSortAmountDown />
              <span>Sort Tasks</span>
            </button>
            <button
              className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900 transition-colors"
              onClick={openCreateModal}
              disabled={isLoading}
            >
              Add New Task +
            </button>
          </div>
        </div>

        {/* Create Task Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <PreDefinedTasksInterface
              isOpen={isCreateModalOpen}
              onClose={closeCreateModal}
              onSave={handleCreateTask}
              mode="create"
            />
          )}
        </AnimatePresence>

        {/* Edit Task Modal */}
        <AnimatePresence>
          {isEditModalOpen && selectedTask && (
            <PreDefinedTasksInterface
              isOpen={isEditModalOpen}
              onClose={closeEditModal}
              onSave={handleEditTask}
              mode="edit"
              initialData={{
                id: selectedTask.id,
                name: selectedTask.name,
                type: selectedTask.type,
                measurementType: selectedTask.measurementType, // Add measurementType
                targetType: selectedTask.targetType, // Add targetType
                assignments: selectedTask.assignments.map((a) => ({
                  userId: a.userId,
                  targetQuantity: a.targetQuantity,
                  targetTime: a.targetTime,
                })),
              }}
            />
          )}
        </AnimatePresence>

        {/* Sorting Modal */}
        <AnimatePresence>
          {isSortingModalOpen && (
            <Sorting
              isOpen={isSortingModalOpen}
              onClose={closeSortingModal}
              tasks={tasks}
              onSave={handleSaveSortOrder}
              isLoading={isSortingLoading}
            />
          )}
        </AnimatePresence>

        {/* Loading State - Placeholder for future skeleton */}
        {loading && <SkeletonGoalManagement viewMode={viewMode} />}
        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-red-600">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="text-lg font-medium">Error loading tasks</p>
            <p className="text-sm">{error.message}</p>
            <button
              className="mt-4 bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-950 transition-colors"
              onClick={() => refetch()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tasks Grid/List */}
        {!loading && !error && (
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={`
            ${
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-4"
            }
            min-h-[200px]
          `}
          >
            {displayedTasks.length > 0 ? (
              displayedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={handleTaskClick}
                  onEditClick={handleEditButtonClick}
                  onToggleStatus={handleToggleTaskStatus}
                  onDeleteClick={handleDeleteTask}
                  isLoading={isLoading}
                  viewMode={viewMode}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <p className="text-lg mb-2">No tasks found</p>
                <p className="text-sm">
                  {showOnlyAssigned
                    ? "No tasks with assignments exist. Try showing all tasks."
                    : "Try creating a new task to get started."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
