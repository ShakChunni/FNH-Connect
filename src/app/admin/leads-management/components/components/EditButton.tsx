import React from "react";
import { FaEdit } from "react-icons/fa";

interface EditButtonProps {
  onClick: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="ml-2 p-1 text-gray-500 hover:text-gray-700"
    >
      <FaEdit className="w-4 h-4" />
    </button>
  );
  
};

export default EditButton;
