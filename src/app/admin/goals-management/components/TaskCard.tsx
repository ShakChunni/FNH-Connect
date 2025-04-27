import React, { useState } from "react";
import { motion } from "framer-motion";
import { SimplifiedTask } from "../hooks/useFetchPreDefinedTasks";
import ConfirmationPopup from "./ConfirmationPopup";

interface TaskCardProps {
  task: SimplifiedTask;
  onTaskClick: (task: SimplifiedTask) => void;
  onEditClick: (
    task: SimplifiedTask,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onToggleStatus: (
    task: SimplifiedTask,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onDeleteClick: (
    task: SimplifiedTask,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  isLoading: boolean;
  viewMode: string;
}

const TaskCard = React.memo(
  ({
    task,
    onTaskClick,
    onEditClick,
    onToggleStatus,
    onDeleteClick,
    isLoading,
    viewMode,
  }: TaskCardProps) => {
    // State for confirmation popup
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);

    // Handler for delete button click
    const handleDeleteButtonClick = (
      e: React.MouseEvent<HTMLButtonElement>
    ) => {
      e.stopPropagation();
      setShowDeleteConfirmation(true);
    };

    // Handler for status toggle button click
    const handleStatusButtonClick = (
      e: React.MouseEvent<HTMLButtonElement>
    ) => {
      e.stopPropagation();
      setShowStatusConfirmation(true);
    };

    // Confirm deletion handler
    const confirmDelete = () => {
      onDeleteClick(
        task,
        new MouseEvent(
          "click"
        ) as unknown as React.MouseEvent<HTMLButtonElement>
      );
      setShowDeleteConfirmation(false);
    };

    // Confirm status toggle handler
    const confirmStatusToggle = () => {
      onToggleStatus(
        task,
        new MouseEvent(
          "click"
        ) as unknown as React.MouseEvent<HTMLButtonElement>
      );
      setShowStatusConfirmation(false);
    };

    return (
      <>
        <motion.div
          layout
          onClick={() => onTaskClick(task)}
          className={`
            bg-white rounded-2xl p-6
            border border-gray-100
            ${viewMode === "list" ? "w-full" : ""}
            shadow-[0_2px_8px_rgb(0,0,0,0.08)]
            cursor-pointer
            transition-shadow
            hover:shadow-md
          `}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg text-blue-950">{task.name}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                task.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {task.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            <p className="mb-1">
              <span className="font-medium">Type:</span> {task.type}
            </p>
            <p className="mb-1">
              <span className="font-medium">Measurement Type:</span>{" "}
              {task.measurementType}
            </p>
            <p className="mb-1">
              <span className="font-medium">Target Type:</span>{" "}
              {task.targetType}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Assigned users:</h4>
            {task.assignments && task.assignments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.assignments.map((assignment) => (
                  <span
                    key={assignment.userId}
                    className="bg-blue-950/5 px-3 py-1 rounded-lg text-xs text-blue-950"
                  >
                    {assignment.fullName || assignment.username}
                    {assignment.targetQuantity !== null && (
                      <span className="ml-1 font-medium">
                        ({assignment.targetQuantity})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No assignments</p>
            )}
          </div>

          <div className="flex justify-between mt-4 border-t pt-4">
            <div className="flex gap-3">
              <button
                className="text-blue-900 hover:text-blue-950 text-sm font-medium transition-colors"
                onClick={(e) => onEditClick(task, e)}
                disabled={isLoading}
              >
                Edit
              </button>
              <button
                className={`${
                  task.isActive
                    ? "text-yellow-600 hover:text-yellow-700"
                    : "text-green-700 hover:text-green-800"
                } text-sm font-medium transition-colors`}
                onClick={handleStatusButtonClick}
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : task.isActive
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
            <button
              className="text-red-700 hover:text-red-800 text-sm font-medium transition-colors"
              onClick={handleDeleteButtonClick}
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        </motion.div>

        {/* Delete Confirmation Popup */}
        <ConfirmationPopup
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={confirmDelete}
          loading={isLoading}
          message={`Are you sure you want to delete "${task.name}"? This action cannot be undone.`}
          actionType="delete"
        />

        {/* Status Toggle Confirmation Popup */}
        <ConfirmationPopup
          isOpen={showStatusConfirmation}
          onClose={() => setShowStatusConfirmation(false)}
          onConfirm={confirmStatusToggle}
          loading={isLoading}
          message={`Are you sure you want to ${
            task.isActive ? "deactivate" : "activate"
          } "${task.name}"?`}
          actionType={task.isActive ? "deactivate" : "activate"}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these props changed
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.name === nextProps.task.name &&
      prevProps.task.type === nextProps.task.type &&
      prevProps.task.measurementType === nextProps.task.measurementType && // Add measurementType
      prevProps.task.targetType === nextProps.task.targetType && // Add targetType
      prevProps.task.isActive === nextProps.task.isActive &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.viewMode === nextProps.viewMode &&
      JSON.stringify(prevProps.task.assignments) ===
        JSON.stringify(nextProps.task.assignments)
    );
  }
);

TaskCard.displayName = "TaskCard";

export default TaskCard;
