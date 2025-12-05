"use client";

import React from "react";

export interface PageHeaderProps {
  /** Main title of the page */
  title: string;
  /** Subtitle/description below the title */
  subtitle?: string;
  /** Action buttons or content to display on the right */
  actions?: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * PageHeader Component
 * Displays a page title with optional subtitle on the left and action buttons on the right.
 * Responsive design with proper spacing and typography.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 ${className}`}
    >
      {/* Left: Title and Subtitle */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-fnh-navy-dark tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-gray-500 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
