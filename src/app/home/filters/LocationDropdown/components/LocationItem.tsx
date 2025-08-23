import React, { FC } from "react";
import { Check } from "lucide-react";

interface LocationItemProps {
  name: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  isSmallScreen: boolean;
  style?: React.CSSProperties;
}

const LocationItem: FC<LocationItemProps> = ({
  name,
  isSelected,
  onSelect,
  isSmallScreen,
  style,
}) => {
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(name);
  };

  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        isSelected ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      onClick={handleItemClick}
      style={style}
    >
      <span
        className={`${
          isSelected ? "text-blue-900 font-medium" : "text-gray-600"
        } ${isSmallScreen ? "text-xs" : "text-sm"} truncate flex-1`}
      >
        {name}
      </span>

      <div className="flex items-center">
        <span
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
            isSelected
              ? "border-blue-900 bg-blue-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          {isSelected && <Check size={14} className="stroke-current" />}
        </span>
      </div>
    </div>
  );
};

export default React.memo(LocationItem);