/**
 * Form Data Store for InfertilityTest Module
 * Manages hospital, patient, guardian, and infertilityTest information for Add/Edit modals
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  HospitalData,
  PatientData,
  SpouseInfo,
  InfertilityTestInfo,
  ValidationStatus,
  InfertilityTestData,
} from "../types";
import { parseDateOfBirth } from "@/lib/dateOfBirth";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface FormState {
  hospitalData: HospitalData;
  patientData: PatientData;
  guardianData: SpouseInfo;
  testInfo: InfertilityTestInfo;
  validationStatus: ValidationStatus;
}

interface FormActions {
  // Hospital actions
  setHospitalData: (data: HospitalData) => void;
  updateHospitalField: (
    field: keyof HospitalData,
    value: string | number | null,
  ) => void;

  // Patient actions
  setPatientData: (data: PatientData) => void;
  updatePatientField: (
    field: keyof PatientData,
    value: string | number | Date | null,
  ) => void;

  // Guardian actions
  setGuardianData: (data: SpouseInfo) => void;
  updateGuardianField: (
    field: keyof SpouseInfo,
    value: string | number | Date | null,
  ) => void;

  // InfertilityTest info actions
  setInfertilityTestInfo: (data: InfertilityTestInfo) => void;
  updateInfertilityTestInfo: (
    field: keyof InfertilityTestInfo,
    value: string | number | boolean | string[] | Date | null,
  ) => void;

  // Validation actions
  setValidationStatus: (status: ValidationStatus) => void;
  updateValidation: (field: keyof ValidationStatus, value: boolean) => void;

  // Form management
  resetForm: () => void;
  initializeFormForEdit: (patient: InfertilityTestData) => void;

  // Smart actions for financial calculations
  setTestCharge: (charge: number) => void;
  setDiscount: (type: "percentage" | "value", value: number | null) => void;
  setPaidAmount: (amount: number) => void;
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
    occupation: "",
  },
  guardianData: {
    name: "",
    age: null,
    dateOfBirth: null,
    gender: "",
    occupation: "",
  },
  testInfo: {
    selectedTests: [],
    testCharge: 0,
    discountType: "percentage",
    discountValue: null,
    discountAmount: null,
    grandTotal: 0,
    paidAmount: 0, // Tracks total paid via shifts
    dueAmount: 0,
    testDate: "",
    testCategory: "",
    remarks: "",
    isCompleted: false,
    orderedById: 3, // Prof. Dr. Sufia Khatun — default infertility doctor
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

export const useInfertilityTestFormStore = create<FormState & FormActions>()(
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

      // InfertilityTest info actions
      setInfertilityTestInfo: (data) => set({ testInfo: data }),

      updateInfertilityTestInfo: (field, value) =>
        set((state) => ({
          testInfo: { ...state.testInfo, [field]: value },
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
            id: null,
            name: patient.hospitalName || "",
            address: patient.hospitalAddress || "",
            phoneNumber: patient.hospitalPhone || "",
            email: patient.hospitalEmail || "",
            website: patient.hospitalWebsite || "",
            type: patient.hospitalType || "",
          },
          patientData: {
            id: patient.patientId,
            firstName: patient.patientFirstName || "",
            lastName: patient.patientLastName || "",
            fullName: patient.patientFullName,
            gender: patient.patientGender,
            age: patient.patientAge,
            dateOfBirth: parseDateOfBirth(patient.patientDOB),
            guardianName: patient.guardianName || "",
            address: patient.address || "",
            phoneNumber: patient.mobileNumber || "",
            email: patient.email || "",
            bloodGroup: patient.bloodGroup || "",
            occupation: "",
          },
          guardianData: {
            name: patient.guardianName || "",
            age: patient.guardianAge ?? null,
            dateOfBirth: parseDateOfBirth(patient.guardianDOB ?? null),
            gender: patient.guardianGender || "",
            occupation: "",
          },
          testInfo: {
            selectedTests,
            testCharge: Number(patient.testCharge) || 0,
            discountType:
              (patient.discountType as "percentage" | "value") || "percentage",
            discountValue: Number(patient.discountValue) || null,
            discountAmount: Number(patient.discountAmount) || 0,
            grandTotal: Number(patient.grandTotal) || 0,
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

      setTestCharge: (charge) =>
        set((state) => {
          const { discountType, discountValue, paidAmount } =
            state.testInfo;
          let discountAmount = 0;
          if (discountValue) {
            if (discountType === "percentage") {
              discountAmount = (charge * discountValue) / 100;
            } else {
              discountAmount = discountValue;
            }
          }
          const grandTotal = Math.max(0, charge - discountAmount);
          const dueAmount = Math.max(0, grandTotal - paidAmount);

          return {
            testInfo: {
              ...state.testInfo,
              testCharge: charge,
              discountAmount,
              grandTotal,
              dueAmount,
            },
          };
        }),

      setDiscount: (type, value) =>
        set((state) => {
          const { testCharge, paidAmount } = state.testInfo;
          let discountAmount = 0;
          if (value !== null) {
            if (type === "percentage") {
              discountAmount = (testCharge * value) / 100;
            } else {
              discountAmount = value;
            }
          }
          const grandTotal = Math.max(0, testCharge - discountAmount);
          const dueAmount = Math.max(0, grandTotal - paidAmount);

          return {
            testInfo: {
              ...state.testInfo,
              discountType: type,
              discountValue: value,
              discountAmount,
              grandTotal,
              dueAmount,
            },
          };
        }),

      setPaidAmount: (amount) =>
        set((state) => {
          const { grandTotal } = state.testInfo;
          // Cap paid amount at grand total
          const finalPaid = Math.min(amount, grandTotal);
          const dueAmount = Math.max(0, grandTotal - finalPaid);

          return {
            testInfo: {
              ...state.testInfo,
              paidAmount: finalPaid,
              dueAmount,
            },
          };
        }),
    }),
    { name: "infertilityTest-form-store" },
  ),
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useHospitalData = () =>
  useInfertilityTestFormStore((state) => state.hospitalData);

export const usePatientData = () =>
  useInfertilityTestFormStore((state) => state.patientData);

export const useGuardianData = () =>
  useInfertilityTestFormStore((state) => state.guardianData);

export const useInfertilityTestInfo = () =>
  useInfertilityTestFormStore((state) => state.testInfo);

export const useValidationStatus = () =>
  useInfertilityTestFormStore((state) => state.validationStatus);

// Actions hook with shallow comparison to prevent infinite loops
export const useFormActions = () =>
  useInfertilityTestFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      updateHospitalField: state.updateHospitalField,
      setPatientData: state.setPatientData,
      updatePatientField: state.updatePatientField,
      setGuardianData: state.setGuardianData,
      updateGuardianField: state.updateGuardianField,
      setInfertilityTestInfo: state.setInfertilityTestInfo,
      updateInfertilityTestInfo: state.updateInfertilityTestInfo,
      setValidationStatus: state.setValidationStatus,
      updateValidation: state.updateValidation,
      resetForm: state.resetForm,
      initializeFormForEdit: state.initializeFormForEdit,
      setTestCharge: state.setTestCharge,
      setDiscount: state.setDiscount,
      setPaidAmount: state.setPaidAmount,
    })),
  );
