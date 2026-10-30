"use client";

import React, { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTION_TONES,
  formatActionLabel,
  getActionTone,
} from "../types";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { TONE_DOT } from "@/lib/statusStyles";

interface ActionTypeFilterProps {
  actionTypes: string[];
  currentAction: string;
  onActionChange: (action: string) => void;
  disabled?: boolean;
}

const ActionTypeFilter: React.FC<ActionTypeFilterProps> = ({
  actionTypes,
  currentAction,
  onActionChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Include all known action types + any from the API
  const knownActions = Object.keys(ACTION_TONES);
  const apiActions = actionTypes.filter((a) => !knownActions.includes(a));
  const allOptions = ["All", ...knownActions, ...apiActions];

  const handleSelect = (action: string) => {
    onActionChange(action);
    setIsOpen(false);
  };

  const currentTone =
    currentAction !== "All" ? getActionTone(currentAction) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 w-full sm:w-[140px]",
          "bg-slate-50/50 border border-slate-100 rounded-xl",
          "text-2xs sm:text-xs font-bold",
          "focus:outline-none focus:ring-2 focus:ring-fnh-blue/20",
          "transition-colors cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-fnh-blue/20"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {currentTone && (
            <span
              className={cn("h-2 w-2 rounded-full shrink-0", TONE_DOT[currentTone])}
              aria-hidden="true"
            />
          )}
          <span className="truncate">
            {currentAction === "All"
              ? "All Actions"
              : formatActionLabel(currentAction)}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[180px] max-w-[220px]"
      >
        <div className="py-1 max-h-[320px] overflow-y-auto">
          {allOptions.map((action) => {
            const tone = action !== "All" ? getActionTone(action) : null;
            const isSelected = action === currentAction;

            return (
              <button
                key={action}
                type="button"
                onClick={() => handleSelect(action)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
                  "text-2xs sm:text-xs font-medium",
                  "hover:bg-slate-50 transition-colors cursor-pointer",
                  isSelected && "bg-fnh-blue/5"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {tone && (
                    <span
                      className={cn("h-2 w-2 rounded-full shrink-0", TONE_DOT[tone])}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn("truncate", isSelected ? "font-bold" : "")}
                  >
                    {action === "All" ? "All Actions" : formatActionLabel(action)}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-fnh-blue shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default ActionTypeFilter;
