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
      className="w-full sm:w-auto h-10 flex items-center justify-center gap-2 px-4 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <PlusIcon className="w-5 h-5" />
      <span>New Patient</span>
    </button>
  );
};

export default NewPatientButton;
