import React from "react";
import { motion } from "framer-motion";
import { FaEdit } from "react-icons/fa";

interface UserRowProps {
  user: {
    id: number;
    name: string;
  };
  isSelected: boolean;
  assignment?: {
    userId: number;
    targetQuantity: number | null;
    targetTime: number | null;
  };
  targetType: string | null;
  isEditing: boolean;
  tempQuantity: string;
  onToggle: (userId: number) => void;
  onEditClick: (userId: number, currentValue: number | null) => void;
  onSave: (userId: number) => void;
  onTempQuantityChange: (value: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  isSelected,
  assignment,
  targetType,
  isEditing,
  tempQuantity,
  onToggle,
  onEditClick,
  onSave,
  onTempQuantityChange,
}) => {
  const currentValue =
    targetType === "TIME" ? assignment?.targetTime : assignment?.targetQuantity;

  const placeholder = targetType === "TIME" ? "mins" : "qty";
  const displayValue =
    currentValue === null
      ? "Not set"
      : `${currentValue}${targetType === "TIME" ? " mins" : ""}`;

  return (
    <div
      className="flex flex-wrap items-center justify-between py-2 px-3 sm:px-4 hover:bg-blue-50 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(user.id);
      }}
    >
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-blue-950 rounded border-gray-300 focus:ring-blue-950 transition-all duration-200"
          checked={isSelected}
          onChange={() => onToggle(user.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-xs font-medium text-gray-700">{user.name}</span>
      </div>

      {isSelected && assignment && (
        <div
          className="w-full sm:w-auto mt-1 sm:mt-0 ml-0 sm:ml-auto mr-0 sm:mr-2 text-xs flex justify-end sm:block"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="flex items-center">
              <input
                type="number"
                value={tempQuantity}
                onChange={(e) => onTempQuantityChange(e.target.value)}
                className={`w-16 sm:w-20 p-1 text-xs border rounded focus:outline-none focus:ring-1 text-gray-900
                  ${
                    targetType === "TIME"
                      ? "focus:ring-purple-500"
                      : "focus:ring-blue-500"
                  }`}
                min="0"
                placeholder={placeholder}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSave(user.id);
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(user.id);
                }}
                className={`ml-1 text-xs p-1 rounded
                  ${
                    targetType === "TIME"
                      ? "text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200"
                      : "text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200"
                  }`}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(user.id, currentValue ?? null);
              }}
              className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded
                ${
                  targetType === "TIME"
                    ? "text-purple-700 bg-purple-100 hover:bg-purple-200"
                    : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                }`}
            >
              <span>Target: {displayValue}</span>
              <FaEdit size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(UserRow);
