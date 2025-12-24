/**
 * Session Cash Tracker Store
 * Manages filter state for the cash tracker component
 */

import { create } from "zustand";
import type {
  DatePreset,
  Department,
} from "../components/SessionCashTracker/types";

interface SessionCashStoreState {
  // Filters
  datePreset: DatePreset;
  departmentId: number | "all";

  // UI State
  isDeptDropdownOpen: boolean;
  isDateDropdownOpen: boolean;

  // Cached departments from API
  departments: Department[];

  // Actions
  setDatePreset: (preset: DatePreset) => void;
  setDepartmentId: (deptId: number | "all") => void;
  setDeptDropdownOpen: (open: boolean) => void;
  setDateDropdownOpen: (open: boolean) => void;
  setDepartments: (departments: Department[]) => void;
  resetFilters: () => void;
}

const initialState = {
  datePreset: "today" as DatePreset,
  departmentId: "all" as number | "all",
  isDeptDropdownOpen: false,
  isDateDropdownOpen: false,
  departments: [],
};

export const useSessionCashStore = create<SessionCashStoreState>((set) => ({
  ...initialState,

  setDatePreset: (preset) =>
    set({
      datePreset: preset,
      isDateDropdownOpen: false,
    }),

  setDepartmentId: (deptId) =>
    set({
      departmentId: deptId,
      isDeptDropdownOpen: false,
    }),

  setDeptDropdownOpen: (open) => set({ isDeptDropdownOpen: open }),

  setDateDropdownOpen: (open) => set({ isDateDropdownOpen: open }),

  setDepartments: (departments) => set({ departments }),

  resetFilters: () => set(initialState),
}));

export default useSessionCashStore;
