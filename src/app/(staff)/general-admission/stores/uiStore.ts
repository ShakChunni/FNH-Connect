/**
 * General Admission UI Store
 * Manages modal states, messages, and general UI state
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { AdmissionPatientData } from "../types";

// ═══════════════════════════════════════════════════════════════
// State Interfaces
// ═══════════════════════════════════════════════════════════════

interface ModalState {
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingPatient: AdmissionPatientData | null;
  isReceiptModalOpen: boolean;
  receiptData: AdmissionPatientData | null;
  receiptType: "admission" | "full" | null;
}

interface MessageState {
  type: "success" | "error" | null;
  content: string | null;
}

interface UIGeneralState {
  showDropdowns: boolean;
  isInitialLoad: boolean;
  activeSection: string;
  isDropdownOpen: boolean;
}

interface UIState {
  modals: ModalState;
  message: MessageState;
  ui: UIGeneralState;
}

interface UIActions {
  // Modal actions
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (patient: AdmissionPatientData) => void;
  closeEditModal: () => void;
  openReceiptModal: (
    patient: AdmissionPatientData,
    type: "admission" | "full"
  ) => void;
  closeReceiptModal: () => void;

  // Called after modal animation completes
  afterAddModalClosed: () => void;
  afterEditModalClosed: () => void;

  // Message actions
  showMessage: (type: "success" | "error", content: string) => void;
  dismissMessage: () => void;

  // General UI actions
  setShowDropdowns: (show: boolean) => void;
  toggleDropdowns: () => void;
  setIsInitialLoad: (isInitial: boolean) => void;
  setActiveSection: (section: string) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;

  // Reset
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

const initialModalState: ModalState = {
  isAddModalOpen: false,
  isEditModalOpen: false,
  editingPatient: null,
  isReceiptModalOpen: false,
  receiptData: null,
  receiptType: null,
};

const initialMessageState: MessageState = {
  type: null,
  content: null,
};

const initialUIGeneralState: UIGeneralState = {
  showDropdowns: false,
  isInitialLoad: true,
  activeSection: "hospital",
  isDropdownOpen: false,
};

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

export const useAdmissionUIStore = create<UIStore>((set) => ({
  // Initial state
  modals: { ...initialModalState },
  message: { ...initialMessageState },
  ui: { ...initialUIGeneralState },

  // Modal actions
  openAddModal: () =>
    set((state) => ({
      modals: { ...state.modals, isAddModalOpen: true },
    })),

  closeAddModal: () =>
    set((state) => ({
      modals: { ...state.modals, isAddModalOpen: false },
    })),

  openEditModal: (patient) =>
    set((state) => ({
      modals: {
        ...state.modals,
        isEditModalOpen: true,
        editingPatient: patient,
      },
    })),

  closeEditModal: () =>
    set((state) => ({
      modals: { ...state.modals, isEditModalOpen: false },
    })),

  openReceiptModal: (patient, type) =>
    set((state) => ({
      modals: {
        ...state.modals,
        isReceiptModalOpen: true,
        receiptData: patient,
        receiptType: type,
      },
    })),

  closeReceiptModal: () =>
    set((state) => ({
      modals: {
        ...state.modals,
        isReceiptModalOpen: false,
        receiptData: null,
        receiptType: null,
      },
    })),

  afterAddModalClosed: () =>
    set((state) => ({
      modals: { ...state.modals },
    })),

  afterEditModalClosed: () =>
    set((state) => ({
      modals: { ...state.modals, editingPatient: null },
    })),

  // Message actions
  showMessage: (type, content) =>
    set({
      message: { type, content },
    }),

  dismissMessage: () =>
    set({
      message: { type: null, content: null },
    }),

  // General UI actions
  setShowDropdowns: (show) =>
    set((state) => ({
      ui: { ...state.ui, showDropdowns: show },
    })),

  toggleDropdowns: () =>
    set((state) => ({
      ui: { ...state.ui, showDropdowns: !state.ui.showDropdowns },
    })),

  setIsInitialLoad: (isInitial) =>
    set((state) => ({
      ui: { ...state.ui, isInitialLoad: isInitial },
    })),

  setActiveSection: (section) =>
    set((state) => ({
      ui: { ...state.ui, activeSection: section },
    })),

  setIsDropdownOpen: (isOpen) =>
    set((state) => ({
      ui: { ...state.ui, isDropdownOpen: isOpen },
    })),

  // Reset
  resetUI: () =>
    set({
      modals: { ...initialModalState },
      message: { ...initialMessageState },
      ui: { ...initialUIGeneralState },
    }),
}));

// ═══════════════════════════════════════════════════════════════
// Selector Hooks
// ═══════════════════════════════════════════════════════════════

export const useModalState = () => useAdmissionUIStore((state) => state.modals);

export const useMessageState = () =>
  useAdmissionUIStore((state) => state.message);

export const useUIState = () => useAdmissionUIStore((state) => state.ui);

// Actions hook with shallow comparison
export const useUIActions = () =>
  useAdmissionUIStore(
    useShallow((state) => ({
      openAddModal: state.openAddModal,
      closeAddModal: state.closeAddModal,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
      openReceiptModal: state.openReceiptModal,
      closeReceiptModal: state.closeReceiptModal,
      afterAddModalClosed: state.afterAddModalClosed,
      afterEditModalClosed: state.afterEditModalClosed,
      showMessage: state.showMessage,
      dismissMessage: state.dismissMessage,
      setShowDropdowns: state.setShowDropdowns,
      toggleDropdowns: state.toggleDropdowns,
      setIsInitialLoad: state.setIsInitialLoad,
      setActiveSection: state.setActiveSection,
      setIsDropdownOpen: state.setIsDropdownOpen,
      resetUI: state.resetUI,
    }))
  );
