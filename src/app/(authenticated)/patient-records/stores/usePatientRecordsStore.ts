import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { PatientData } from "../types";

interface PatientRecordsState {
  // Edit modal state
  isEditOpen: boolean;
  isEditClosing: boolean;
  selectedPatient: PatientData | null;

  // Pagination state
  pagination: {
    page: number;
    limit: number;
  };

  // Actions
  openEditModal: (patient: PatientData) => void;
  closeEditModal: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;
}

const initialPagination = {
  page: 1,
  limit: 15,
};

export const usePatientRecordsStore = create<PatientRecordsState>((set) => ({
  // Initial state
  isEditOpen: false,
  isEditClosing: false,
  selectedPatient: null,
  pagination: initialPagination,

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

  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page },
    })),

  setLimit: (limit) =>
    set((state) => ({
      pagination: { ...state.pagination, limit, page: 1 },
    })),

  resetPagination: () =>
    set({
      pagination: initialPagination,
    }),
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

export const usePagination = () =>
  usePatientRecordsStore((state) => state.pagination);

export const usePatientActions = () =>
  usePatientRecordsStore(
    useShallow((state) => ({
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
      setPage: state.setPage,
      setLimit: state.setLimit,
      resetPagination: state.resetPagination,
    }))
  );

export default usePatientRecordsStore;
