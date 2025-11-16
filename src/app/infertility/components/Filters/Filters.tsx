"use client";

import React, { useState } from "react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { motion } from "framer-motion";

interface FiltersProps {
  filters: {
    dateSelector: {
      start: string | null;
      end: string | null;
      option: string[];
    };
    leadsFilter: string;
  };
  onFilterUpdate: (key: string, value: any) => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, onFilterUpdate }) => {
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dateButtonRef = React.useRef<HTMLButtonElement>(null);
  const statusButtonRef = React.useRef<HTMLButtonElement>(null);

  const statusOptions = ["All", "Active", "Inactive", "Pending"];

  const handleStatusSelect = (status: string) => {
    onFilterUpdate("leadsFilter", status);
    setIsStatusDropdownOpen(false);
  };

  const handleDateSelect = (option: string) => {
    onFilterUpdate("dateSelector", {
      ...filters.dateSelector,
      option: [option],
    });
    setIsDateDropdownOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Status Filter */}
      <div className="relative">
        <button
          ref={statusButtonRef}
          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-fnh-grey-light rounded-lg hover:border-fnh-blue transition-colors"
        >
          <span className="text-sm text-fnh-grey-dark">
            Status: {filters.leadsFilter}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isStatusDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <DropdownPortal
          isOpen={isStatusDropdownOpen}
          onClose={() => setIsStatusDropdownOpen(false)}
          buttonRef={statusButtonRef}
          className="w-48"
        >
          <div className="py-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-fnh-grey-lighter transition-colors ${
                  filters.leadsFilter === status
                    ? "bg-fnh-blue text-white"
                    : "text-fnh-grey-dark"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </DropdownPortal>
      </div>

      {/* Date Filter */}
      <div className="relative">
        <button
          ref={dateButtonRef}
          onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-fnh-grey-light rounded-lg hover:border-fnh-blue transition-colors"
        >
          <span className="text-sm text-fnh-grey-dark">
            Date: {filters.dateSelector.option[0] || "All"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isDateDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <DropdownPortal
          isOpen={isDateDropdownOpen}
          onClose={() => setIsDateDropdownOpen(false)}
          buttonRef={dateButtonRef}
          className="w-48"
        >
          <div className="py-2">
            {["All", "Today", "This Week", "This Month", "This Year"].map(
              (option) => (
                <button
                  key={option}
                  onClick={() => handleDateSelect(option)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-fnh-grey-lighter transition-colors ${
                    filters.dateSelector.option[0] === option
                      ? "bg-fnh-blue text-white"
                      : "text-fnh-grey-dark"
                  }`}
                >
                  {option}
                </button>
              )
            )}
          </div>
        </DropdownPortal>
      </div>
    </div>
  );
};

export default Filters;
