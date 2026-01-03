/**
 * Filter Store for Infertility Module
 * Manages filters, search parameters, and pagination
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { FilterState, SearchParams } from "../types";

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
  // Search state for debounced input
  search: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface FilterActions {
  setFilters: (filters: FilterState) => void;
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  setSearchParams: (params: SearchParams | undefined) => void;
  resetFilters: () => void;
  // Pagination actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  // Search actions
  setSearch: (search: string) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
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
  search: "",
  startDate: null,
  endDate: null,
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

      resetFilters: () =>
        set({
          filters: initialFilters,
          searchParams: undefined,
          pagination: initialPagination,
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

      clearAllFilters: () =>
        set({
          ...initialState,
        }),

      getActiveFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.search && state.search.length >= 2) count++;
        if (state.startDate || state.endDate) count++;
        if (state.filters.leadsFilter !== "All") count++;
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
      startDate: state.startDate,
      endDate: state.endDate,
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
      setPage: state.setPage,
      setLimit: state.setLimit,
      setSearch: state.setSearch,
      setStartDate: state.setStartDate,
      setEndDate: state.setEndDate,
      clearAllFilters: state.clearAllFilters,
      getActiveFilterCount: state.getActiveFilterCount,
    }))
  );
