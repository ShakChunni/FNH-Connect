/**
 * General Admission Filter Store
 * Manages filter panel state and all filter values
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { AdmissionStatus } from "../types";
import { getBDTPresetCalendarRange } from "@/lib/timezone";

export type DateRangeOption =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

// ═══════════════════════════════════════════════════════════════
// State Interfaces
// ═══════════════════════════════════════════════════════════════

export interface FilterValues {
  departmentId: number | null;
  doctorId: number | null;
  status: AdmissionStatus | "All";
  dateRange: DateRangeOption;
  startDate: Date | null;
  endDate: Date | null;
  search: string;
  hasDue: boolean | null;
  hasDiscount: boolean | null;
  page: number;
  limit: number;
}

interface FilterPanelState {
  isOpen: boolean;
}

interface FilterState {
  panel: FilterPanelState;
  filters: FilterValues;
}

interface FilterActions {
  // Panel actions
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleFilterPanel: () => void;

  // Filter actions
  setDepartmentId: (id: number | null) => void;
  setDoctorId: (id: number | null) => void;
  setStatus: (status: AdmissionStatus | "All") => void;
  setDateRange: (range: DateRangeOption) => void;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setSearch: (search: string) => void;
  setHasDue: (hasDue: boolean | null) => void;
  setHasDiscount: (hasDiscount: boolean | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Bulk actions
  clearAllFilters: () => void;
  getActiveFilterCount: () => number;
}

type FilterStore = FilterState & FilterActions;

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

const initialFilterValues: FilterValues = {
  departmentId: null,
  doctorId: null,
  status: "All",
  dateRange: "all",
  startDate: null,
  endDate: null,
  search: "",
  hasDue: null,
  hasDiscount: null,
  page: 1,
  limit: 10,
};

const initialPanelState: FilterPanelState = {
  isOpen: false,
};

// ═══════════════════════════════════════════════════════════════
// Date Range Helper
// ═══════════════════════════════════════════════════════════════

export const getDateRangeFromOption = (
  option: DateRangeOption
): { start: Date | null; end: Date | null } => {
  return getBDTPresetCalendarRange(option);
};

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

export const useFilterStore = create<FilterStore>((set, get) => ({
  // Initial state
  panel: { ...initialPanelState },
  filters: { ...initialFilterValues },

  // Panel actions
  openFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: true },
    })),

  closeFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: false },
    })),

  toggleFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: !state.panel.isOpen },
    })),

  // Filter actions
  setDepartmentId: (id) =>
    set((state) => ({
      filters: { ...state.filters, departmentId: id, page: 1 },
    })),

  setDoctorId: (id) =>
    set((state) => ({
      filters: { ...state.filters, doctorId: id, page: 1 },
    })),

  setStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, status, page: 1 },
    })),

  setDateRange: (range) => {
    const dateRange = getDateRangeFromOption(range);
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: range,
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: 1,
      },
    }));
  },

  setCustomDateRange: (start, end) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: "custom",
        startDate: start,
        endDate: end,
        page: 1,
      },
    })),

  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    })),

  setHasDue: (hasDue) =>
    set((state) => ({
      filters: { ...state.filters, hasDue, page: 1 },
    })),

  setHasDiscount: (hasDiscount) =>
    set((state) => ({
      filters: { ...state.filters, hasDiscount, page: 1 },
    })),

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  setLimit: (limit) =>
    set((state) => ({
      filters: { ...state.filters, limit, page: 1 },
    })),

  // Bulk actions
  clearAllFilters: () =>
    set({
      filters: { ...initialFilterValues },
    }),

  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;
    if (filters.departmentId !== null) count++;
    if (filters.doctorId !== null) count++;
    if (filters.status !== "All") count++;
    if (filters.dateRange !== "all") count++;
    if (filters.search !== "") count++;
    if (filters.hasDue !== null) count++;
    if (filters.hasDiscount !== null) count++;
    return count;
  },
}));

// ═══════════════════════════════════════════════════════════════
// Selector Hooks
// ═══════════════════════════════════════════════════════════════

export const useFilterPanelState = () => useFilterStore((state) => state.panel);

export const useFilterValues = () => useFilterStore((state) => state.filters);

export const useFilterActions = () =>
  useFilterStore(
    useShallow((state) => ({
      openFilterPanel: state.openFilterPanel,
      closeFilterPanel: state.closeFilterPanel,
      toggleFilterPanel: state.toggleFilterPanel,
      setDepartmentId: state.setDepartmentId,
      setDoctorId: state.setDoctorId,
      setStatus: state.setStatus,
      setDateRange: state.setDateRange,
      setCustomDateRange: state.setCustomDateRange,
      setSearch: state.setSearch,
      setHasDue: state.setHasDue,
      setHasDiscount: state.setHasDiscount,
      setPage: state.setPage,
      setLimit: state.setLimit,
      clearAllFilters: state.clearAllFilters,
      getActiveFilterCount: state.getActiveFilterCount,
    }))
  );
