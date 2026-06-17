import { create } from "zustand";

interface CashTrackingFilters {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
  staffId: number | null;
}

interface CashTrackingState {
  filters: CashTrackingFilters;
  selectedShiftId: number | null;
  setFilter: <K extends keyof CashTrackingFilters>(
    key: K,
    value: CashTrackingFilters[K]
  ) => void;
  resetFilters: () => void;
  setSelectedShiftId: (id: number | null) => void;
}

export const useCashTrackingStore = create<CashTrackingState>((set) => ({
  filters: {
    status: "All",
    search: "",
    startDate: "",
    endDate: "",
    staffId: null,
  },
  selectedShiftId: null,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () =>
    set({
      filters: {
        status: "All",
        search: "",
        startDate: "",
        endDate: "",
        staffId: null,
      },
    }),
  setSelectedShiftId: (id) => set({ selectedShiftId: id }),
}));
