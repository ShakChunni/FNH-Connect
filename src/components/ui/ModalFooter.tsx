"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ModalFooterProps {
  /** Cancel button handler */
  onCancel: () => void;
  /** Submit button handler */
  onSubmit: () => void;
  /** Show loading state */
  isSubmitting?: boolean;
  /** Disable submit button (e.g., validation failed) */
  isDisabled?: boolean;
  /** Custom cancel button text */
  cancelText?: string;
  /** Custom submit button text */
  submitText?: string;
  /** Custom loading text */
  loadingText?: string;
  /** Optional icon for submit button */
  submitIcon?: React.ElementType;
  /** Button color theme */
  theme?: "blue" | "indigo" | "purple" | "green" | "red";
}

// Save/submit is blue across the app; green confirms money/completion; red destroys.
const buttonColors = {
  blue: "bg-blue-600 hover:bg-blue-700",
  indigo: "bg-blue-600 hover:bg-blue-700",
  purple: "bg-blue-600 hover:bg-blue-700",
  green: "bg-emerald-600 hover:bg-emerald-700",
  red: "bg-red-600 hover:bg-red-700",
};

export function ModalFooter({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isDisabled = false,
  cancelText = "Cancel",
  submitText = "Submit",
  loadingText = "Saving...",
  submitIcon: SubmitIcon,
  theme = "blue",
}: ModalFooterProps) {
  const isButtonDisabled = isSubmitting || isDisabled;

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-[inherit]">
      <div className="flex justify-end gap-2 sm:gap-3">
        {/* Cancel button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 px-4 md:px-6 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
        >
          {cancelText}
        </button>

        {/* Submit button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={`h-10 px-4 md:px-6 ${buttonColors[theme]} text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium cursor-pointer`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              {SubmitIcon && (
                <SubmitIcon className="w-4 h-4" />
              )}
              <span>{submitText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ModalFooter;
