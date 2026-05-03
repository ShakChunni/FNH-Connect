import { create } from "zustand";

interface CashTrackingFilters {
  search: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Closed" | "All";
}

interface CashTrackingState {
  filters: CashTrackingFilters;
  selectedShiftId: number | null;
  setFilter: <K extends keyof CashTrackingFilters>(
    key: K,
    value: CashTrackingFilters[K]
  ) => void;
  setSelectedShiftId: (id: number | null) => void;
  resetFilters: () => void;
}

const initialFilters: CashTrackingFilters = {
  search: "",
  startDate: "",
  endDate: "",
  status: "All",
};

export const useInfertilityCashTrackingStore = create<CashTrackingState>(
  (set) => ({
    filters: { ...initialFilters },
    selectedShiftId: null,
    setFilter: (key, value) =>
      set((state) => ({
        filters: { ...state.filters, [key]: value },
      })),
    setSelectedShiftId: (id) => set({ selectedShiftId: id }),
    resetFilters: () => set({ filters: { ...initialFilters } }),
  })
);
