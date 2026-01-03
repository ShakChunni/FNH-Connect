/**
 * Infertility Module Stores - Main Export Point
 *
 * This file re-exports all store hooks for backward compatibility
 * while organizing them into focused, smaller stores:
 * - formStore: Hospital, patient, spouse, and medical data
 * - uiStore: Modals, messages, and UI state
 * - filterStore: Filters and search parameters
 */

// Export form store hooks
export {
  useInfertilityFormStore,
  useHospitalData,
  usePatientData,
  useSpouseData,
  useMedicalInfo,
  useValidationStatus,
  useFormActions,
} from "./formStore";

// Export UI store hooks
export {
  useInfertilityUIStore,
  useModals,
  useMessage,
  useUIState,
  useUIActions,
} from "./uiStore";

// Export filter store hooks
export {
  useInfertilityFilterStore,
  useFilters,
  useSearchParams,
  useFilterActions,
  usePagination,
  useFilterValues,
} from "./filterStore";

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY EXPORTS
// These maintain the old API while using the new refactored stores
// ═══════════════════════════════════════════════════════════════

// Form state selectors (backward compatible names)
export { useHospitalData as useInfertilityHospitalData } from "./formStore";
export { usePatientData as useInfertilityPatientData } from "./formStore";
export { useSpouseData as useInfertilitySpouseData } from "./formStore";
export { useMedicalInfo as useInfertilityMedicalInfo } from "./formStore";
export { useValidationStatus as useInfertilityValidationStatus } from "./formStore";

// UI state selectors (backward compatible names)
export { useModals as useInfertilityModals } from "./uiStore";
export { useMessage as useInfertilityMessage } from "./uiStore";
export { useUIState as useInfertilityUI } from "./uiStore";

// Filter state selectors (backward compatible names)
export { useFilters as useInfertilityFilters } from "./filterStore";
export { useSearchParams as useInfertilitySearch } from "./filterStore";

// ═══════════════════════════════════════════════════════════════
// COMBINED ACTIONS HOOK
// Uses direct store selectors to ensure stable references
// ═══════════════════════════════════════════════════════════════

import { useInfertilityFormStore } from "./formStore";
import { useInfertilityUIStore } from "./uiStore";
import { useInfertilityFilterStore } from "./filterStore";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";

/**
 * Combined actions hook - backward compatible with old API
 * Directly selects from stores to ensure stable function references
 */
export const useInfertilityActions = () => {
  // Select actions directly from each store using useShallow
  const formActions = useInfertilityFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      setPatientData: state.setPatientData,
      setSpouseData: state.setSpouseData,
      setMedicalInfo: state.setMedicalInfo,
      updateMedicalInfo: state.updateMedicalInfo,
      setValidationStatus: state.setValidationStatus,
      resetForm: state.resetForm,
      initializeFormForEdit: state.initializeFormForEdit,
    }))
  );

  const uiActions = useInfertilityUIStore(
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

  const filterActions = useInfertilityFilterStore(
    useShallow((state) => ({
      setFilters: state.setFilters,
      updateFilter: state.updateFilter,
      setSearchParams: state.setSearchParams,
      resetFilters: state.resetFilters,
    }))
  );

  // Return stable combined object - useMemo is safe here because
  // the useShallow selectors return stable references
  return useMemo(
    () => ({
      // Form actions
      setHospitalData: formActions.setHospitalData,
      setPatientData: formActions.setPatientData,
      setSpouseData: formActions.setSpouseData,
      setMedicalInfo: formActions.setMedicalInfo,
      updateMedicalInfo: formActions.updateMedicalInfo,
      setValidationStatus: formActions.setValidationStatus,
      resetFormState: formActions.resetForm,
      initializeFormForEdit: formActions.initializeFormForEdit,

      // UI actions
      openAddModal: uiActions.openAddModal,
      closeAddModal: uiActions.closeAddModal,
      openEditModal: uiActions.openEditModal,
      closeEditModal: uiActions.closeEditModal,
      showMessage: uiActions.showMessage,
      dismissMessage: uiActions.dismissMessage,
      setShowDropdowns: uiActions.setShowDropdowns,
      toggleDropdowns: uiActions.toggleDropdowns,
      setIsInitialLoad: uiActions.setIsInitialLoad,
      setActiveSection: uiActions.setActiveSection,
      setIsDropdownOpen: uiActions.setIsDropdownOpen,

      // Filter actions
      setFilters: filterActions.setFilters,
      updateFilter: filterActions.updateFilter,
      setSearchParams: filterActions.setSearchParams,
      resetFilters: filterActions.resetFilters,

      // Reset all
      reset: () => {
        formActions.resetForm();
        uiActions.resetUI();
        filterActions.resetFilters();
      },
    }),
    [formActions, uiActions, filterActions]
  );
};
