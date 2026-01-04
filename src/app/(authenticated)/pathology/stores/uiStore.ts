/**
 * UI State Store for Pathology Module
 * Manages modal states, messages, and UI-related state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { PathologyPatientData } from "../types";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface ModalState {
  // Add modal
  isAddOpen: boolean;
  isAddClosing: boolean;

  // Edit modal
  isEditOpen: boolean;
  isEditClosing: boolean;
  selectedPatient: PathologyPatientData | null;
}

interface MessageState {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "info";
}

interface UIState {
  showDropdowns: boolean;
  isInitialLoad: boolean;
  activeSection: string;
  isDropdownOpen: boolean;
}

interface UIActions {
  // Modal actions
  openAddModal: () => void;
  closeAddModal: () => void;
  afterAddModalClosed: () => void;
  openEditModal: (patient: PathologyPatientData) => void;
  closeEditModal: () => void;
  afterEditModalClosed: () => void;

  // Message actions
  showMessage: (message: string, type: "success" | "error" | "info") => void;
  dismissMessage: () => void;

  // UI state actions
  setShowDropdowns: (show: boolean) => void;
  toggleDropdowns: () => void;
  setIsInitialLoad: (isLoading: boolean) => void;
  setActiveSection: (section: string) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;

  // Reset
  resetUI: () => void;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialUIState: ModalState & MessageState & UIState = {
  // Modals
  isAddOpen: false,
  isAddClosing: false,
  isEditOpen: false,
  isEditClosing: false,
  selectedPatient: null,

  // Messages
  isVisible: false,
  message: "",
  type: "info",

  // UI State
  showDropdowns: false,
  isInitialLoad: true,
  activeSection: "hospital",
  isDropdownOpen: false,
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const usePathologyUIStore = create<
  ModalState & MessageState & UIState & UIActions
>()(
  devtools(
    (set) => ({
      ...initialUIState,

      // Modal actions
      openAddModal: () =>
        set({
          isAddOpen: true,
          isAddClosing: false,
        }),

      closeAddModal: () =>
        set((state) => {
          if (!state.isAddOpen) return state;
          return {
            isAddClosing: true,
            isAddOpen: false,
          };
        }),

      afterAddModalClosed: () =>
        set({
          isAddClosing: false,
        }),

      openEditModal: (patient) =>
        set({
          isEditOpen: true,
          isEditClosing: false,
          selectedPatient: patient,
        }),

      closeEditModal: () =>
        set((state) => {
          if (!state.isEditOpen) return state;
          return {
            isEditClosing: true,
            isEditOpen: false,
            // Keep selectedPatient for exit animation
          };
        }),

      afterEditModalClosed: () =>
        set({
          isEditClosing: false,
          selectedPatient: null,
        }),

      // Message actions
      showMessage: (message, type) =>
        set({
          isVisible: true,
          message,
          type,
        }),

      dismissMessage: () =>
        set({
          isVisible: false,
          message: "",
        }),

      // UI state actions
      setShowDropdowns: (show) => set({ showDropdowns: show }),

      toggleDropdowns: () =>
        set((state) => ({ showDropdowns: !state.showDropdowns })),

      setIsInitialLoad: (isLoading) => set({ isInitialLoad: isLoading }),

      setActiveSection: (section) => set({ activeSection: section }),

      setIsDropdownOpen: (isOpen) => set({ isDropdownOpen: isOpen }),

      // Reset
      resetUI: () => set(initialUIState),
    }),
    { name: "pathology-ui-store" }
  )
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useModals = () =>
  usePathologyUIStore(
    useShallow((state) => ({
      isAddOpen: state.isAddOpen,
      isAddClosing: state.isAddClosing,
      isEditOpen: state.isEditOpen,
      isEditClosing: state.isEditClosing,
      selectedPatient: state.selectedPatient,
    }))
  );

export const useMessage = () =>
  usePathologyUIStore(
    useShallow((state) => ({
      isVisible: state.isVisible,
      message: state.message,
      type: state.type,
    }))
  );

export const useUIState = () =>
  usePathologyUIStore(
    useShallow((state) => ({
      showDropdowns: state.showDropdowns,
      isInitialLoad: state.isInitialLoad,
      activeSection: state.activeSection,
      isDropdownOpen: state.isDropdownOpen,
    }))
  );

export const useUIActions = () =>
  usePathologyUIStore(
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
