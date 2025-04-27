import React from "react";
import { FaEdit } from "react-icons/fa";

interface GroupTargetEditorProps {
  groupName: string;
  isEditing: boolean;
  tempQuantity: string;
  targetType: string | null;
  onEditClick: (groupName: string) => void;
  onSave: (groupName: string) => void;
  onTempQuantityChange: (value: string) => void;
}

const GroupTargetEditor: React.FC<GroupTargetEditorProps> = ({
  groupName,
  isEditing,
  tempQuantity,
  targetType,
  onEditClick,
  onSave,
  onTempQuantityChange,
}) => {
  const placeholder = targetType === "TIME" ? "mins" : "qty";

  return (
    <div
      className="flex flex-wrap items-center justify-between py-2 px-3 sm:px-4 bg-blue-50 border-t border-b border-blue-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-medium text-xs sm:text-sm text-blue-800">
        Group Target ({targetType === "TIME" ? "Minutes" : "Quantity"})
      </div>

      <div className="w-full sm:w-auto mt-1 sm:mt-0">
        {isEditing ? (
          <div className="flex items-center justify-end">
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
                if (e.key === "Enter") onSave(groupName);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(groupName);
              }}
              className={`ml-1 text-xs font-medium px-2 py-1 rounded
                ${
                  targetType === "TIME"
                    ? "text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200"
                    : "text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200"
                }`}
            >
              Apply to all
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(groupName);
            }}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded
              ${
                targetType === "TIME"
                  ? "text-purple-700 bg-purple-100 hover:bg-purple-200"
                  : "text-blue-700 bg-blue-100 hover:bg-blue-200"
              }`}
          >
            <span>Set Group Target</span>
            <FaEdit size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(GroupTargetEditor);
