/**
 * UI State Store for Infertility Module
 * Manages modals, messages, and UI-related state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { InfertilityPatientData } from "../types";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface MessageState {
  type: "success" | "error" | null;
  content: string;
}

interface ModalState {
  isAddOpen: boolean;
  isAddClosing: boolean;
  isEditOpen: boolean;
  isEditClosing: boolean;
  selectedPatient: InfertilityPatientData | null;
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
  openEditModal: (patient: InfertilityPatientData) => void;
  closeEditModal: () => void;

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

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialState: UIState = {
  modals: {
    isAddOpen: false,
    isAddClosing: false,
    isEditOpen: false,
    isEditClosing: false,
    selectedPatient: null,
  },
  message: {
    type: null,
    content: "",
  },
  ui: {
    showDropdowns: false,
    isInitialLoad: true,
    activeSection: "hospital",
    isDropdownOpen: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const useInfertilityUIStore = create<UIState & UIActions>()(
  devtools(
    (set) => ({
      ...initialState,

      // ─────────────────────────────────────────────────────────
      // ADD MODAL ACTIONS
      // ─────────────────────────────────────────────────────────

      openAddModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            isAddOpen: true,
            isAddClosing: false,
          },
        })),

      closeAddModal: () => {
        // Start closing animation
        set((state) => ({
          modals: { ...state.modals, isAddClosing: true },
        }));

        // After animation, fully close
        setTimeout(() => {
          set((state) => ({
            modals: {
              ...state.modals,
              isAddOpen: false,
              isAddClosing: false,
            },
          }));
        }, 300);
      },

      // ─────────────────────────────────────────────────────────
      // EDIT MODAL ACTIONS
      // ─────────────────────────────────────────────────────────

      openEditModal: (patient) =>
        set((state) => ({
          modals: {
            ...state.modals,
            isEditOpen: true,
            isEditClosing: false,
            selectedPatient: patient,
          },
        })),

      closeEditModal: () => {
        // Start closing animation
        set((state) => ({
          modals: { ...state.modals, isEditClosing: true },
        }));

        // After animation, fully close and clear patient
        setTimeout(() => {
          set((state) => ({
            modals: {
              ...state.modals,
              isEditOpen: false,
              isEditClosing: false,
              selectedPatient: null,
            },
          }));
        }, 300);
      },

      // ─────────────────────────────────────────────────────────
      // MESSAGE ACTIONS
      // ─────────────────────────────────────────────────────────

      showMessage: (type, content) => {
        set({ message: { type, content } });

        // Auto-dismiss after 2.5 seconds
        setTimeout(() => {
          set({ message: { type: null, content: "" } });
        }, 2500);
      },

      dismissMessage: () => set({ message: { type: null, content: "" } }),

      // ─────────────────────────────────────────────────────────
      // GENERAL UI ACTIONS
      // ─────────────────────────────────────────────────────────

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

      // ─────────────────────────────────────────────────────────
      // RESET
      // ─────────────────────────────────────────────────────────

      resetUI: () => set(initialState),
    }),
    { name: "infertility-ui-store" }
  )
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useModals = () => useInfertilityUIStore((state) => state.modals);

export const useMessage = () => useInfertilityUIStore((state) => state.message);

export const useUIState = () => useInfertilityUIStore((state) => state.ui);

// Actions hook with shallow comparison
export const useUIActions = () =>
  useInfertilityUIStore(
    useShallow((state) => ({
      openAddModal: state.openAddModal,
      closeAddModal: state.closeAddModal,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
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
