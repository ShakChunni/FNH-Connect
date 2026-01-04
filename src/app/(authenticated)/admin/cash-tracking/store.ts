import { create } from "zustand";

interface CashTrackingFilters {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
}

interface CashTrackingState {
  filters: CashTrackingFilters;
  selectedShiftId: number | null;
  setFilter: (key: keyof CashTrackingFilters, value: any) => void;
  resetFilters: () => void;
  setSelectedShiftId: (id: number | null) => void;
}

export const useCashTrackingStore = create<CashTrackingState>((set) => ({
  filters: {
    status: "All",
    search: "",
    startDate: "",
    endDate: "",
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
      },
    }),
  setSelectedShiftId: (id) => set({ selectedShiftId: id }),
}));
