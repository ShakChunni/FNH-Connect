import React, { useState } from "react";

interface TaskTargetQuantityProps {
  targetQuantity: number | null;
  onTargetQuantityChange: (value: number | null) => void;
  error?: string | null;
}

const TaskTargetQuantity: React.FC<TaskTargetQuantityProps> = ({
  targetQuantity,
  onTargetQuantityChange,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputClassName = () => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-xl flex justify-between items-center w-full cursor-auto px-4 py-2 h-14 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (isFocused) {
      return `ring-2 ring-blue-950 border-2 ${baseClasses}`;
    } else if (targetQuantity !== null && targetQuantity !== 0) {
      return `bg-white border-2 border-green-500 ${baseClasses}`;
    } else if (error) {
      return `bg-white border-2 border-red-500 ${baseClasses}`;
    } else {
      return `bg-[#F0F4F8] border border-gray-300 ${baseClasses}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      onTargetQuantityChange(null);
    } else if (/^\d*$/.test(value)) {
      onTargetQuantityChange(Number(value));
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <strong className="text-black w-32">Target Quantity:</strong>
      <div className="flex flex-1 p-1">
        <input
          type="text"
          value={targetQuantity === null ? "" : targetQuantity}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={getInputClassName()}
          placeholder={error || "Enter target quantity"}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
    </div>
  );
};

export default TaskTargetQuantity;
