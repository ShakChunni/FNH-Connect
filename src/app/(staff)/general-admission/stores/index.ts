/**
 * General Admission Stores - Barrel Export
 */

// Form Store
export {
  useAdmissionFormStore,
  useAdmissionHospitalData,
  useAdmissionPatientData,
  useAdmissionDepartmentData,
  useAdmissionDoctorData,
  useAdmissionInfo,
  useAdmissionFinancialData,
  useAdmissionValidationStatus,
  useAdmissionFormActions,
} from "./formStore";

// UI Store
export {
  useAdmissionUIStore,
  useModalState,
  useMessageState,
  useUIState,
  useUIActions,
} from "./uiStore";

// Filter Store
export {
  useFilterStore,
  useFilterPanelState,
  useFilterValues,
  useFilterActions,
  getDateRangeFromOption,
} from "./filterStore";

// Combined actions hook for convenience
import { useShallow } from "zustand/react/shallow";
import { useAdmissionFormStore } from "./formStore";
import { useAdmissionUIStore } from "./uiStore";

/**
 * Combined actions hook - provides all actions from both stores
 */
export const useAdmissionActions = () => {
  const formActions = useAdmissionFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      setPatientData: state.setPatientData,
      setDepartmentData: state.setDepartmentData,
      setDoctorData: state.setDoctorData,
      setAdmissionInfo: state.setAdmissionInfo,
      updateAdmissionInfo: state.updateAdmissionInfo,
      setFinancialData: state.setFinancialData,
      updateFinancialData: state.updateFinancialData,
      setValidationStatus: state.setValidationStatus,
      initializeFormForEdit: state.initializeFormForEdit,
      resetForm: state.resetForm,
      calculateTotals: state.calculateTotals,
      setCharge: state.setCharge,
      setDiscount: state.setDiscount,
      setPaidAmount: state.setPaidAmount,
    }))
  );

  const uiActions = useAdmissionUIStore(
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

  return {
    ...formActions,
    ...uiActions,
    reset: () => {
      formActions.resetForm();
      uiActions.resetUI();
    },
  };
};
