"use client";

import React from "react";
import { PlusIcon } from "lucide-react";

interface NewPatientButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * New Patient Button
 * Responsive button matching general-admission style
 * Full width centered on mobile, inline on desktop
 */
export const NewPatientButton: React.FC<NewPatientButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 
        bg-linear-to-r from-fnh-navy-dark to-fnh-navy 
        text-white rounded-xl font-semibold 
        shadow-lg hover:shadow-xl 
        hover:from-fnh-navy hover:to-fnh-navy-dark 
        transition-all duration-300 transform hover:scale-105 
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <PlusIcon className="w-5 h-5" />
      <span>New Patient</span>
    </button>
  );
};

export default NewPatientButton;
