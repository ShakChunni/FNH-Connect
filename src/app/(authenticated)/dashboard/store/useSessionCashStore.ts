/**
 * Session Cash Tracker Store
 * Manages filter state for the cash tracker component
 */

import { create } from "zustand";
import type {
  DatePreset,
  Department,
  DepartmentFilter,
  CustomDateRange,
  CashTrackerStaffOption,
} from "../components/SessionCashTracker/types";

interface SessionCashStoreState {
  // Filters
  datePreset: DatePreset;
  departmentId: DepartmentFilter;
  staffId: number | null;
  customDateRange: CustomDateRange | null;

  // UI State
  isDeptDropdownOpen: boolean;
  isDateDropdownOpen: boolean;
  isCustomRangePickerOpen: boolean;

  // Cached departments from API
  departments: Department[];
  staffOptions: CashTrackerStaffOption[];

  // Actions
  setDatePreset: (preset: DatePreset) => void;
  setDepartmentId: (deptId: DepartmentFilter) => void;
  setStaffId: (staffId: number | null) => void;
  setCustomDateRange: (range: CustomDateRange | null) => void;
  setDeptDropdownOpen: (open: boolean) => void;
  setDateDropdownOpen: (open: boolean) => void;
  setCustomRangePickerOpen: (open: boolean) => void;
  setDepartments: (departments: Department[]) => void;
  setStaffOptions: (staffOptions: CashTrackerStaffOption[]) => void;
  resetFilters: () => void;
}

const initialState = {
  datePreset: "today" as DatePreset,
  departmentId: "all" as DepartmentFilter,
  staffId: null as number | null,
  customDateRange: null as CustomDateRange | null,
  isDeptDropdownOpen: false,
  isDateDropdownOpen: false,
  isCustomRangePickerOpen: false,
  departments: [],
  staffOptions: [],
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

  setStaffId: (staffId) => set({ staffId }),

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

  setStaffOptions: (staffOptions) => set({ staffOptions }),

  resetFilters: () => set(initialState),
}));

export default useSessionCashStore;
