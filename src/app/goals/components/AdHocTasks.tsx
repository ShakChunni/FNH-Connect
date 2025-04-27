import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import TaskType from "./components/TaskType";
import MeetingType from "./components/MeetingType";
import TaskName from "./components/TaskName";
import Note from "./components/Note";
import useCreateAdHocTasks from "../hooks/useCreateAdHocTasks";
import Notification from "./components/Notification";
import TaskRow from "./components/TaskRow";
import { useMediaQuery } from "react-responsive";
import useUpdateTasks from "../hooks/useUpdateTasks";
import useCompleteAdHocTasks from "../hooks/useCompleteAdHocTasks";
import useDeleteAdHocTasks from "../hooks/useDeleteAdHocTasks";
import useEditAdHocTasks from "../hooks/useEditAdHocTasks";
import ConfirmationPopup from "./components/ConfirmationPopup";

export interface TaskData {
  id: number;
  name: string;
  type: string;
  qty: string;
  time: string;
  timeUnit: string;
  goal: number;
  notes?: string;
  historicalTimeSpent?: number;
  meetingType?: string;
  totalTimeSpent?: number;
  createdAt?: string;
}

interface AdHocTasksProps {
  adHocTasks: TaskData[];
  handleDailyQtyChange: (index: number, value: string) => void;
  handleDailyTimeChange: (index: number, value: string) => void;
  handleDailyTimeUnitChange: (index: number) => void;
  getProgressWidth: (qty: string, goal: number) => string;
  getProgressColor: (qty: string, goal: number) => string;
  getTextColor: (qty: string, goal: number) => string;
  onTaskAdded: () => void;
}

