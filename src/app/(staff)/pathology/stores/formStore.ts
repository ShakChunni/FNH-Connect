/**
 * Form Data Store for Pathology Module
 * Manages hospital, patient, guardian, and pathology information for Add/Edit modals
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  HospitalData,
  PatientData,
  GuardianInfo,
  PathologyInfo,
  ValidationStatus,
  PathologyPatientData,
} from "../types";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface FormState {
  hospitalData: HospitalData;
  patientData: PatientData;
  guardianData: GuardianInfo;
  pathologyInfo: PathologyInfo;
  validationStatus: ValidationStatus;
}

interface FormActions {
  // Hospital actions
  setHospitalData: (data: HospitalData) => void;
  updateHospitalField: (
    field: keyof HospitalData,
    value: string | number | null
  ) => void;

  // Patient actions
  setPatientData: (data: PatientData) => void;
  updatePatientField: (
    field: keyof PatientData,
    value: string | number | Date | null
  ) => void;

  // Guardian actions
  setGuardianData: (data: GuardianInfo) => void;
  updateGuardianField: (
    field: keyof GuardianInfo,
    value: string | number | Date | null
  ) => void;

  // Pathology info actions
  setPathologyInfo: (data: PathologyInfo) => void;
  updatePathologyInfo: (
    field: keyof PathologyInfo,
    value: string | number | boolean | string[] | Date | null
  ) => void;

  // Validation actions
  setValidationStatus: (status: ValidationStatus) => void;
  updateValidation: (field: keyof ValidationStatus, value: boolean) => void;

  // Form management
  resetForm: () => void;
  initializeFormForEdit: (patient: PathologyPatientData) => void;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialFormState: FormState = {
  hospitalData: {
    id: null,
    name: "",
    address: "",
    phoneNumber: "",
    email: "",
    website: "",
    type: "",
  },
  patientData: {
    id: null,
    firstName: "",
    lastName: "",
    fullName: "",
    gender: "",
    age: null,
    dateOfBirth: null,
    guardianName: "",
    address: "",
    phoneNumber: "",
    email: "",
    bloodGroup: "",
  },
  guardianData: {
    name: "",
    age: null,
    dateOfBirth: null,
    gender: "",
  },
  pathologyInfo: {
    selectedTests: [],
    testCharge: 0,
    discountAmount: null,
    grandTotal: 0,
    initialPayment: 0,
    paidAmount: 0,
    dueAmount: 0,
    testDate: "",
    testCategory: "",
    remarks: "",
    isCompleted: false,
    orderedById: null,
    doneById: null,
  },
  validationStatus: {
    phone: true,
    email: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const usePathologyFormStore = create<FormState & FormActions>()(
  devtools(
    (set) => ({
      ...initialFormState,

      // Hospital actions
      setHospitalData: (data) => set({ hospitalData: data }),

      updateHospitalField: (field, value) =>
        set((state) => ({
          hospitalData: { ...state.hospitalData, [field]: value },
        })),

      // Patient actions
      setPatientData: (data) => set({ patientData: data }),

      updatePatientField: (field, value) =>
        set((state) => ({
          patientData: { ...state.patientData, [field]: value },
        })),

      // Guardian actions
      setGuardianData: (data) => set({ guardianData: data }),

      updateGuardianField: (field, value) =>
        set((state) => ({
          guardianData: { ...state.guardianData, [field]: value },
        })),

      // Pathology info actions
      setPathologyInfo: (data) => set({ pathologyInfo: data }),

      updatePathologyInfo: (field, value) =>
        set((state) => ({
          pathologyInfo: { ...state.pathologyInfo, [field]: value },
        })),

      // Validation actions
      setValidationStatus: (status) => set({ validationStatus: status }),

      updateValidation: (field, value) =>
        set((state) => ({
          validationStatus: { ...state.validationStatus, [field]: value },
        })),

      // Form management
      resetForm: () => set(initialFormState),

      initializeFormForEdit: (patient) => {
        // Helper to parse date strings
        const parseDate = (dateStr: string | null): Date | null => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        };

        // Parse test results JSON to extract selected tests
        let selectedTests: string[] = [];
        try {
          if (patient.testResults && typeof patient.testResults === "object") {
            selectedTests = patient.testResults.tests || [];
          }
        } catch (e) {
          console.error("Error parsing test results:", e);
        }

        set({
          hospitalData: {
            id: patient.hospitalId,
            name: patient.hospitalName || "",
            address: patient.hospitalAddress || "",
            phoneNumber: patient.hospitalPhone || "",
            email: patient.hospitalEmail || "",
            website: patient.hospitalWebsite || "",
            type: patient.hospitalType || "",
          },
          patientData: {
            id: patient.patientId,
            firstName: patient.patientFirstName,
            lastName: patient.patientLastName || "",
            fullName: patient.patientFullName,
            gender: patient.patientGender,
            age: patient.patientAge,
            dateOfBirth: parseDate(patient.patientDOB),
            guardianName: patient.guardianName || "",
            address: patient.address || "",
            phoneNumber: patient.mobileNumber || "",
            email: patient.email || "",
            bloodGroup: patient.bloodGroup || "",
          },
          guardianData: {
            name: patient.guardianName || "",
            age: patient.guardianAge,
            dateOfBirth: parseDate(patient.guardianDOB),
            gender: patient.guardianGender || "",
          },
          pathologyInfo: {
            selectedTests,
            testCharge: Number(patient.testCharge) || 0,
            discountAmount: Number(patient.discountAmount) || 0,
            grandTotal: Number(patient.grandTotal) || 0,
            initialPayment: Number(patient.paidAmount) || 0,
            paidAmount: Number(patient.paidAmount) || 0,
            dueAmount: Number(patient.dueAmount) || 0,
            testDate: patient.testDate || "",
            testCategory: patient.testCategory || "",
            remarks: patient.remarks || "",
            isCompleted: patient.isCompleted || false,
            orderedById: patient.orderedById,
            doneById: patient.doneById,
          },
          validationStatus: {
            phone: true,
            email: true,
          },
        });
      },
    }),
    { name: "pathology-form-store" }
  )
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useHospitalData = () =>
  usePathologyFormStore((state) => state.hospitalData);

export const usePatientData = () =>
  usePathologyFormStore((state) => state.patientData);

export const useGuardianData = () =>
  usePathologyFormStore((state) => state.guardianData);

export const usePathologyInfo = () =>
  usePathologyFormStore((state) => state.pathologyInfo);

export const useValidationStatus = () =>
  usePathologyFormStore((state) => state.validationStatus);

// Actions hook with shallow comparison to prevent infinite loops
export const useFormActions = () =>
  usePathologyFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      updateHospitalField: state.updateHospitalField,
      setPatientData: state.setPatientData,
      updatePatientField: state.updatePatientField,
      setGuardianData: state.setGuardianData,
      updateGuardianField: state.updateGuardianField,
      setPathologyInfo: state.setPathologyInfo,
      updatePathologyInfo: state.updatePathologyInfo,
      setValidationStatus: state.setValidationStatus,
      updateValidation: state.updateValidation,
      resetForm: state.resetForm,
      initializeFormForEdit: state.initializeFormForEdit,
    }))
  );
