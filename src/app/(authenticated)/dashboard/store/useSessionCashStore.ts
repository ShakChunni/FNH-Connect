/**
 * Session Cash Tracker Store
 * Manages filter state for the cash tracker component
 */

import { create } from "zustand";
import type {
  DatePreset,
  Department,
  CustomDateRange,
} from "../components/SessionCashTracker/types";

interface SessionCashStoreState {
  // Filters
  datePreset: DatePreset;
  departmentId: number | "all";
  customDateRange: CustomDateRange | null;

  // UI State
  isDeptDropdownOpen: boolean;
  isDateDropdownOpen: boolean;
  isCustomRangePickerOpen: boolean;

  // Cached departments from API
  departments: Department[];

  // Actions
  setDatePreset: (preset: DatePreset) => void;
  setDepartmentId: (deptId: number | "all") => void;
  setCustomDateRange: (range: CustomDateRange | null) => void;
  setDeptDropdownOpen: (open: boolean) => void;
  setDateDropdownOpen: (open: boolean) => void;
  setCustomRangePickerOpen: (open: boolean) => void;
  setDepartments: (departments: Department[]) => void;
  resetFilters: () => void;
}

const initialState = {
  datePreset: "today" as DatePreset,
  departmentId: "all" as number | "all",
  customDateRange: null as CustomDateRange | null,
  isDeptDropdownOpen: false,
  isDateDropdownOpen: false,
  isCustomRangePickerOpen: false,
  departments: [],
};

export const useSessionCashStore = create<SessionCashStoreState>((set) => ({
  ...initialState,

  setDatePreset: (preset) =>
    set({
      datePreset: preset,
      isDateDropdownOpen: false,
      // Clear custom range if switching to a preset
      customDateRange: preset === "custom" ? undefined : null,
    }),

  setDepartmentId: (deptId) =>
    set({
      departmentId: deptId,
      isDeptDropdownOpen: false,
    }),

  setCustomDateRange: (range) =>
    set({
      customDateRange: range,
      datePreset: range ? "custom" : "today",
      isCustomRangePickerOpen: false,
    }),

  setDeptDropdownOpen: (open) => set({ isDeptDropdownOpen: open }),

  setDateDropdownOpen: (open) => set({ isDateDropdownOpen: open }),

  setCustomRangePickerOpen: (open) => set({ isCustomRangePickerOpen: open }),

  setDepartments: (departments) => set({ departments }),

  resetFilters: () => set(initialState),
}));

export default useSessionCashStore;
