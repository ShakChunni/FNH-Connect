/**
 * General Admission Filter Store
 * Manages filter panel state and all filter values
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { AdmissionStatus } from "../types";

// ═══════════════════════════════════════════════════════════════
// State Interfaces
// ═══════════════════════════════════════════════════════════════

export interface FilterValues {
  departmentId: number | null;
  doctorId: number | null;
  status: AdmissionStatus | "All";
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  search: string;
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
  setDateRange: (range: string) => void;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setSearch: (search: string) => void;
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
  option: string
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "today": {
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return { start: today, end: endOfDay };
    }
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endOfYesterday };
    }
    case "last7days": {
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return { start: last7Days, end: now };
    }
    case "last30days": {
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      return { start: last30Days, end: now };
    }
    case "thisMonth": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: now };
    }
    default:
      return { start: null, end: null };
  }
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
      setPage: state.setPage,
      setLimit: state.setLimit,
      clearAllFilters: state.clearAllFilters,
      getActiveFilterCount: state.getActiveFilterCount,
    }))
  );
