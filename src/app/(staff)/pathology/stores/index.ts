/**
 * Pathology Module Stores - Main Export Point
 *
 * This file re-exports all store hooks for backward compatibility
 * while organizing them into focused, smaller stores:
 * - formStore: Hospital, patient, guardian, and pathology data
 * - uiStore: Modals, messages, and UI state
 */

// Export form store hooks
export {
  usePathologyFormStore,
  useHospitalData,
  usePatientData,
  useGuardianData,
  usePathologyInfo,
  useValidationStatus,
  useFormActions,
} from "./formStore";

// Export UI store hooks
export {
  usePathologyUIStore,
  useModals,
  useMessage,
  useUIState,
  useUIActions,
} from "./uiStore";

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY EXPORTS
// These maintain the old API while using the new refactored stores
// ═══════════════════════════════════════════════════════════════

// Form state selectors (backward compatible names)
export { useHospitalData as usePathologyHospitalData } from "./formStore";
export { usePatientData as usePathologyPatientData } from "./formStore";
export { useGuardianData as usePathologyGuardianData } from "./formStore";
export { usePathologyInfo as usePathologyPathologyInfo } from "./formStore";
export { useValidationStatus as usePathologyValidationStatus } from "./formStore";

// UI state selectors (backward compatible names)
export { useModals as usePathologyModals } from "./uiStore";
export { useMessage as usePathologyMessage } from "./uiStore";
export { useUIState as usePathologyUI } from "./uiStore";

// ═══════════════════════════════════════════════════════════════
// COMBINED ACTIONS HOOK
// Uses direct store selectors to ensure stable references
// ═══════════════════════════════════════════════════════════════

import { usePathologyFormStore } from "./formStore";
import { usePathologyUIStore } from "./uiStore";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";

/**
 * Combined actions hook - backward compatible with old API
 * Directly selects from stores to ensure stable function references
 */
export const usePathologyActions = () => {
  // Select actions directly from each store using useShallow
  const formActions = usePathologyFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      setPatientData: state.setPatientData,
      setGuardianData: state.setGuardianData,
      setPathologyInfo: state.setPathologyInfo,
      updatePathologyInfo: state.updatePathologyInfo,
      setValidationStatus: state.setValidationStatus,
      resetForm: state.resetForm,
      initializeFormForEdit: state.initializeFormForEdit,
    }))
  );

  const uiActions = usePathologyUIStore(
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

  // Return stable combined object - useMemo is safe here because
  // the useShallow selectors return stable references
  return useMemo(
    () => ({
      // Form actions
      setHospitalData: formActions.setHospitalData,
      setPatientData: formActions.setPatientData,
      setGuardianData: formActions.setGuardianData,
      setPathologyInfo: formActions.setPathologyInfo,
      updatePathologyInfo: formActions.updatePathologyInfo,
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

      // Reset all
      reset: () => {
        formActions.resetForm();
        uiActions.resetUI();
      },
    }),
    [formActions, uiActions]
  );
};
