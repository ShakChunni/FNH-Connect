import React, { useState } from "react";

interface NoteProps {
  note: string;
  onNoteChange: (value: string) => void;
}

const Note: React.FC<NoteProps> = ({ note, onNoteChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const getTextareaClassName = () => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-xl flex justify-between items-center w-full cursor-auto px-4 py-2 h-32 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (isFocused) {
      return `ring-2 ring-blue-950 border-2 ${baseClasses}`;
    } else if (note) {
      return `bg-white border-2 border-green-500 ${baseClasses}`;
    } else {
      return `bg-[#F0F4F8] border border-gray-300 ${baseClasses}`;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <strong className="text-black w-32">Note:</strong>
      <div className="flex flex-1 p-1">
        <textarea
          className={getTextareaClassName()}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter note here..."
        />
      </div>
    </div>
  );
};

export default React.memo(Note);
