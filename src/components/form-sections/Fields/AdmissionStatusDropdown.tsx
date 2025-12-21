"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

export interface StatusOption {
  value: string;
  label: string;
  color: "blue" | "amber" | "purple" | "green" | "red" | "gray";
}

interface AdmissionStatusDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: StatusOption[];
  disabled?: boolean;
  inputClassName?: string;
  showConfirmation?: boolean;
  getWarningMessage?: (from: string, to: string) => string | null;
}

const getColorClasses = (color: string) => {
  const colors: Record<
    string,
    { bg: string; text: string; hover: string; dot: string; border: string }
  > = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      hover: "hover:bg-blue-100",
      dot: "bg-blue-500",
      border: "border-blue-200",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      hover: "hover:bg-amber-100",
      dot: "bg-amber-500",
      border: "border-amber-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      hover: "hover:bg-purple-100",
      dot: "bg-purple-500",
      border: "border-purple-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      hover: "hover:bg-green-100",
      dot: "bg-green-500",
      border: "border-green-200",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      hover: "hover:bg-red-100",
      dot: "bg-red-500",
      border: "border-red-200",
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      hover: "hover:bg-gray-100",
      dot: "bg-gray-500",
      border: "border-gray-200",
    },
  };
  return colors[color] || colors.gray;
};

const AdmissionStatusDropdown: React.FC<AdmissionStatusDropdownProps> = ({
  value,
  onSelect,
  options,
  disabled = false,
  inputClassName = "",
  showConfirmation = false,
  getWarningMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      setIsOpen(open);
      if (!open) setPendingSelection(null);
    },
    [disabled]
  );

  const handleSelect = useCallback(
    (v: string) => {
      if (disabled || v === value) {
        setIsOpen(false);
        return;
      }

      if (showConfirmation) {
        setPendingSelection(v);
      } else {
        setIsOpen(false);
        onSelect(v);
      }
    },
    [onSelect, disabled, value, showConfirmation]
  );

  const handleConfirm = useCallback(() => {
    if (pendingSelection) {
      onSelect(pendingSelection);
    }
    setPendingSelection(null);
    setIsOpen(false);
  }, [pendingSelection, onSelect]);

  const handleCancel = useCallback(() => {
    setPendingSelection(null);
  }, []);

  const warningMessage = useMemo(() => {
    if (!pendingSelection || !getWarningMessage) return null;
    return getWarningMessage(value, pendingSelection);
  }, [pendingSelection, getWarningMessage, value]);

  const pendingOption = useMemo(
    () => options.find((o) => o.value === pendingSelection),
    [options, pendingSelection]
  );

  const buttonColors = currentOption
    ? getColorClasses(currentOption.color)
    : getColorClasses("gray");

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChange(!isOpen);
        }}
        disabled={disabled}
        className={`${inputClassName} flex justify-between items-center pr-3 cursor-pointer ${
          buttonColors.bg
        } ${buttonColors.text} ${
          buttonColors.border
        } border rounded-xl transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        type="button"
      >
        <span className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          {currentOption && (
            <span className={`w-2 h-2 rounded-full ${buttonColors.dot}`} />
          )}
          {currentOption?.label || value || "Select status"}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 ${buttonColors.text} ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        buttonRef={buttonRef}
        className="z-110000 overflow-hidden min-w-48"
      >
        {pendingSelection ? (
          /* Confirmation View */
          <div className="p-3">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  pendingOption?.color === "red"
                    ? "text-red-500"
                    : "text-amber-500"
                }`}
              />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                  Change to {pendingOption?.label}?
                </p>
                {warningMessage && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {warningMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
                  pendingOption?.color === "red"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          /* Options List */
          <div
            className="overflow-y-auto p-1"
            style={{
              maxHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "220px"
                  : "280px",
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const colors = getColorClasses(opt.color);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`cursor-pointer px-3 py-2.5 transition-colors duration-200 rounded-lg flex items-center justify-between gap-2 ${
                    disabled
                      ? "cursor-not-allowed text-gray-400"
                      : isSelected
                      ? `${colors.bg} ${colors.text}`
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-xs sm:text-sm font-medium">
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className={colors.text} />}
                </div>
              );
            })}
          </div>
        )}
      </DropdownPortal>
    </>
  );
};

export default AdmissionStatusDropdown;
