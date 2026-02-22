import { create } from "zustand";
import type { ModalType, UserFilters } from "../types";

// ═══════════════════════════════════════════════════════════════
// UI Store - Modal State
// ═══════════════════════════════════════════════════════════════

interface UIState {
  // Modal state
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (modal, data = undefined) =>
    set({ activeModal: modal, modalData: data || null }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

// ═══════════════════════════════════════════════════════════════
// Filter Store - User Filters
// ═══════════════════════════════════════════════════════════════

interface UserFilterState {
  filters: UserFilters;
  setFilter: <K extends keyof UserFilters>(
    key: K,
    value: UserFilters[K],
  ) => void;
  resetFilters: () => void;
}

const defaultUserFilters: UserFilters = {
  search: undefined,
  role: undefined,
  status: "all",
  page: 1,
  limit: 20,
};

export const useUserFilterStore = create<UserFilterState>((set) => ({
  filters: defaultUserFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultUserFilters }),
}));

// ═══════════════════════════════════════════════════════════════
// Form Store - User Form State
// ═══════════════════════════════════════════════════════════════

export interface UserFormData {
  // Mode
  linkExistingStaff: boolean;
  staffId: number | null;
  staffName: string;

  // Staff fields (for new staff)
  firstName: string;
  lastName: string;

  // User fields
  username: string;
  password: string;

  // Roles
  role: string;
  staffRole: string;

  // Optional
  specialization: string;
  phoneNumber: string;
  email: string;
}

interface UserFormState {
  formData: UserFormData;
  setFormData: (data: Partial<UserFormData>) => void;
  resetForm: () => void;
}

const initialFormData: UserFormData = {
  linkExistingStaff: false,
  staffId: null,
  staffName: "",
  firstName: "",
  lastName: "",
  username: "",
  password: "",
  role: "staff",
  staffRole: "",
  specialization: "",
  phoneNumber: "",
  email: "",
};

export const useUserFormStore = create<UserFormState>((set) => ({
  formData: { ...initialFormData },
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetForm: () => set({ formData: { ...initialFormData } }),
}));

// Selector hooks for performance
export const useUserFormData = () =>
  useUserFormStore((state) => state.formData);

export const useSetUserFormData = () =>
  useUserFormStore((state) => state.setFormData);

export const useResetUserForm = () =>
  useUserFormStore((state) => state.resetForm);
