"use client";

import React from "react";
import { PlusIcon } from "lucide-react";

interface NewPatientButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * New Patient Button for Pathology
 * Dark navy blue button for adding new pathology patients
 * Can be disabled during loading (no visual change, just prevents interaction)
 */
export const NewPatientButton: React.FC<NewPatientButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 
        bg-fnh-navy-dark hover:bg-fnh-navy text-white 
        rounded-xl shadow-lg hover:shadow-xl 
        transition-all duration-300 font-semibold text-sm sm:text-base 
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>New Patient</span>
    </button>
  );
};

export default NewPatientButton;
