import { create } from "zustand";

type StatsViewMode = "today" | "allTime";

interface DashboardStoreState {
  // Stats view mode - shared across all compatible cards
  statsViewMode: StatsViewMode;

  // Actions
  setStatsViewMode: (mode: StatsViewMode) => void;
  toggleStatsViewMode: () => void;
}

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  statsViewMode: "today",

  setStatsViewMode: (mode) => set({ statsViewMode: mode }),

  toggleStatsViewMode: () =>
    set((state) => ({
      statsViewMode: state.statsViewMode === "today" ? "allTime" : "today",
    })),
}));

export default useDashboardStore;
