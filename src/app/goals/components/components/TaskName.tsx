import React, { useState } from "react";

interface TaskNameProps {
  taskName: string;
  onTaskNameChange: (value: string) => void;
  error?: string | null;
}

const TaskName: React.FC<TaskNameProps> = ({
  taskName,
  onTaskNameChange,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputClassName = () => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-xl flex justify-between items-center w-full cursor-auto px-4 py-2 h-14 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (isFocused) {
      return `ring-2 ring-blue-950 border-2 ${baseClasses}`;
    } else if (taskName) {
      return `bg-white border-2 border-green-500 ${baseClasses}`;
    } else if (error) {
      return `bg-white border-2 border-red-500 ${baseClasses}`;
    } else {
      return `bg-[#F0F4F8] border border-gray-300 ${baseClasses}`;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <strong className="text-black w-32">Task Name:</strong>
      <div className="flex flex-1 p-1">
        <input
          type="text"
          value={taskName}
          onChange={(e) => onTaskNameChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={getInputClassName()}
          placeholder={error || "Enter task name"}
        />
      </div>
    </div>
  );
};

export default TaskName;
