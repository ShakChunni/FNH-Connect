/**
 * General Admission Form Store
 * Manages all form data for admission creation and editing
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  HospitalData,
  PatientData,
  DepartmentData,
  DoctorData,
  AdmissionInfo,
  FinancialData,
  ValidationStatus,
  AdmissionPatientData,
} from "../types";

// ═══════════════════════════════════════════════════════════════
// State Interfaces
// ═══════════════════════════════════════════════════════════════

interface FormState {
  hospitalData: HospitalData;
  patientData: PatientData;
  departmentData: DepartmentData;
  doctorData: DoctorData;
  admissionInfo: AdmissionInfo;
  financialData: FinancialData;
  validationStatus: ValidationStatus;
}

interface FormActions {
  setHospitalData: (data: Partial<HospitalData>) => void;
  setPatientData: (data: Partial<PatientData>) => void;
  setDepartmentData: (data: Partial<DepartmentData>) => void;
  setDoctorData: (data: Partial<DoctorData>) => void;
  setAdmissionInfo: (data: Partial<AdmissionInfo>) => void;
  updateAdmissionInfo: <K extends keyof AdmissionInfo>(
    key: K,
    value: AdmissionInfo[K]
  ) => void;
  setFinancialData: (data: Partial<FinancialData>) => void;
  updateFinancialData: <K extends keyof FinancialData>(
    key: K,
    value: FinancialData[K]
  ) => void;
  setValidationStatus: (status: Partial<ValidationStatus>) => void;
  initializeFormForEdit: (admission: AdmissionPatientData) => void;
  resetForm: () => void;
  calculateTotals: () => void;
  afterAddModalClosed: () => void;
  afterEditModalClosed: () => void;
}

type FormStore = FormState & FormActions;

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

const initialHospitalData: HospitalData = {
  id: null,
  name: "",
  address: "",
  phoneNumber: "",
  email: "",
  website: "",
  type: "",
};

const initialPatientData: PatientData = {
  id: null,
  firstName: "",
  lastName: "",
  fullName: "",
  gender: "",
  age: null,
  dateOfBirth: null,
  address: "",
  phoneNumber: "",
  email: "",
  bloodGroup: "",
  guardianName: "",
  guardianPhone: "",
};

const initialDepartmentData: DepartmentData = {
  id: null,
  name: "",
};

const initialDoctorData: DoctorData = {
  id: null,
  fullName: "",
  specialization: "",
};

const initialAdmissionInfo: AdmissionInfo = {
  status: "Admitted",
  seatNumber: "",
  ward: "",
  diagnosis: "",
  treatment: "",
  otType: "",
  remarks: "",
};

const initialFinancialData: FinancialData = {
  admissionFee: 300, // Default, will be fetched from config
  serviceCharge: 0,
  seatRent: 0,
  otCharge: 0,
  doctorCharge: 0,
  surgeonCharge: 0,
  anesthesiaFee: 0,
  assistantDoctorFee: 0,
  medicineCharge: 0,
  otherCharges: 0,
  totalAmount: 0,
  discountType: null,
  discountValue: null,
  discountAmount: 0,
  grandTotal: 0,
  paidAmount: 0,
  dueAmount: 0,
};

const initialValidationStatus: ValidationStatus = {
  phone: true,
  email: true,
};

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

export const useAdmissionFormStore = create<FormStore>((set, get) => ({
  // Initial state
  hospitalData: { ...initialHospitalData },
  patientData: { ...initialPatientData },
  departmentData: { ...initialDepartmentData },
  doctorData: { ...initialDoctorData },
  admissionInfo: { ...initialAdmissionInfo },
  financialData: { ...initialFinancialData },
  validationStatus: { ...initialValidationStatus },

  // Actions
  setHospitalData: (data) =>
    set((state) => ({
      hospitalData: { ...state.hospitalData, ...data },
    })),

  setPatientData: (data) =>
    set((state) => ({
      patientData: { ...state.patientData, ...data },
    })),

  setDepartmentData: (data) =>
    set((state) => ({
      departmentData: { ...state.departmentData, ...data },
    })),

  setDoctorData: (data) =>
    set((state) => ({
      doctorData: { ...state.doctorData, ...data },
    })),

  setAdmissionInfo: (data) =>
    set((state) => ({
      admissionInfo: { ...state.admissionInfo, ...data },
    })),

  updateAdmissionInfo: (key, value) =>
    set((state) => ({
      admissionInfo: { ...state.admissionInfo, [key]: value },
    })),

  setFinancialData: (data) =>
    set((state) => ({
      financialData: { ...state.financialData, ...data },
    })),

  updateFinancialData: (key, value) => {
    set((state) => ({
      financialData: { ...state.financialData, [key]: value },
    }));
    // Recalculate totals after any financial data change
    get().calculateTotals();
  },

  setValidationStatus: (status) =>
    set((state) => ({
      validationStatus: { ...state.validationStatus, ...status },
    })),

  calculateTotals: () => {
    set((state) => {
      const {
        admissionFee,
        serviceCharge,
        seatRent,
        otCharge,
        doctorCharge,
        surgeonCharge,
        anesthesiaFee,
        assistantDoctorFee,
        medicineCharge,
        otherCharges,
        discountType,
        discountValue,
        paidAmount,
      } = state.financialData;

      // Calculate total before discount
      const totalAmount =
        admissionFee +
        serviceCharge +
        seatRent +
        otCharge +
        doctorCharge +
        surgeonCharge +
        anesthesiaFee +
        assistantDoctorFee +
        medicineCharge +
        otherCharges;

      // Calculate discount amount
      let discountAmount = 0;
      if (discountType && discountValue) {
        if (discountType === "percentage") {
          discountAmount = (totalAmount * discountValue) / 100;
        } else {
          discountAmount = discountValue;
        }
      }

      // Ensure discount doesn't exceed total
      discountAmount = Math.min(discountAmount, totalAmount);

      // Calculate final totals
      const grandTotal = totalAmount - discountAmount;
      const dueAmount = grandTotal - paidAmount;

      return {
        financialData: {
          ...state.financialData,
          totalAmount,
          discountAmount,
          grandTotal,
          dueAmount,
        },
      };
    });
  },

  initializeFormForEdit: (admission) => {
    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    set({
      hospitalData: {
        id: admission.hospitalId,
        name: admission.hospitalName || "",
        address: admission.hospitalAddress || "",
        phoneNumber: admission.hospitalPhone || "",
        email: admission.hospitalEmail || "",
        website: admission.hospitalWebsite || "",
        type: admission.hospitalType || "",
      },
      patientData: {
        id: admission.patientId,
        firstName: admission.patientFullName?.split(" ")[0] || "",
        lastName:
          admission.patientFullName?.split(" ").slice(1).join(" ") || "",
        fullName: admission.patientFullName || "",
        gender: admission.patientGender || "",
        age: admission.patientAge,
        dateOfBirth: parseDate(admission.patientDateOfBirth || null),
        address: admission.patientAddress || "",
        phoneNumber: admission.patientPhone || "",
        email: admission.patientEmail || "",
        bloodGroup: admission.patientBloodGroup || "",
        guardianName: admission.guardianName || "",
        guardianPhone: admission.guardianPhone || "",
      },
      departmentData: {
        id: admission.departmentId,
        name: admission.departmentName || "",
      },
      doctorData: {
        id: admission.doctorId,
        fullName: admission.doctorName || "",
        specialization: admission.doctorSpecialization || "",
      },
      admissionInfo: {
        status: admission.status || "Admitted",
        seatNumber: admission.seatNumber || "",
        ward: admission.ward || "",
        diagnosis: admission.diagnosis || "",
        treatment: admission.treatment || "",
        otType: admission.otType || "",
        remarks: admission.remarks || "",
      },
      financialData: {
        admissionFee: Number(admission.admissionFee) || 300,
        serviceCharge: Number(admission.serviceCharge) || 0,
        seatRent: Number(admission.seatRent) || 0,
        otCharge: Number(admission.otCharge) || 0,
        doctorCharge: Number(admission.doctorCharge) || 0,
        surgeonCharge: Number(admission.surgeonCharge) || 0,
        anesthesiaFee: Number(admission.anesthesiaFee) || 0,
        assistantDoctorFee: Number(admission.assistantDoctorFee) || 0,
        medicineCharge: Number(admission.medicineCharge) || 0,
        otherCharges: Number(admission.otherCharges) || 0,
        totalAmount: Number(admission.totalAmount) || 0,
        discountType:
          (admission.discountType as "percentage" | "value") || null,
        discountValue: admission.discountValue,
        discountAmount: Number(admission.discountAmount) || 0,
        grandTotal: Number(admission.grandTotal) || 0,
        paidAmount: Number(admission.paidAmount) || 0,
        dueAmount: Number(admission.dueAmount) || 0,
      },
      validationStatus: {
        phone: true,
        email: true,
      },
    });
  },

  resetForm: () =>
    set({
      hospitalData: { ...initialHospitalData },
      patientData: { ...initialPatientData },
      departmentData: { ...initialDepartmentData },
      doctorData: { ...initialDoctorData },
      admissionInfo: { ...initialAdmissionInfo },
      financialData: { ...initialFinancialData },
      validationStatus: { ...initialValidationStatus },
    }),

  // These are called after modal animation completes (onExitComplete)
  afterAddModalClosed: () => {
    set({
      hospitalData: { ...initialHospitalData },
      patientData: { ...initialPatientData },
      departmentData: { ...initialDepartmentData },
      doctorData: { ...initialDoctorData },
      admissionInfo: { ...initialAdmissionInfo },
      financialData: { ...initialFinancialData },
      validationStatus: { ...initialValidationStatus },
    });
  },

  afterEditModalClosed: () => {
    set({
      hospitalData: { ...initialHospitalData },
      patientData: { ...initialPatientData },
      departmentData: { ...initialDepartmentData },
      doctorData: { ...initialDoctorData },
      admissionInfo: { ...initialAdmissionInfo },
      financialData: { ...initialFinancialData },
      validationStatus: { ...initialValidationStatus },
    });
  },
}));

// ═══════════════════════════════════════════════════════════════
// Selector Hooks
// ═══════════════════════════════════════════════════════════════

export const useAdmissionHospitalData = () =>
  useAdmissionFormStore((state) => state.hospitalData);

export const useAdmissionPatientData = () =>
  useAdmissionFormStore((state) => state.patientData);

export const useAdmissionDepartmentData = () =>
  useAdmissionFormStore((state) => state.departmentData);

export const useAdmissionDoctorData = () =>
  useAdmissionFormStore((state) => state.doctorData);

export const useAdmissionInfo = () =>
  useAdmissionFormStore((state) => state.admissionInfo);

export const useAdmissionFinancialData = () =>
  useAdmissionFormStore((state) => state.financialData);

export const useAdmissionValidationStatus = () =>
  useAdmissionFormStore((state) => state.validationStatus);

// Combined actions hook
export const useAdmissionFormActions = () =>
  useAdmissionFormStore(
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
      afterAddModalClosed: state.afterAddModalClosed,
      afterEditModalClosed: state.afterEditModalClosed,
    }))
  );
