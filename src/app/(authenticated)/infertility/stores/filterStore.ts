/**
 * Filter Store for Infertility Module
 * Manages filters, search parameters, and pagination
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { FilterState, SearchParams } from "../types";
import { getBDTPresetCalendarRange } from "@/lib/timezone";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface PaginationState {
  page: number;
  limit: number;
}

interface FilterStoreState {
  filters: FilterState;
  searchParams: SearchParams | undefined;
  pagination: PaginationState;
  panel: {
    isOpen: boolean;
  };
  // Search state for debounced input
  search: string;
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  testNames: string[];
}

interface FilterActions {
  setFilters: (filters: FilterState) => void;
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  setSearchParams: (params: SearchParams | undefined) => void;
  resetFilters: () => void;
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleFilterPanel: () => void;
  // Pagination actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  // Search actions
  setSearch: (search: string) => void;
  setDateRange: (range: string) => void;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setTestNames: (testNames: string[]) => void;
  toggleTestName: (testName: string) => void;
  // Combined reset
  clearAllFilters: () => void;
  // Get active filter count
  getActiveFilterCount: () => number;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialFilters: FilterState = {
  dateSelector: { start: null, end: null, option: [] },
  leadsFilter: "All",
};

const initialPagination: PaginationState = {
  page: 1,
  limit: 15,
};

const initialState: FilterStoreState = {
  filters: initialFilters,
  searchParams: undefined,
  pagination: initialPagination,
  panel: { isOpen: false },
  search: "",
  dateRange: "all",
  startDate: null,
  endDate: null,
  testNames: [],
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const useInfertilityFilterStore = create<
  FilterStoreState & FilterActions
>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => set({ filters }),

      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          // Reset search params and page when filter changes
          searchParams: undefined,
          pagination: { ...state.pagination, page: 1 },
        })),

      setSearchParams: (params) => set({ searchParams: params }),

      openFilterPanel: () =>
        set((state) => ({ panel: { ...state.panel, isOpen: true } })),

      closeFilterPanel: () =>
        set((state) => ({ panel: { ...state.panel, isOpen: false } })),

      toggleFilterPanel: () =>
        set((state) => ({
          panel: { ...state.panel, isOpen: !state.panel.isOpen },
        })),

      resetFilters: () =>
        set({
          ...initialState,
        }),

      // Pagination actions
      setPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page },
        })),

      setLimit: (limit) =>
        set((state) => ({
          pagination: { ...state.pagination, limit, page: 1 },
        })),

      // Search actions
      setSearch: (search) =>
        set((state) => ({
          search,
          pagination: { ...state.pagination, page: 1 },
        })),

      setDateRange: (dateRange) => {
        const range = getBDTPresetCalendarRange(dateRange);
        set((state) => ({
          dateRange,
          startDate: range.start,
          endDate: range.end,
          pagination: { ...state.pagination, page: 1 },
        }));
      },

      setCustomDateRange: (startDate, endDate) =>
        set((state) => ({
          dateRange: "custom",
          startDate,
          endDate,
          pagination: { ...state.pagination, page: 1 },
        })),

      setStartDate: (startDate) =>
        set((state) => ({
          startDate,
          pagination: { ...state.pagination, page: 1 },
        })),

      setEndDate: (endDate) =>
        set((state) => ({
          endDate,
          pagination: { ...state.pagination, page: 1 },
        })),

      setTestNames: (testNames) =>
        set((state) => ({
          testNames,
          pagination: { ...state.pagination, page: 1 },
        })),

      toggleTestName: (testName) =>
        set((state) => ({
          testNames: state.testNames.includes(testName)
            ? state.testNames.filter((name) => name !== testName)
            : [...state.testNames, testName],
          pagination: { ...state.pagination, page: 1 },
        })),

      clearAllFilters: () =>
        set((state) => ({
          ...initialState,
          panel: state.panel,
        })),

      getActiveFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.search && state.search.length >= 2) count++;
        if (state.dateRange !== "all") count++;
        if (state.filters.leadsFilter !== "All") count++;
        if (state.testNames.length > 0) count++;
        return count;
      },
    }),
    { name: "infertility-filter-store" }
  )
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useFilters = () =>
  useInfertilityFilterStore((state) => state.filters);

export const useSearchParams = () =>
  useInfertilityFilterStore((state) => state.searchParams);

export const usePagination = () =>
  useInfertilityFilterStore((state) => state.pagination);

// Filter values for hook - includes all filter values needed for API call
export const useFilterValues = () =>
  useInfertilityFilterStore(
    useShallow((state) => ({
      search: state.search,
      dateRange: state.dateRange,
      startDate: state.startDate,
      endDate: state.endDate,
      testNames: state.testNames,
      page: state.pagination.page,
      limit: state.pagination.limit,
    }))
  );

// Actions hook with shallow comparison
export const useFilterActions = () =>
  useInfertilityFilterStore(
    useShallow((state) => ({
      setFilters: state.setFilters,
      updateFilter: state.updateFilter,
      setSearchParams: state.setSearchParams,
      resetFilters: state.resetFilters,
      openFilterPanel: state.openFilterPanel,
      closeFilterPanel: state.closeFilterPanel,
      toggleFilterPanel: state.toggleFilterPanel,
      setPage: state.setPage,
      setLimit: state.setLimit,
      setSearch: state.setSearch,
      setDateRange: state.setDateRange,
      setCustomDateRange: state.setCustomDateRange,
      setStartDate: state.setStartDate,
      setEndDate: state.setEndDate,
      setTestNames: state.setTestNames,
      toggleTestName: state.toggleTestName,
      clearAllFilters: state.clearAllFilters,
      getActiveFilterCount: state.getActiveFilterCount,
    }))
  );
