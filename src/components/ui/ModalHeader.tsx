"use client";

import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface ModalHeaderProps {
  /** Icon component to display */
  icon: React.ElementType;
  /** Gradient color theme: 'blue' | 'indigo' | 'purple' | 'green' | 'red' */
  iconColor?: "blue" | "indigo" | "purple" | "green" | "red";
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
}

const iconGradients = {
  blue: "from-blue-500 to-blue-600",
  indigo: "from-indigo-500 to-indigo-600",
  purple: "from-purple-500 to-purple-600",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
};

const titleColors = {
  blue: "text-blue-900",
  indigo: "text-indigo-900",
  purple: "text-purple-900",
  green: "text-green-900",
  red: "text-red-900",
};

const subtitleColors = {
  blue: "text-blue-700/80",
  indigo: "text-indigo-700/80",
  purple: "text-purple-700/80",
  green: "text-green-700/80",
  red: "text-red-700/80",
};

export function ModalHeader({
  icon: Icon,
  iconColor = "blue",
  title,
  subtitle,
  onClose,
  isDisabled = false,
  children,
}: ModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-linear-to-br from-slate-50/90 via-white/85 to-slate-100/90 border-b border-gray-100 rounded-t-3xl z-10 overflow-hidden">
      {/* Main header content */}
      <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 relative z-10">
        {/* Icon and title section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icon container with gradient background */}
          <div
            className={`p-2 sm:p-2.5 md:p-3 bg-linear-to-br ${iconGradients[iconColor]} rounded-xl shadow-lg shrink-0`}
          >
            <Icon className="text-white w-[18px] h-[18px] sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </div>

          {/* Title and subtitle */}
          <div className="min-w-0 flex-1">
            <h2
              className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold ${titleColors[iconColor]} leading-tight mb-0.5 sm:mb-1`}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className={`${subtitleColors[iconColor]} text-xs sm:text-sm font-medium leading-tight hidden lg:block`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Close button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={isDisabled}
            className="bg-red-100 hover:bg-red-200 text-red-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 hover:scale-110 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <motion.div
              transition={{ duration: 0.2 }}
              whileHover={{
                rotate: 90,
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.5,
              }}
            >
              <X className="w-4 h-4 sm:w-[18px] sm:h-[18px] group-hover:text-red-600 transition-colors duration-200" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Optional navigation tabs or additional content */}
      {children && (
        <div className="px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 md:pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default ModalHeader;
