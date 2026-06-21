/**
 * Sale Form Store
 * Zustand store for managing the Record Sale multi-item cart modal.
 *
 * Replaces the old single-medicine form store. Totals are derived
 * directly from `items` so the cart cannot be left in an inconsistent
 * state by an out-of-order update.
 */

import { create } from "zustand";

const generateClientId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export interface SalePatientSelection {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
  gender: string;
}

export interface MedicineSaleDraftItem {
  clientId: string;
  medicineId: number | null;
  medicineName: string;
  genericName: string | null;
  groupName: string | null;
  companyName: string | null;
  currentStock: number;
  lowStockThreshold: number;
  quantity: number;
  unitPrice: number;
  requestedMedicineName: string | null;
  operationName: string | null;
  packageCode: string | null;
  matchReason: string | null;
}

export interface GyneContextSnapshot {
  admissionId: number;
  admissionNumber: string;
  status: string;
  departmentName: string;
  hasLucsPackage: boolean;
}

export interface SaleFormData {
  patient: SalePatientSelection | null;
  saleDate: Date;
  items: MedicineSaleDraftItem[];
  gyneContext: GyneContextSnapshot | null;
}

interface SaleFormState {
  formData: SaleFormData;
  setPatient: (patient: SalePatientSelection | null) => void;
  setSaleDate: (date: Date) => void;
  appendBlankRow: () => void;
  removeRow: (clientId: string) => void;
  clearRows: () => void;
  updateRow: (
    clientId: string,
    patch: Partial<MedicineSaleDraftItem>,
  ) => void;
  setMedicineForRow: (
    clientId: string,
    medicine: {
      id: number;
      genericName: string;
      brandName?: string | null;
      currentStock: number;
      lowStockThreshold: number;
      defaultSalePrice: number;
      group: { id: number; name: string };
      companyName?: string | null;
    },
  ) => void;
  applyPackage: (rows: Omit<MedicineSaleDraftItem, "clientId">[]) => void;
  setGyneContext: (context: GyneContextSnapshot | null) => void;
  resetForm: () => void;
}

const blankRow = (): MedicineSaleDraftItem => ({
  clientId: generateClientId(),
  medicineId: null,
  medicineName: "",
  genericName: null,
  groupName: null,
  companyName: null,
  currentStock: 0,
  lowStockThreshold: 0,
  quantity: 1,
  unitPrice: 0,
  requestedMedicineName: null,
  operationName: null,
  packageCode: null,
  matchReason: null,
});

const initialFormData: SaleFormData = {
  patient: null,
  saleDate: new Date(),
  items: [],
  gyneContext: null,
};

