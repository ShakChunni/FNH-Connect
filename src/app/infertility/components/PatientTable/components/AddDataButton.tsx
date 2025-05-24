import React from "react";
import { PlusIcon } from "lucide-react";

interface AddDataButtonProps {
  onClick: () => void;
}

const AddDataButton: React.FC<AddDataButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-950 hover:bg-blue-950 text-white font-bold py-2 px-4 rounded-xl inline-flex items-center transform hover:scale-105 transition-transform duration-500 ease-in-out"
    >
      <PlusIcon className="w-4 h-4 mr-2 sm:w-3 sm:h-3 sm:mr-1" />
      <span className="hidden sm:inline">Add Data</span>
      <span className="sm:hidden">Add</span>
    </button>
  );
};

export default AddDataButton;
