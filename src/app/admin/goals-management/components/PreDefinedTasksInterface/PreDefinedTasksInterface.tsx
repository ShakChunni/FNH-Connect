"use client";
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaSpinner } from "react-icons/fa";
import TaskType from "./components/TaskType";
import TaskName from "./components/TaskName";
import TargetType from "./components/TargetType";
import MeasurementType from "./components/MeasurementType";
import TaskAssigned from "./components/TaskAssigned/TaskAssigned";

// Updated interfaces to match our new data structure
interface UserAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null;
}

interface PreDefinedTasksInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    id?: number; // Add ID for edit operations
    name: string;
    type: string;
    measurementType: string; // Add measurementType
    targetType: string | null; // Add targetType
    assignments: UserAssignment[];
  }) => Promise<void>;
  initialData?: {
    id?: number; // Add ID for edit operations
    name?: string;
    type?: string;
    measurementType?: string; // Add measurementType
    targetType?: string | null; // Add targetType
    assignments?: UserAssignment[];
    assignedUsers?: number[]; // For backward compatibility
    notes?: string;
  };
  mode?: "create" | "edit";
}

export default function PreDefinedTasksInterface({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  mode = "create",
}: PreDefinedTasksInterfaceProps) {
  const [selectedActivityType, setSelectedActivityType] = useState<string>(
    initialData?.type || ""
  );
  const [measurementType, setMeasurementType] = useState<string>(
    initialData?.measurementType || ""
  );
  const [targetType, setTargetType] = useState<string | null>(
    initialData?.targetType || null
  );
  const [taskName, setTaskName] = useState<string>(initialData?.name || "");

  // New state to handle user assignments with target quantities
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>(
    initialData?.assignments ||
      initialData?.assignedUsers?.map((userId) => ({
        userId,
        targetQuantity: null,
        targetTime: null, // Add this field
      })) ||
      []
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [loading, setLoading] = useState(false);

  // Update local state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      if (initialData.type) setSelectedActivityType(initialData.type);
      if (initialData.name) setTaskName(initialData.name);

      // Handle measurementType and targetType from initialData
      if (initialData.measurementType)
        setMeasurementType(initialData.measurementType);
      if (initialData.targetType) setTargetType(initialData.targetType);

      // Handle assignments from initialData
      if (initialData.assignments && initialData.assignments.length > 0) {
        setUserAssignments(initialData.assignments);
      } else if (
        initialData.assignedUsers &&
        initialData.assignedUsers.length > 0
      ) {
        // For backward compatibility
        setUserAssignments(
          initialData.assignedUsers.map((userId) => ({
            userId,
            targetQuantity: null,
            targetTime: null, // Add this field
          }))
        );
      }

      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const [activityTypeError, setActivityTypeError] = useState<string | null>(
    null
  );
  const [taskNameError, setTaskNameError] = useState<string | null>(null);
  const [measurementTypeError, setMeasurementTypeError] = useState<
    string | null
  >(null);
  const [targetTypeError, setTargetTypeError] = useState<string | null>(null);

  const [assignedUsersError, setAssignedUsersError] = useState<string | null>(
    null
  );

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

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSelectActivityType = useCallback((value: string) => {
    setSelectedActivityType(value);
    setActivityTypeError(null);
  }, []);

  const handleTaskNameChange = useCallback((value: string) => {
    setTaskName(value);
    setTaskNameError(null);
  }, []);

  const handleAssignmentsChange = useCallback(
    (assignments: UserAssignment[]) => {
      // Ensure assignments follow the target type rules
      const updatedAssignments = assignments.map((assignment) => ({
        ...assignment,
        targetQuantity:
          targetType === "QUANTITY" ? assignment.targetQuantity ?? null : null,
        targetTime:
          targetType === "TIME" ? assignment.targetTime ?? null : null,
      }));

      setUserAssignments(updatedAssignments);
      setAssignedUsersError(null);
    },
    [targetType]
  );

  const handleMeasurementTypeChange = useCallback((value: string) => {
    setMeasurementType(value);
    setMeasurementTypeError(null);
  }, []);

  const handleTargetTypeChange = useCallback((value: string | null) => {
    setTargetType(value);
    setTargetTypeError(null);

    // Update all assignments based on new target type
    setUserAssignments((prev) =>
      prev.map((assignment) => ({
        ...assignment,
        targetQuantity:
          value === "QUANTITY" ? assignment.targetQuantity || 0 : null,
        targetTime: value === "TIME" ? assignment.targetTime || 0 : null,
      }))
    );
  }, []);

  const handleSave = useCallback(async () => {
    let isValid = true;

    if (!selectedActivityType) {
      setActivityTypeError("Activity Type is required");
      isValid = false;
    } else {
      setActivityTypeError(null);
    }

    if (!taskName) {
      setTaskNameError("Task Name is required");
      isValid = false;
    } else {
      setTaskNameError(null);
    }

    if (!measurementType) {
      setMeasurementTypeError("Measurement Type is required");
      isValid = false;
    } else {
      setMeasurementTypeError(null);
    }

    if (!targetType) {
      setTargetTypeError("Target Type is required");
      isValid = false;
    } else {
      setTargetTypeError(null);
    }

    if (userAssignments.length === 0) {
      setAssignedUsersError("At least one assignee is required");
      isValid = false;
    } else {
      setAssignedUsersError(null);
    }

    if (!isValid) return;

    setLoading(true);
    try {
      await onSave({
        id: initialData.id, // Include the ID for edit operations
        name: taskName,
        type: selectedActivityType,
        measurementType, // Include measurementType
        targetType, // Include targetType
        assignments: userAssignments,
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setLoading(false);
    }
  }, [
    taskName,
    selectedActivityType,
    measurementType, // Include measurementType
    targetType, // Include targetType
    userAssignments,
    notes,
    onSave,
    onClose,
    initialData.id,
  ]);

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { delay: 0.1, duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Rest of the component remains the same */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <motion.h2
              className="text-lg sm:text-xl md:text-2xl font-bold text-blue-950"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {mode === "create" ? "Create New Task" : "Edit Task"}
            </motion.h2>
            <button
              className="text-gray-500 hover:text-red-500 transition-colors text-lg p-1"
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6 md:px-8">
          <motion.div
            className="flex flex-col space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <TaskType
              selectedValue={selectedActivityType}
              onSelect={handleSelectActivityType}
              error={activityTypeError}
            />

            <TaskName
              taskName={taskName}
              onTaskNameChange={handleTaskNameChange}
              error={taskNameError}
            />

            <MeasurementType
              selectedValue={measurementType}
              onSelect={handleMeasurementTypeChange}
            />

            <TargetType
              selectedValue={targetType}
              onSelect={handleTargetTypeChange}
            />

            <TaskAssigned
              selectedUsers={userAssignments}
              onSelect={handleAssignmentsChange}
              error={assignedUsersError}
              targetType={targetType} // Add this prop
            />
          </motion.div>
        </div>

        <motion.div
          className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-4 py-4 sm:px-6 md:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-3 sm:gap-0">
            <button
              className="rounded-xl bg-gray-100 text-gray-700 px-5 py-2.5 font-medium transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 w-full sm:w-auto"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-blue-900 text-white px-5 py-2.5 font-medium shadow-sm transition-all duration-200 hover:bg-blue-950 disabled:opacity-50 w-full sm:w-auto"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Saving{saveDots}
                </span>
              ) : (
                "Save Task"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
