/**
 * Purchase Form Store
 * Zustand store for managing the Add Purchase modal form state
 */

import { create } from "zustand";

export interface PurchaseFormData {
  // Core fields
  invoiceNumber: string;
  companyId: number | null;
  companyName: string;
  medicineId: number | null;
  medicineName: string;
  medicineGroupName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;

  // Optional fields
  purchaseDate: Date;
  expiryDate: Date | null;
  batchNumber: string;
}

interface PurchaseFormState {
  formData: PurchaseFormData;
  setFormData: (data: Partial<PurchaseFormData>) => void;
  resetForm: () => void;

  // Computed
  calculateTotal: () => void;
}

const initialFormData: PurchaseFormData = {
  invoiceNumber: "",
  companyId: null,
  companyName: "",
  medicineId: null,
  medicineName: "",
  medicineGroupName: "",
  quantity: 0,
  unitPrice: 0,
  totalAmount: 0,
  purchaseDate: new Date(),
  expiryDate: null,
  batchNumber: "",
};

export const usePurchaseFormStore = create<PurchaseFormState>((set, get) => ({
  formData: { ...initialFormData },

  setFormData: (data) => {
    set((state) => {
      const newFormData = { ...state.formData, ...data };

      // Auto-calculate total if quantity or unitPrice changed
      if ("quantity" in data || "unitPrice" in data) {
        newFormData.totalAmount = newFormData.quantity * newFormData.unitPrice;
      }

      return { formData: newFormData };
    });
  },

  calculateTotal: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        totalAmount: state.formData.quantity * state.formData.unitPrice,
      },
    }));
  },

  resetForm: () => {
    set({ formData: { ...initialFormData, purchaseDate: new Date() } });
  },
}));

// Selector hooks for performance - use individual selectors to avoid object recreation
export const usePurchaseFormData = () =>
  usePurchaseFormStore((state) => state.formData);

export const useSetPurchaseFormData = () =>
  usePurchaseFormStore((state) => state.setFormData);

export const useResetPurchaseForm = () =>
  usePurchaseFormStore((state) => state.resetForm);

export const useCalculatePurchaseTotal = () =>
  usePurchaseFormStore((state) => state.calculateTotal);
