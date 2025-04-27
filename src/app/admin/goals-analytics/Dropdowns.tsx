"use client";
import { Flex } from "@radix-ui/themes";
import React, { FC, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  DateSelector,
  PICDropdown,
  ResetDropdown,
  TaskTypeSelector,
} from "./components/Filters";

import { useAuth } from "@/app/AuthContext";

export interface DropdownsProps {
  filters: {
    pic: string[];
    taskType: string[];
    dateSelector: {
      start: string | null;
      end: string | null;
      option: string[];
    };
  };
  onFilterChange: (
    key: string,
    value:
      | string
      | string[]
      | { low: number | null; high: number | null }
      | { start: string | null; end: string | null; option: string[] }
  ) => void;
  searchBarRef: React.RefObject<{ search: () => void }>;
  isInitialLoad: boolean;
  shouldFetchFilteredData: boolean;
  setShouldFetchFilteredData: (value: boolean) => void;
  fetchedPics: {
    id: number;
    username: string;
    role: string;
    manages: string[];
    organizations: string[];
    archived: boolean;
  }[];
}

const Dropdowns: FC<DropdownsProps> = ({
  filters,
  
  onFilterChange,
  searchBarRef,
  isInitialLoad,
  shouldFetchFilteredData,
  setShouldFetchFilteredData,
  fetchedPics,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!isInitialLoad) {
      searchBarRef.current?.search();
    }
  }, [filters, searchBarRef, isInitialLoad]);

  const capitalizeFirstLetter = (string: string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

  // Get all available PICs (capitalized usernames)
  const availablePics = useMemo(() => {
    return fetchedPics
      .filter((user) => !user.archived)
      .map((user) => capitalizeFirstLetter(user.username));
  }, [fetchedPics]);

  // Get default PIC values based on user role
  const getDefaultPics = useCallback(() => {
    if (user?.role === "salesperson") {
      return user.manages && user.manages.length > 0
        ? [
            capitalizeFirstLetter(user.username),
            ...user.manages.map(capitalizeFirstLetter),
          ]
        : [capitalizeFirstLetter(user.username)];
    }
    return availablePics;
  }, [user, availablePics]);

  // Check if filters are at their default state
  const areFiltersDefault = useMemo(() => {
    const defaultPicList = getDefaultPics();
    const isPicDefault =
      filters.pic.length === defaultPicList.length &&
      filters.pic.every((pic) => defaultPicList.includes(pic));

    return (
      isPicDefault &&
      filters.dateSelector.start === null &&
      filters.dateSelector.end === null &&
      filters.dateSelector.option.length === 0 &&
      filters.taskType.length === 0
    );
  }, [filters, getDefaultPics]);

  const handleResetFilters = useCallback(() => {
    onFilterChange("pic", getDefaultPics());
    onFilterChange("dateSelector", { start: null, end: null, option: [] });
    onFilterChange("taskType", []);
  }, [onFilterChange, getDefaultPics]);

  const handlePicSelect = useCallback(
    (value: string[]) => {
      onFilterChange("pic", value);
    },
    [onFilterChange]
  );

  const handleTaskTypeSelect = useCallback(
    (value: string[]) => {
      onFilterChange("taskType", value);
    },
    [onFilterChange]
  );

  const handleDateSelectorSelect = useCallback(
    (value: { start: string | null; end: string | null; option: string[] }) => {
      onFilterChange("dateSelector", value);
    },
    [onFilterChange]
  );

  return (
    <Flex direction="column" gap="4">
      <LayoutGroup>
        <Flex gap="4" align="center" justify="center" wrap="wrap">
          <motion.div
            layoutId="picDropdown"
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <PICDropdown
              onSelect={handlePicSelect}
              defaultValue={filters.pic}
              fetchedPics={fetchedPics}
            />
          </motion.div>
          <motion.div
            layoutId="taskTypeSelector"
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <TaskTypeSelector
              onSelect={handleTaskTypeSelect}
              defaultValue={filters.taskType}
            />
          </motion.div>
          <motion.div
            layoutId="dateSelector"
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <DateSelector
              onSelect={handleDateSelectorSelect}
              defaultValue={filters.dateSelector}
            />
          </motion.div>
          <AnimatePresence>
            {!areFiltersDefault && (
              <motion.div
                layoutId="resetDropdown"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <ResetDropdown onFilterChange={handleResetFilters} />
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>
      </LayoutGroup>
    </Flex>
  );
};

export default Dropdowns;