export const useSaleFormStore = create<SaleFormState>((set) => ({
  formData: { ...initialFormData },

  setPatient: (patient) =>
    set((state) => ({
      formData: { ...state.formData, patient },
    })),

  setSaleDate: (saleDate) =>
    set((state) => ({ formData: { ...state.formData, saleDate } })),

  appendBlankRow: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        items: [...state.formData.items, blankRow()],
      },
    })),

  removeRow: (clientId) =>
    set((state) => ({
      formData: {
        ...state.formData,
        items: state.formData.items.filter((r) => r.clientId !== clientId),
      },
    })),

  clearRows: () =>
    set((state) => ({ formData: { ...state.formData, items: [] } })),

  updateRow: (clientId, patch) =>
    set((state) => ({
      formData: {
        ...state.formData,
        items: state.formData.items.map((r) =>
          r.clientId === clientId ? { ...r, ...patch } : r,
        ),
      },
    })),

  setMedicineForRow: (clientId, medicine) =>
    set((state) => {
      const target = state.formData.items.find(
        (item) => item.clientId === clientId,
      );
      if (!target) return state;

      const duplicate = state.formData.items.find(
        (item) =>
          item.clientId !== clientId && item.medicineId === medicine.id,
      );
      const displayName = medicine.brandName?.trim() || medicine.genericName;

      if (duplicate) {
        return {
          formData: {
            ...state.formData,
            items: state.formData.items
              .filter((item) => item.clientId !== clientId)
              .map((item) =>
                item.clientId === duplicate.clientId
                  ? {
                      ...item,
                      medicineName: displayName,
                      genericName: medicine.genericName,
                      groupName: medicine.group.name,
                      currentStock: medicine.currentStock,
                      lowStockThreshold: medicine.lowStockThreshold,
                      quantity: item.quantity + target.quantity,
                      unitPrice: roundToTwoDecimals(
                        medicine.defaultSalePrice || 0,
                      ),
                      requestedMedicineName:
                        target.requestedMedicineName ??
                        item.requestedMedicineName,
                      operationName:
                        target.operationName ?? item.operationName,
                      packageCode: target.packageCode ?? item.packageCode,
                      matchReason: target.matchReason ?? item.matchReason,
                    }
                  : item,
              ),
          },
        };
      }

      return {
        formData: {
          ...state.formData,
          items: state.formData.items.map((item) =>
            item.clientId === clientId
              ? {
                  ...item,
                  medicineId: medicine.id,
                  medicineName: displayName,
                  genericName: medicine.genericName,
                  groupName: medicine.group.name,
                  companyName:
                    medicine.companyName ?? item.companyName ?? null,
                  currentStock: medicine.currentStock,
                  lowStockThreshold: medicine.lowStockThreshold,
                  unitPrice: roundToTwoDecimals(
                    medicine.defaultSalePrice || 0,
                  ),
                }
              : item,
          ),
        },
      };
    }),

  applyPackage: (rows) =>
    set((state) => {
      const merged = [...state.formData.items];

      for (const row of rows) {
        const matchIndex = merged.findIndex(
          (item) =>
            item.medicineId !== null &&
            row.medicineId !== null &&
            item.medicineId === row.medicineId,
        );

        if (matchIndex >= 0) {
          const matched = merged[matchIndex];
          merged[matchIndex] = {
            ...matched,
            quantity: Math.max(1, matched.quantity + row.quantity),
            unitPrice: row.unitPrice > 0 ? row.unitPrice : matched.unitPrice,
            packageCode: row.packageCode ?? matched.packageCode,
            operationName: row.operationName ?? matched.operationName,
            matchReason: row.matchReason ?? matched.matchReason,
            requestedMedicineName:
              row.requestedMedicineName ?? matched.requestedMedicineName,
          };
        } else {
          merged.push({
            ...row,
            clientId: generateClientId(),
          });
        }
      }

      return {
        formData: { ...state.formData, items: merged },
      };
    }),

  setGyneContext: (gyneContext) =>
    set((state) => ({ formData: { ...state.formData, gyneContext } })),

  resetForm: () =>
    set({ formData: { ...initialFormData, saleDate: new Date() } }),
}));

// Selector hooks — kept exported under the same names as the old store
// so the modal can migrate without breaking imports.
export const useSaleFormData = () =>
  useSaleFormStore((state) => state.formData);

export const useSetPatient = () =>
  useSaleFormStore((state) => state.setPatient);
export const useSetSaleDate = () =>
  useSaleFormStore((state) => state.setSaleDate);
export const useAppendBlankRow = () =>
  useSaleFormStore((state) => state.appendBlankRow);
export const useRemoveRow = () =>
  useSaleFormStore((state) => state.removeRow);
export const useClearRows = () =>
  useSaleFormStore((state) => state.clearRows);
export const useUpdateRow = () =>
  useSaleFormStore((state) => state.updateRow);
export const useSetMedicineForRow = () =>
  useSaleFormStore((state) => state.setMedicineForRow);
export const useApplyPackage = () =>
  useSaleFormStore((state) => state.applyPackage);
export const useSetGyneContext = () =>
  useSaleFormStore((state) => state.setGyneContext);
export const useResetSaleForm = () =>
  useSaleFormStore((state) => state.resetForm);