const AdHocTasks: React.FC<AdHocTasksProps> = ({
  adHocTasks,
  handleDailyQtyChange,
  handleDailyTimeChange,
  handleDailyTimeUnitChange,
  getProgressWidth,
  getProgressColor,
  getTextColor,
  onTaskAdded,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<
    string | null
  >(null);
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>("");
  const [taskName, setTaskName] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [activityTypeError, setActivityTypeError] = useState<string | null>(
    null
  );
  const [meetingTypeError, setMeetingTypeError] = useState<string | null>(null);
  const [taskNameError, setTaskNameError] = useState<string | null>(null);

  const { createTask, loading, error, message } = useCreateAdHocTasks();
  const { updateTask, notification, clearNotification } = useUpdateTasks();
  const { completeTask } = useCompleteAdHocTasks();
  const { deleteTask } = useDeleteAdHocTasks();
  const { editTask } = useEditAdHocTasks();
  const isMobile = useMediaQuery({ query: "(max-width: 1280px)" });

  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [customNotification, setCustomNotification] = useState<string | null>(
    null
  );
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);

  const handleAddTaskClick = useCallback(() => {
    setIsPopupOpen(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setIsPopupOpen(false);
    setTaskToEdit(null);
    setSelectedActivityType(null);
    setTaskName("");
    setNote("");
    setSelectedMeetingType("");
  }, []);

  const handleSelectActivityType = useCallback((value: string) => {
    setSelectedActivityType(value);
    if (value !== "MEETING") {
      setSelectedMeetingType("");
    }
  }, []);

  const handleSelectMeetingType = useCallback((value: string) => {
    setSelectedMeetingType(value);
  }, []);

  const handleTaskNameChange = useCallback((value: string) => {
    setTaskName(value);
  }, []);

  const handleNoteChange = useCallback((value: string) => {
    setNote(value);
  }, []);
  const [saveDots, setSaveDots] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setSaveDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
    setSaveDots("");
  }, [loading]);

  const handleSaveTask = useCallback(async () => {
    let isValid = true;

    if (!selectedActivityType) {
      setActivityTypeError("Activity Type is required");
      isValid = false;
    } else {
      setActivityTypeError(null);
    }

    if (selectedActivityType === "MEETING" && !selectedMeetingType) {
      setMeetingTypeError("Meeting Type is required");
      isValid = false;
    } else {
      setMeetingTypeError(null);
    }

    if (!taskName) {
      setTaskNameError("Task Name is required");
      isValid = false;
    } else {
      setTaskNameError(null);
    }

    if (!isValid) {
      return;
    }

    const success = await createTask(
      taskName,
      selectedActivityType || "",
      note,
      selectedActivityType === "MEETING" ? selectedMeetingType : null
    );
    if (success) {
      onTaskAdded();
      setIsPopupOpen(false);
    }
  }, [
    taskName,
    selectedActivityType,
    note,
    selectedMeetingType,
    createTask,
    onTaskAdded,
  ]);

  const handleEditTaskSave = useCallback(async () => {
    let isValid = true;

    if (!selectedActivityType) {
      setActivityTypeError("Activity Type is required");
      isValid = false;
    } else {
      setActivityTypeError(null);
    }

    if (selectedActivityType === "MEETING" && !selectedMeetingType) {
      setMeetingTypeError("Meeting Type is required");
      isValid = false;
    } else {
      setMeetingTypeError(null);
    }

    if (!taskName) {
      setTaskNameError("Task Name is required");
      isValid = false;
    } else {
      setTaskNameError(null);
    }

    if (!isValid) {
      return;
    }

    if (taskToEdit) {
      const success = await editTask(
        taskToEdit.id,
        taskName,
        selectedActivityType || "",
        note,
        selectedActivityType === "MEETING" ? selectedMeetingType : null
      );
      if (success) {
        onTaskAdded();
        setIsPopupOpen(false);
      }
    }
  }, [
    taskName,
    selectedActivityType,
    note,
    selectedMeetingType,
    editTask,
    taskToEdit,
    onTaskAdded,
  ]);

  const handleCompleteTask = useCallback((taskId: number) => {
    setTaskToComplete(taskId);
    setIsConfirmPopupOpen(true);
  }, []);

  const handleConfirmCompleteTask = useCallback(async () => {
    if (taskToComplete !== null) {
      setConfirmLoading(true);
      const success = await completeTask(taskToComplete);
      setConfirmLoading(false);
      setIsConfirmPopupOpen(false);
      setTaskToComplete(null);
      if (success) {
        onTaskAdded(); // Refetch tasks
        setCustomNotification("Task has been marked as completed.");
        // Add a timeout to clear the notification
        setTimeout(() => {
          setCustomNotification(null);
        }, 3000);
      }
    }
  }, [completeTask, taskToComplete, onTaskAdded]);
  const handleCancelCompleteTask = useCallback(() => {
    setIsConfirmPopupOpen(false);
    setTaskToComplete(null);
  }, []);

  const handleEditTask = useCallback((task: TaskData) => {
    setTaskToEdit(task);
    setSelectedActivityType(task.type);
    setTaskName(task.name);
    setNote(task.notes || "");
    setSelectedMeetingType(task.meetingType || "");
    setIsPopupOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: number) => {
    setTaskToDelete(taskId);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (taskToDelete) {
      setConfirmLoading(true);
      try {
        const success = await deleteTask(taskToDelete);
        if (success) {
          setCustomNotification("Task has been deleted successfully.");
          onTaskAdded();
        }
      } catch (error) {
        console.error("Delete task error:", error);
        setCustomNotification("Error deleting task. Please try again.");
      } finally {
        setConfirmLoading(false);
        setIsDeleteConfirmOpen(false);
        setTaskToDelete(null);
        setTimeout(() => setCustomNotification(null), 3000);
      }
    }
  }, [taskToDelete, deleteTask, onTaskAdded]);
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

  return (
    <div className="px-4 xl:px-0">
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleClosePopup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-4 md:p-8 rounded-lg shadow-lg w-11/12 md:w-[55%] max-h-[90%] flex flex-col overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                onClick={handleClosePopup}
              >
                <FaTimes />
              </button>
              <h2 className="text-xl md:text-2xl font-bold text-blue-950 mb-6">
                {taskToEdit ? "Edit Task" : "Create New Task"}
              </h2>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <strong className="text-black w-32 ">Activity Type:</strong>
                  <div
                    className={`flex flex-1 relative ${
                      selectedActivityType === "MEETING" ? "space-x-4" : ""
                    }`}
                  >
                    <motion.div
                      className="flex-1 w-full"
                      initial={false}
                      animate={{
                        flex: selectedActivityType === "MEETING" ? 0.5 : 1,
                        width: "100%",
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <TaskType
                        selectedValue={selectedActivityType || ""}
                        onSelect={handleSelectActivityType}
                        error={activityTypeError}
                      />
                    </motion.div>

                    <motion.div
                      className="overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{
                        flex: selectedActivityType === "MEETING" ? 0.5 : 0,
                        width: selectedActivityType === "MEETING" ? "100%" : 0,
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <MeetingType
                        selectedValue={selectedMeetingType}
                        onSelect={handleSelectMeetingType}
                        error={meetingTypeError}
                      />
                    </motion.div>
                  </div>
                </div>
                <TaskName
                  taskName={taskName}
                  onTaskNameChange={handleTaskNameChange}
                  error={taskNameError}
                />
                <Note note={note} onNoteChange={handleNoteChange} />
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    className="rounded-xl bg-gray-500 text-white px-4 py-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-gray-600 disabled:opacity-50"
                    onClick={handleClosePopup}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-xl bg-blue-950 text-white px-4 py-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-blue-900 disabled:opacity-50 min-w-[100px]"
                    onClick={taskToEdit ? handleEditTaskSave : handleSaveTask}
                    disabled={loading}
                  >
                    {loading ? `Save${saveDots}` : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmationPopup
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={confirmLoading}
        message="Are you sure you want to delete this task?"
        actionType="delete"
      />
      <ConfirmationPopup
        isOpen={isConfirmPopupOpen}
        onClose={handleCancelCompleteTask}
        onConfirm={handleConfirmCompleteTask}
        loading={confirmLoading}
        message="Are you sure you want to mark this task as complete?"
        actionType="complete"
      />

      <div className="py-6 px-2 xl:px-0">
        <div className="px-4 lg:px-12 mx-auto">
          <div className="bg-[#F4F8FC] rounded-2xl p-8 shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg xl:text-2xl font-bold text-blue-900">
                Ad Hoc Tasks
              </h2>
              <button
                className="rounded-xl bg-blue-950 text-white px-4 py-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-blue-900"
                onClick={handleAddTaskClick}
              >
                Add Task +
              </button>
            </div>
            <div className="space-y-4">
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
                  Action
                </div>
              </div>

              {[...adHocTasks]
                .sort((a, b) => a.id - b.id)
                .map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={{
                      ...task,
                      historicalTimeSpent: task.historicalTimeSpent || 0,
                      totalTimeSpent: task.totalTimeSpent || 0,
                      createdAt: task.createdAt, // Ensure this is being passed
                    }}
                    index={index}
                    isMobile={isMobile}
                    isAdHoc={true}
                    handleInputChange={handleInputChange}
                    handleDailyTimeUnitChange={handleDailyTimeUnitChange}
                    updateTask={updateTask}
                    getProgressWidth={getProgressWidth}
                    getProgressColor={getProgressColor}
                    getTextColor={getTextColor}
                    onEditClick={handleEditTask}
                    onDeleteClick={handleDeleteTask}
                    onCompleteTask={handleCompleteTask}
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

      {customNotification && (
        <Notification
          message={customNotification}
          type="success"
          onClose={() => setCustomNotification(null)}
        />
      )}
    </div>
  );
};

export default React.memo(AdHocTasks);
