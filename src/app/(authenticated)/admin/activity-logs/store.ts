import { create } from "zustand";
import { ActivityLogFilters } from "./types";

interface ActivityLogsState {
  filters: ActivityLogFilters;
  selectedLogId: number | null;
  setFilter: <K extends keyof ActivityLogFilters>(
    key: K,
    value: ActivityLogFilters[K]
  ) => void;
  resetFilters: () => void;
  setSelectedLogId: (id: number | null) => void;
  setPage: (page: number) => void;
}

const defaultFilters: ActivityLogFilters = {
  search: "",
  action: "All",
  userId: null,
  entityType: "All",
  startDate: "",
  endDate: "",
  page: 1,
  limit: 20,
};

export const useActivityLogsStore = create<ActivityLogsState>((set) => ({
  filters: defaultFilters,
  selectedLogId: null,

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Reset to page 1 when filters change (except when changing page itself)
        page: key === "page" ? (value as number) : 1,
      },
    })),

  resetFilters: () =>
    set({
      filters: defaultFilters,
    }),

  setSelectedLogId: (id) => set({ selectedLogId: id }),

  setPage: (page) =>
    set((state) => ({
      filters: {
        ...state.filters,
        page,
      },
    })),
}));
