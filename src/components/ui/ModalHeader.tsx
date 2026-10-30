"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalHeaderProps {
  /** Icon component to display */
  icon: React.ElementType;
  /** Icon tint: 'blue' | 'indigo' | 'purple' | 'green' | 'red' | 'teal' */
  iconColor?: "blue" | "indigo" | "purple" | "green" | "red" | "teal";
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Close button handler */
  onClose: () => void;
  /** Disable close button (e.g., during submission) */
  isDisabled?: boolean;
  /** Optional navigation tabs */
  children?: React.ReactNode;
  /** Optional extra content next to close button */
  extra?: React.ReactNode;
}

const iconTints = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  purple: "bg-purple-50 text-purple-600 ring-purple-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
};

export function ModalHeader({
  icon: Icon,
  iconColor = "blue",
  title,
  subtitle,
  onClose,
  isDisabled = false,
  children,
  extra,
}: ModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-[inherit] z-10">
      <div className="flex justify-between items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset shrink-0 ${iconTints[iconColor]}`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-slate-500 text-sm leading-tight mt-0.5 hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {extra && <div className="hidden sm:block">{extra}</div>}
          <button
            type="button"
            onClick={onClose}
            disabled={isDisabled}
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {children && (
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">{children}</div>
      )}
    </div>
  );
}

export default ModalHeader;
