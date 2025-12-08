/**
 * Filter Store for Infertility Module
 * Manages filters and search parameters
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { FilterState, SearchParams } from "../types";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface FilterStoreState {
  filters: FilterState;
  searchParams: SearchParams | undefined;
}

interface FilterActions {
  setFilters: (filters: FilterState) => void;
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  setSearchParams: (params: SearchParams | undefined) => void;
  resetFilters: () => void;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialFilters: FilterState = {
  dateSelector: { start: null, end: null, option: [] },
  leadsFilter: "All",
};

const initialState: FilterStoreState = {
  filters: initialFilters,
  searchParams: undefined,
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const useInfertilityFilterStore = create<
  FilterStoreState & FilterActions
>()(
  devtools(
    (set) => ({
      ...initialState,

      setFilters: (filters) => set({ filters }),

      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          // Reset search params when filter changes
          searchParams: undefined,
        })),

      setSearchParams: (params) => set({ searchParams: params }),

      resetFilters: () =>
        set({
          filters: initialFilters,
          searchParams: undefined,
        }),
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

// Actions hook with shallow comparison
export const useFilterActions = () =>
  useInfertilityFilterStore(
    useShallow((state) => ({
      setFilters: state.setFilters,
      updateFilter: state.updateFilter,
      setSearchParams: state.setSearchParams,
      resetFilters: state.resetFilters,
    }))
  );
