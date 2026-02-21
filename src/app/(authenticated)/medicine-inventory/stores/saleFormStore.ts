/**
 * Sale Form Store
 * Zustand store for managing the Record Sale modal form state
 */

import { create } from "zustand";

export interface SaleFormData {
  // Patient info
  patientId: number | null;
  patientName: string;
  patientPhone: string;

  // Medicine info
  medicineId: number | null;
  medicineName: string;
  medicineGroupName: string;
  availableStock: number;

  // Sale details - quantity is user input, rest auto-calculated
  quantity: number;

  // Auto-populated from oldest purchase (FIFO)
  companyName: string;
  unitPrice: number;
  totalAmount: number;

  // Sale date
  saleDate: Date;
}

interface SaleFormState {
  formData: SaleFormData;
  setFormData: (data: Partial<SaleFormData>) => void;
  resetForm: () => void;

  // Set medicine with FIFO data
  setMedicineWithFIFO: (data: {
    medicineId: number;
    medicineName: string;
    medicineGroupName: string;
    availableStock: number;
    companyName: string;
    unitPrice: number;
  }) => void;
}

const initialFormData: SaleFormData = {
  patientId: null,
  patientName: "",
  patientPhone: "",
  medicineId: null,
  medicineName: "",
  medicineGroupName: "",
  availableStock: 0,
  quantity: 0,
  companyName: "",
  unitPrice: 0,
  totalAmount: 0,
  saleDate: new Date(),
};

export const useSaleFormStore = create<SaleFormState>((set) => ({
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

  setMedicineWithFIFO: (data) => {
    set((state) => ({
      formData: {
        ...state.formData,
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        medicineGroupName: data.medicineGroupName,
        availableStock: data.availableStock,
        companyName: data.companyName,
        unitPrice: data.unitPrice,
        quantity: 0,
        totalAmount: 0,
      },
    }));
  },

  resetForm: () => {
    set({ formData: { ...initialFormData, saleDate: new Date() } });
  },
}));

// Selector hooks for performance - use individual selectors to avoid object recreation
export const useSaleFormData = () =>
  useSaleFormStore((state) => state.formData);

export const useSetSaleFormData = () =>
  useSaleFormStore((state) => state.setFormData);

export const useSetSaleFormDataWithFIFO = () =>
  useSaleFormStore((state) => state.setMedicineWithFIFO);

export const useResetSaleForm = () =>
  useSaleFormStore((state) => state.resetForm);
