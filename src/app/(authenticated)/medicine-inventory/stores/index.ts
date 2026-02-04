import { create } from "zustand";
import type {
  ModalType,
  TabType,
  MedicineFilters,
  PurchaseFilters,
  SaleFilters,
} from "../types";

// Re-export form stores
export {
  usePurchaseFormStore,
  usePurchaseFormData,
  useSetPurchaseFormData,
  useResetPurchaseForm,
  useCalculatePurchaseTotal,
} from "./purchaseFormStore";
export type { PurchaseFormData } from "./purchaseFormStore";

export {
  useSaleFormStore,
  useSaleFormData,
  useSetSaleFormData,
  useSetSaleFormDataWithFIFO,
  useResetSaleForm,
} from "./saleFormStore";
export type { SaleFormData } from "./saleFormStore";

// ═══════════════════════════════════════════════════════════════
// UI Store - Modal and Tab State
// ═══════════════════════════════════════════════════════════════

interface UIState {
  // Current tab
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Modal state
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Selection state
  selectedMedicineId: number | null;
  setSelectedMedicineId: (id: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Tab state
  activeTab: "medicines",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modal state
  activeModal: null,
  modalData: null,
  openModal: (modal, data = undefined) =>
    set({ activeModal: modal, modalData: data || null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Selection state
  selectedMedicineId: null,
  setSelectedMedicineId: (id) => set({ selectedMedicineId: id }),
}));

// ═══════════════════════════════════════════════════════════════
// Filter Store - Medicine Filters
// ═══════════════════════════════════════════════════════════════

interface MedicineFilterState {
  filters: MedicineFilters;
  setFilter: <K extends keyof MedicineFilters>(
    key: K,
    value: MedicineFilters[K],
  ) => void;
  resetFilters: () => void;
}

const defaultMedicineFilters: MedicineFilters = {
  search: undefined,
  groupId: undefined,
  lowStockOnly: false,
};

export const useMedicineFilterStore = create<MedicineFilterState>((set) => ({
  filters: defaultMedicineFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultMedicineFilters }),
}));

// ═══════════════════════════════════════════════════════════════
// Filter Store - Purchase Filters
// ═══════════════════════════════════════════════════════════════

interface PurchaseFilterState {
  filters: PurchaseFilters;
  setFilter: <K extends keyof PurchaseFilters>(
    key: K,
    value: PurchaseFilters[K],
  ) => void;
  resetFilters: () => void;
}

const defaultPurchaseFilters: PurchaseFilters = {
  search: undefined,
  companyId: undefined,
  medicineId: undefined,
  startDate: undefined,
  endDate: undefined,
};

export const usePurchaseFilterStore = create<PurchaseFilterState>((set) => ({
  filters: defaultPurchaseFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultPurchaseFilters }),
}));

// ═══════════════════════════════════════════════════════════════
// Filter Store - Sale Filters
// ═══════════════════════════════════════════════════════════════

interface SaleFilterState {
  filters: SaleFilters;
  setFilter: <K extends keyof SaleFilters>(
    key: K,
    value: SaleFilters[K],
  ) => void;
  resetFilters: () => void;
}

const defaultSaleFilters: SaleFilters = {
  search: undefined,
  patientId: undefined,
  medicineId: undefined,
  startDate: undefined,
  endDate: undefined,
};

export const useSaleFilterStore = create<SaleFilterState>((set) => ({
  filters: defaultSaleFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultSaleFilters }),
}));
