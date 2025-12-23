/**
 * Form Data Store for Infertility Module
 * Manages hospital, patient, spouse, and medical information for Add/Edit modals
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  HospitalData,
  PatientData,
  SpouseInfo,
  InfertilityMedicalData,
  ValidationStatus,
  InfertilityPatientData,
} from "../types";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface FormState {
  hospitalData: HospitalData;
  patientData: PatientData;
  spouseData: SpouseInfo;
  medicalInfo: InfertilityMedicalData;
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

  // Spouse actions
  setSpouseData: (data: SpouseInfo) => void;
  updateSpouseField: (
    field: keyof SpouseInfo,
    value: string | number | Date | null
  ) => void;

  // Medical info actions
  setMedicalInfo: (data: InfertilityMedicalData) => void;
  updateMedicalInfo: (
    field: keyof InfertilityMedicalData,
    value: string | number | Date | null
  ) => void;

  // Validation actions
  setValidationStatus: (status: ValidationStatus) => void;
  updateValidation: (field: keyof ValidationStatus, value: boolean) => void;

  // Form management
  resetForm: () => void;
  initializeFormForEdit: (patient: InfertilityPatientData) => void;
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
    gender: "Female",
    age: null,
    dateOfBirth: null,
    guardianName: "",
    address: "",
    phoneNumber: "",
    email: "",
    bloodGroup: "",
    occupation: "",
  },
  spouseData: {
    name: "",
    age: null,
    dateOfBirth: null,
    gender: "Male",
    occupation: "",
    phoneNumber: "",
    email: "",
  },
  medicalInfo: {
    yearsMarried: null,
    yearsTrying: null,
    infertilityType: "",
    para: "",
    gravida: "",
    weight: null,
    height: null,
    bmi: null,
    bloodPressure: "",
    medicalHistory: "",
    surgicalHistory: "",
    menstrualHistory: "",
    contraceptiveHistory: "",
    referralSource: "",
    chiefComplaint: "",
    treatmentPlan: "",
    medications: "",
    nextAppointment: null,
    status: "Active",
    notes: "",
  },
  validationStatus: {
    phone: true,
    email: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE CREATION
// ═══════════════════════════════════════════════════════════════

export const useInfertilityFormStore = create<FormState & FormActions>()(
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

      // Spouse actions
      setSpouseData: (data) => set({ spouseData: data }),

      updateSpouseField: (field, value) =>
        set((state) => ({
          spouseData: { ...state.spouseData, [field]: value },
        })),

      // Medical info actions
      setMedicalInfo: (data) => set({ medicalInfo: data }),

      updateMedicalInfo: (field, value) =>
        set((state) => ({
          medicalInfo: { ...state.medicalInfo, [field]: value },
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
            guardianName: patient.husbandName || "",
            address: patient.address || "",
            phoneNumber: patient.mobileNumber || "",
            email: patient.email || "",
            bloodGroup: patient.bloodGroup || "",
            occupation: patient.patientOccupation || "",
          },
          spouseData: {
            name: patient.husbandName || "",
            age: patient.husbandAge,
            dateOfBirth: parseDate(patient.husbandDOB),
            gender: patient.spouseGender || "Male",
            occupation: patient.husbandOccupation || "",
            phoneNumber: patient.husbandPhone || "",
            email: patient.husbandEmail || "",
          },
          medicalInfo: {
            yearsMarried: patient.yearsMarried
              ? Number(patient.yearsMarried)
              : null,
            yearsTrying: patient.yearsTrying
              ? Number(patient.yearsTrying)
              : null,
            infertilityType: patient.infertilityType || "",
            para: patient.para || "",
            gravida: patient.gravida || "",
            weight: patient.weight ? Number(patient.weight) : null,
            height: patient.height ? Number(patient.height) : null,
            bmi: patient.bmi ? Number(patient.bmi) : null,
            bloodPressure: patient.bloodPressure || "",
            medicalHistory: patient.medicalHistory || "",
            surgicalHistory: patient.surgicalHistory || "",
            menstrualHistory: patient.menstrualHistory || "",
            contraceptiveHistory: patient.contraceptiveHistory || "",
            referralSource: patient.referralSource || "",
            chiefComplaint: patient.chiefComplaint || "",
            treatmentPlan: patient.treatmentPlan || "",
            medications: patient.medications || "",
            nextAppointment: parseDate(patient.nextAppointment),
            status: patient.status || "Active",
            notes: patient.notes || "",
          },
          validationStatus: {
            phone: true,
            email: true,
          },
        });
      },
    }),
    { name: "infertility-form-store" }
  )
);

// ═══════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════

export const useHospitalData = () =>
  useInfertilityFormStore((state) => state.hospitalData);

export const usePatientData = () =>
  useInfertilityFormStore((state) => state.patientData);

export const useSpouseData = () =>
  useInfertilityFormStore((state) => state.spouseData);

export const useMedicalInfo = () =>
  useInfertilityFormStore((state) => state.medicalInfo);

export const useValidationStatus = () =>
  useInfertilityFormStore((state) => state.validationStatus);

// Actions hook with shallow comparison to prevent infinite loops
export const useFormActions = () =>
  useInfertilityFormStore(
    useShallow((state) => ({
      setHospitalData: state.setHospitalData,
      updateHospitalField: state.updateHospitalField,
      setPatientData: state.setPatientData,
      updatePatientField: state.updatePatientField,
      setSpouseData: state.setSpouseData,
      updateSpouseField: state.updateSpouseField,
      setMedicalInfo: state.setMedicalInfo,
      updateMedicalInfo: state.updateMedicalInfo,
      setValidationStatus: state.setValidationStatus,
      updateValidation: state.updateValidation,
      resetForm: state.resetForm,
      initializeFormForEdit: state.initializeFormForEdit,
    }))
  );
