import React from "react";
import { FaEdit } from "react-icons/fa";

interface UserTagProps {
  userId: number;
  name: string;
  targetQuantity: number | null;
  targetTime: number | null;
  targetType: string | null;
  isEditing: boolean;
  tempQuantity: string;
  onEditClick: (userId: number, currentValue: number | null) => void;
  onSave: (userId: number) => void;
  onTempQuantityChange: (value: string) => void;
}

const UserTag: React.FC<UserTagProps> = ({
  userId,
  name,
  targetQuantity,
  targetTime,
  targetType,
  isEditing,
  tempQuantity,
  onEditClick,
  onSave,
  onTempQuantityChange,
}) => {
  const currentValue = targetType === "TIME" ? targetTime : targetQuantity;
  const displayValue = currentValue === null ? "Set" : currentValue;
  const placeholder = targetType === "TIME" ? "mins" : "qty";

  return (
    <div className="flex flex-wrap items-center bg-white rounded-lg border border-blue-200 px-2 py-1 text-xs sm:text-sm">
      <span className="mr-1">{name}</span>
      {isEditing ? (
        <div className="flex items-center ml-1 mt-1 sm:mt-0">
          <input
            type="number"
            value={tempQuantity}
            onChange={(e) => onTempQuantityChange(e.target.value)}
            className={`w-16 sm:w-20 p-1 text-xs border rounded focus:outline-none focus:ring-1 
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
              if (e.key === "Enter") onSave(userId);
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(userId);
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
            onEditClick(userId, currentValue);
          }}
          className={`ml-1 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded
            ${
              targetType === "TIME"
                ? "text-purple-700 bg-purple-100 hover:bg-purple-200"
                : "text-blue-700 bg-blue-100 hover:bg-blue-200"
            }`}
        >
          <span>
            {displayValue} {targetType === "TIME" ? "mins" : ""}
          </span>
          <FaEdit size={10} />
        </button>
      )}
    </div>
  );
};

export default React.memo(UserTag);
