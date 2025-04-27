"use client";
import { Flex } from "@radix-ui/themes";
import React, { FC, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  DateSelector,
  PICDropdown,
  ResetDropdown,
  LeadsFilterDropdown,
  LocationSelector,
} from "./filters";
import { useAuth } from "../AuthContext";

export interface DropdownsProps {
  filters: {
    pic: string[];
    dateSelector: {
      start: string | null;
      end: string | null;
      option: string[];
    };
    tableSelector: string;
    leadsFilter: string;
    location: string[];
  };
  onFilterChange: (
    key: string,
    value:
      | string
      | string[]
      | { low: number | null; high: number | null }
      | {
          start: string | null;
          end: string | null;
          option: string[];
        }
  ) => void;
  searchBarRef: React.RefObject<{ search: () => void }>;
  isInitialLoad: boolean;
  shouldFetchFilteredData: boolean;
  setShouldFetchFilteredData: (value: boolean) => void;
  tableSelectorValue: string;
  onTableSelectorChange: (value: string) => void;
  fetchedPics: {
    id: number;
    username: string;
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
  tableSelectorValue,
  onTableSelectorChange,
  fetchedPics,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!isInitialLoad) {
      searchBarRef.current?.search();
    }
  }, [filters, searchBarRef, isInitialLoad]);

  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  const availablePics = useMemo(() => {
    return fetchedPics
      .filter((user) => !user.archived)
      .map((user) => capitalizeFirstLetter(user.username));
  }, [fetchedPics, capitalizeFirstLetter]);

  const getDefaultPics = useCallback(() => {
    return availablePics;
  }, [availablePics]);

  const defaultLocations = useMemo(() => [], []);

  const areFiltersDefault = useMemo(() => {
    const isPicDefault =
      filters.pic &&
      filters.pic.length === availablePics.length &&
      availablePics.every((pic) => filters.pic.includes(pic));

    const isLocationDefault =
      Array.isArray(filters.location) && filters.location.length === 0;

    const isDateSelectorDefault =
      filters.dateSelector &&
      filters.dateSelector.start === null &&
      filters.dateSelector.end === null &&
      filters.dateSelector.option.length === 0;

    return (
      isPicDefault &&
      isLocationDefault &&
      isDateSelectorDefault &&
      filters.leadsFilter === "All"
    );
  }, [filters, availablePics]);

  const handleResetFilters = useCallback(() => {
    onFilterChange("pic", getDefaultPics());
    onFilterChange("location", []);
    onFilterChange("dateSelector", {
      start: null,
      end: null,
      option: [],
    });
    onFilterChange("leadsFilter", "All");
  }, [onFilterChange, getDefaultPics]);

  const handlePicSelect = useCallback(
    (value: string[]) => {
      onFilterChange("pic", value);
    },
    [onFilterChange]
  );

  const handleLocationSelect = useCallback(
    (value: string[]) => {
      onFilterChange("location", value);
    },
    [onFilterChange]
  );

  const handleDateSelectorSelect = useCallback(
    (value: { start: string | null; end: string | null; option: string[] }) => {
      onFilterChange("dateSelector", value);
    },
    [onFilterChange]
  );

  const handleLeadsFilterSelect = useCallback(
    (value: string) => {
      onFilterChange("leadsFilter", value);
    },
    [onFilterChange]
  );

  const motionTransition = useMemo(
    () => ({
      duration: 0.3,
      type: "spring",
      stiffness: 300,
      damping: 30,
    }),
    []
  );

  const safeFilters = useMemo(
    () => ({
      pic: filters.pic || [],
      location: filters.location || [],
      dateSelector: filters.dateSelector || {
        start: null,
        end: null,
        option: [],
      },
      leadsFilter: filters.leadsFilter || "All",
      tableSelector: filters.tableSelector || "",
    }),
    [filters]
  );

  console.log("Dropdowns rendered", filters);

  return (
    <Flex direction="column" gap="4">
      <LayoutGroup>
        <Flex gap="4" align="center" justify="center" wrap="wrap">
          <motion.div layoutId="picDropdown" transition={motionTransition}>
            <PICDropdown
              onSelect={handlePicSelect}
              defaultValue={safeFilters.pic}
              fetchedPics={fetchedPics}
            />
          </motion.div>

          <motion.div layoutId="locationDropdown" transition={motionTransition}>
            <LocationSelector
              onSelect={handleLocationSelect}
              defaultValue={safeFilters.location}
            />
          </motion.div>

          <motion.div layoutId="dateSelector" transition={motionTransition}>
            <DateSelector
              onSelect={handleDateSelectorSelect}
              defaultValue={safeFilters.dateSelector}
            />
          </motion.div>

          <motion.div
            layoutId="leadsFilterDropdown"
            transition={motionTransition}
          >
            <LeadsFilterDropdown
              onSelect={handleLeadsFilterSelect}
              defaultValue={safeFilters.leadsFilter}
            />
          </motion.div>

          <AnimatePresence>
            {!areFiltersDefault && (
              <motion.div
                layoutId="resetDropdown"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={motionTransition}
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

Dropdowns.displayName = "Dropdowns";

export default React.memo(Dropdowns);
