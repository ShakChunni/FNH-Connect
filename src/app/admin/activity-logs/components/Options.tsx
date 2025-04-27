"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Flex } from "@radix-ui/themes";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ActivityTypeSelector from "../Filters/ActivityTypeSelector";
import DateSelector from "../Filters/DateSelector";
import { Searchbar } from "./";
import ResetButton from "./ResetButton";

interface OptionsProps {
  onActivityTypeChange: (values: string[]) => void;
  onDateRangeChange: (value: {
    start: string | null;
    end: string | null;
    option: string[];
  }) => void;
  onSearchChange: (query: string) => void;
  selectedActivities: string[];
  dateRange: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  searchQuery: string;
}

const Options: React.FC<OptionsProps> = ({
  onActivityTypeChange,
  onDateRangeChange,
  onSearchChange,
  selectedActivities,
  dateRange,
  searchQuery,
}) => {
  // Track if filters are at default values
  const areFiltersDefault = useMemo(() => {
    return (
      selectedActivities.length === 0 &&
      dateRange.start === null &&
      dateRange.end === null &&
      dateRange.option.length === 0 &&
      searchQuery === ""
    );
  }, [selectedActivities, dateRange, searchQuery]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    onActivityTypeChange([]);
    onDateRangeChange({ start: null, end: null, option: [] });
    onSearchChange("");
  }, [onActivityTypeChange, onDateRangeChange, onSearchChange]);

  const transition = {
    duration: 0.3,
    type: "spring",
    stiffness: 300,
    damping: 30,
  };

  return (
    <Flex direction="column" gap="4">
      <LayoutGroup>
        <Flex gap="4" align="center" justify="end" wrap="wrap">
          <AnimatePresence mode="popLayout">
            <motion.div
              key="activityTypeDropdown"
              layout
              transition={transition}
              className="md:max-w-xs w-full md:w-auto"
            >
              <ActivityTypeSelector
                onSelect={onActivityTypeChange}
                defaultValue={selectedActivities}
              />
            </motion.div>

            <motion.div
              key="dateSelector"
              layout
              transition={transition}
              className="md:max-w-xs w-full md:w-auto"
            >
              <DateSelector
                onSelect={onDateRangeChange}
                defaultValue={dateRange}
              />
            </motion.div>

            <motion.div
              key="searchbar"
              layout
              transition={transition}
              className="w-full md:w-auto"
            >
              <Searchbar onSearch={onSearchChange} initialValue={searchQuery} />
            </motion.div>

            {!areFiltersDefault && (
              <motion.div
                key="resetButton"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={transition}
              >
                <ResetButton onFilterChange={handleResetFilters} />
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>
      </LayoutGroup>
    </Flex>
  );
};

export default Options;