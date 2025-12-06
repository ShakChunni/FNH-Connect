import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { PatientData } from "../types";

interface PatientRecordsState {
  // Edit modal state
  isEditOpen: boolean;
  isEditClosing: boolean;
  selectedPatient: PatientData | null;

  // Actions
  openEditModal: (patient: PatientData) => void;
  closeEditModal: () => void;
}

export const usePatientRecordsStore = create<PatientRecordsState>((set) => ({
  // Initial state
  isEditOpen: false,
  isEditClosing: false,
  selectedPatient: null,

  // Actions
  openEditModal: (patient) =>
    set({
      isEditOpen: true,
      isEditClosing: false,
      selectedPatient: patient,
    }),

  closeEditModal: () => {
    set({ isEditClosing: true });
    // Delay actual close for animation
    setTimeout(() => {
      set({
        isEditOpen: false,
        isEditClosing: false,
        selectedPatient: null,
      });
    }, 300);
  },
}));

// Selector hooks using useShallow to prevent infinite loops
export const usePatientModals = () =>
  usePatientRecordsStore(
    useShallow((state) => ({
      isEditOpen: state.isEditOpen,
      isEditClosing: state.isEditClosing,
      selectedPatient: state.selectedPatient,
    }))
  );

export const usePatientActions = () =>
  usePatientRecordsStore(
    useShallow((state) => ({
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
    }))
  );

export default usePatientRecordsStore;
