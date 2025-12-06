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

const buttonColors = {
  blue: "bg-blue-600 hover:bg-blue-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  purple: "bg-purple-600 hover:bg-purple-700",
  green: "bg-green-600 hover:bg-green-700",
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
    <div className="border-t border-gray-200 bg-gray-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-b-3xl">
      <div className="flex justify-end gap-2 sm:gap-3">
        {/* Cancel button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 sm:px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium cursor-pointer"
        >
          {cancelText}
        </button>

        {/* Submit button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={`px-3 sm:px-4 md:px-6 py-2 ${buttonColors[theme]} text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium cursor-pointer`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              {SubmitIcon && (
                <SubmitIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
