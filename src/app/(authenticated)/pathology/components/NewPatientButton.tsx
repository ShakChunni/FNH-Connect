"use client";

import React from "react";
import { PlusIcon } from "lucide-react";

interface NewPatientButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * New Patient Button for Pathology
 * Solid emerald "New X" entry button for adding new pathology patients
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
        w-full sm:w-auto h-10 flex items-center justify-center gap-2 px-4 sm:px-5
        bg-emerald-600 hover:bg-emerald-700 text-white
        rounded-xl transition-colors font-semibold text-sm
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
