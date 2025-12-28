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

// Export filter store hooks
export {
  usePathologyFilterStore,
  usePathologyFilterPanelState,
  usePathologyFilterValues,
  usePathologyFilterActions,
  getDateRangeFromOption,
} from "./filterStore";
export type {
  PathologyStatus,
  FilterValues as PathologyFilterValues,
} from "./filterStore";

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
      setTestCharge: state.setTestCharge,
      setDiscount: state.setDiscount,
      setPaidAmount: state.setPaidAmount,
    }))
  );

  const uiActions = usePathologyUIStore(
    useShallow((state) => ({
      openAddModal: state.openAddModal,
      closeAddModal: state.closeAddModal,
      afterAddModalClosed: state.afterAddModalClosed,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
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
      setTestCharge: formActions.setTestCharge,
      setDiscount: formActions.setDiscount,
      setPaidAmount: formActions.setPaidAmount,

      // UI actions - openAddModal now resets form first for clean state
      openAddModal: () => {
        formActions.resetForm(); // Reset form before opening to ensure clean state
        uiActions.openAddModal();
      },
      closeAddModal: () => {
        formActions.resetForm(); // Also reset on close to ensure clean state
        uiActions.closeAddModal();
      },
      openEditModal: uiActions.openEditModal,
      closeEditModal: () => {
        formActions.resetForm(); // Reset form on close
        uiActions.closeEditModal();
      },
      afterAddModalClosed: uiActions.afterAddModalClosed,
      afterEditModalClosed: uiActions.afterEditModalClosed,
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
