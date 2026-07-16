/**
 * Purchase Form Store
 * Zustand store for managing the Add Purchase invoice modal state.
 */

import { create } from "zustand";
import { calculateMedicinePurchaseLineTotal } from "@/lib/medicinePurchaseCalculations";

export interface PurchaseLineItem {
  id: string;
  medicineId: number | null;
  medicineName: string;
  medicineGroupName: string;
  quantity: number;
  unitPrice: number;
  vatTax: number;
  salePrice: number;
  discountAmount: number;
  batchNumber: string;
  expiryDate: Date | null;
}

export interface PurchaseFormData {
  invoiceNumber: string;
  companyId: number | null;
  companyName: string;
  purchaseDate: Date;
  items: PurchaseLineItem[];
  draftItem: PurchaseLineItem;
  totalAmount: number;
}

interface PurchaseFormState {
  formData: PurchaseFormData;
  setFormData: (data: Partial<PurchaseFormData>) => void;
  setDraftItem: (data: Partial<PurchaseLineItem>) => void;
  addDraftItem: () => boolean;
  updateItem: (id: string, data: Partial<PurchaseLineItem>) => void;
  removeItem: (id: string) => void;
  resetDraftItem: () => void;
  resetForm: () => void;
  calculateTotal: () => void;
}

let fallbackLineItemId = 0;

const createLineItemId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  fallbackLineItemId += 1;
  return `${Date.now()}-${fallbackLineItemId}`;
};

const createEmptyLineItem = (): PurchaseLineItem => ({
  id: createLineItemId(),
  medicineId: null,
  medicineName: "",
  medicineGroupName: "",
  quantity: 0,
  unitPrice: 0,
  vatTax: 0,
  salePrice: 0,
  discountAmount: 0,
  batchNumber: "",
  expiryDate: null,
});

const calculateItemsTotal = (items: PurchaseLineItem[]) =>
  items.reduce(
    (total, item) =>
      total +
      calculateMedicinePurchaseLineTotal({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatTax: item.vatTax,
        discountAmount: item.discountAmount,
      }),
    0,
  );

const createInitialFormData = (): PurchaseFormData => ({
  invoiceNumber: "",
  companyId: null,
  companyName: "",
  purchaseDate: new Date(),
  items: [],
  draftItem: createEmptyLineItem(),
  totalAmount: 0,
});

export const usePurchaseFormStore = create<PurchaseFormState>((set) => ({
  formData: createInitialFormData(),

  setFormData: (data) => {
    set((state) => {
      const nextFormData = { ...state.formData, ...data };

      if ("items" in data) {
        nextFormData.totalAmount = calculateItemsTotal(nextFormData.items);
      }

      return { formData: nextFormData };
    });
  },

  setDraftItem: (data) => {
    set((state) => ({
      formData: {
        ...state.formData,
        draftItem: {
          ...state.formData.draftItem,
          ...data,
        },
      },
    }));
  },

  addDraftItem: () => {
    let wasAdded = false;

    set((state) => {
      const draftItem = state.formData.draftItem;

      if (
        !draftItem.medicineId ||
        draftItem.quantity <= 0 ||
        draftItem.unitPrice <= 0 ||
        draftItem.salePrice <= 0
      ) {
        return state;
      }

      const nextItems = [...state.formData.items, { ...draftItem }];
      wasAdded = true;

      return {
        formData: {
          ...state.formData,
          items: nextItems,
          draftItem: createEmptyLineItem(),
          totalAmount: calculateItemsTotal(nextItems),
        },
      };
    });

    return wasAdded;
  },

  updateItem: (id, data) => {
    set((state) => {
      const nextItems = state.formData.items.map((item) =>
        item.id === id ? { ...item, ...data } : item,
      );

      return {
        formData: {
          ...state.formData,
          items: nextItems,
          totalAmount: calculateItemsTotal(nextItems),
        },
      };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const nextItems = state.formData.items.filter((item) => item.id !== id);

      return {
        formData: {
          ...state.formData,
          items: nextItems,
          totalAmount: calculateItemsTotal(nextItems),
        },
      };
    });
  },

  resetDraftItem: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        draftItem: createEmptyLineItem(),
      },
    }));
  },

  calculateTotal: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        totalAmount: calculateItemsTotal(state.formData.items),
      },
    }));
  },

  resetForm: () => {
    set({ formData: createInitialFormData() });
  },
}));

export const usePurchaseFormData = () =>
  usePurchaseFormStore((state) => state.formData);

export const useSetPurchaseFormData = () =>
  usePurchaseFormStore((state) => state.setFormData);

export const useSetPurchaseDraftItem = () =>
  usePurchaseFormStore((state) => state.setDraftItem);

export const useAddPurchaseDraftItem = () =>
  usePurchaseFormStore((state) => state.addDraftItem);

export const useUpdatePurchaseItem = () =>
  usePurchaseFormStore((state) => state.updateItem);

export const useRemovePurchaseItem = () =>
  usePurchaseFormStore((state) => state.removeItem);

export const useResetPurchaseDraftItem = () =>
  usePurchaseFormStore((state) => state.resetDraftItem);

export const useResetPurchaseForm = () =>
  usePurchaseFormStore((state) => state.resetForm);

export const useCalculatePurchaseTotal = () =>
  usePurchaseFormStore((state) => state.calculateTotal);
