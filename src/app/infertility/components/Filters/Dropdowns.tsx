"use client";
import { Flex } from "@radix-ui/themes";
import React, { FC, useEffect, useCallback, useMemo } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { DateSelector, LeadsFilterDropdown } from "./index";

export interface DropdownsProps {
  filters: {
    dateSelector: {
      start: string | null;
      end: string | null;
      option: string[];
    };
    leadsFilter: string;
    // tableSelector, pic, location removed
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
}

const Dropdowns: FC<DropdownsProps> = ({
  filters,
  onFilterChange,
  searchBarRef,
  isInitialLoad,
}) => {
  useEffect(() => {
    if (!isInitialLoad) {
      searchBarRef.current?.search();
    }
  }, [filters, searchBarRef, isInitialLoad]);

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
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    }),
    []
  );

  const safeFilters = useMemo(
    () => ({
      dateSelector: filters.dateSelector || {
        start: null,
        end: null,
        option: [],
      },
      leadsFilter: filters.leadsFilter || "All",
    }),
    [filters]
  );

  return (
    <Flex direction="column" gap="4">
      <LayoutGroup>
        <Flex gap="4" align="center" justify="center" wrap="wrap">
          <motion.div
            layoutId="dateSelector"
            transition={motionTransition}
            style={{ maxWidth: "100%" }}
          >
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
        </Flex>
      </LayoutGroup>
    </Flex>
  );
};

Dropdowns.displayName = "Dropdowns";

export default React.memo(Dropdowns);
