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
  AdmissionMedicineChargeItem,
} from "../types";
import { parseDateOfBirth } from "@/lib/dateOfBirth";

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
  medicineChargeItems: AdmissionMedicineChargeItem[];
}

interface FormActions {
  setHospitalData: (data: Partial<HospitalData>) => void;
  setPatientData: (data: Partial<PatientData>) => void;
  setDepartmentData: (data: Partial<DepartmentData>) => void;
  setDoctorData: (data: Partial<DoctorData>) => void;
  setAdmissionInfo: (data: Partial<AdmissionInfo>) => void;
  updateAdmissionInfo: <K extends keyof AdmissionInfo>(
    key: K,
    value: AdmissionInfo[K],
  ) => void;
  setFinancialData: (data: Partial<FinancialData>) => void;
  updateFinancialData: <K extends keyof FinancialData>(
    key: K,
    value: FinancialData[K],
  ) => void;
  setValidationStatus: (status: Partial<ValidationStatus>) => void;
  setMedicineChargeItems: (items: AdmissionMedicineChargeItem[]) => void;
  updateMedicineChargeItem: (
    index: number,
    patch: Partial<AdmissionMedicineChargeItem>,
  ) => void;
  removeMedicineChargeItem: (index: number) => void;
  clearMedicineChargeItems: () => void;
  initializeFormForEdit: (admission: AdmissionPatientData) => void;
  resetForm: () => void;
  calculateTotals: () => void;

  // Smart actions for financial calculations
  setCharge: (field: keyof FinancialData, amount: number) => void;
  setDiscount: (type: "percentage" | "value", value: number | null) => void;
  setPaidAmount: (amount: number) => void;

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
  chiefComplaint: "",
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
  discountType: "percentage",
  discountValue: null,
  discountAmount: 0,
  grandTotal: 300,
  paidAmount: 300, // Admission fee is paid upfront
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
  medicineChargeItems: [],

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

  updateAdmissionInfo: (key, value) => {
    set((state) => ({
      admissionInfo: { ...state.admissionInfo, [key]: value },
    }));

    // If status is changed to Canceled, reset all financial charges to 0
    if (key === "status" && value === "Canceled") {
      set((state) => ({
        medicineChargeItems: [],
        financialData: {
          ...state.financialData,
          admissionFee: 0,
          serviceCharge: 0,
          seatRent: 0,
          otCharge: 0,
          doctorCharge: 0,
          surgeonCharge: 0,
          anesthesiaFee: 0,
          assistantDoctorFee: 0,
          medicineCharge: 0,
          otherCharges: 0,
          paidAmount: 0,
        },
      }));
      get().calculateTotals();
    }
  },

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

  setMedicineChargeItems: (items) => {
    const normalized = items.map((item) => {
      const quantity = Math.max(1, Math.trunc(item.quantity || 1));
      const unitPrice = Math.max(0, item.unitPrice || 0);
      const normalizedItem: AdmissionMedicineChargeItem = {
        ...item,
        quantity,
        unitPrice,
        totalAmount: quantity * unitPrice,
        isMatched: item.medicineId !== null && item.medicineId !== undefined,
      };
      return normalizedItem;
    });
    const medicineCharge = normalized.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    set((state) => ({
      medicineChargeItems: normalized,
      financialData: {
        ...state.financialData,
        medicineCharge,
      },
    }));
    get().calculateTotals();
  },

  updateMedicineChargeItem: (index, patch) => {
    set((state) => {
      const updated = [...state.medicineChargeItems];
      const item = { ...updated[index], ...patch };
      const quantity = Math.max(1, Math.trunc(item.quantity || 1));
      const unitPrice = Math.max(0, item.unitPrice || 0);
      item.quantity = quantity;
      item.unitPrice = unitPrice;
      item.totalAmount = quantity * unitPrice;
      item.isMatched =
        item.medicineId !== null && item.medicineId !== undefined;
      updated[index] = item;
      const medicineCharge = updated.reduce(
        (sum, r) => sum + r.totalAmount,
        0,
      );
      return {
        medicineChargeItems: updated,
        financialData: {
          ...state.financialData,
          medicineCharge,
        },
      };
    });
    get().calculateTotals();
  },

  removeMedicineChargeItem: (index) => {
    set((state) => {
      const updated = state.medicineChargeItems.filter((_, i) => i !== index);
      const medicineCharge =
        updated.length > 0
          ? updated.reduce((sum, r) => sum + r.totalAmount, 0)
          : 0;
      return {
        medicineChargeItems: updated,
        financialData: {
          ...state.financialData,
          medicineCharge,
        },
      };
    });
    get().calculateTotals();
  },

  clearMedicineChargeItems: () => {
    set((state) => ({
      medicineChargeItems: [],
      financialData: {
        ...state.financialData,
        medicineCharge: 0,
      },
    }));
    get().calculateTotals();
  },

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
        firstName: admission.patientFirstName || "",
        lastName: admission.patientLastName || "",
        fullName: admission.patientFullName || "",
        gender: admission.patientGender || "",
        age: admission.patientAge,
        dateOfBirth: parseDateOfBirth(admission.patientDateOfBirth || null),
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
        chiefComplaint: admission.chiefComplaint || "",
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
          (admission.discountType as "percentage" | "value") || "percentage",
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
      medicineChargeItems: admission.medicineChargeItems ?? [],
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
      medicineChargeItems: [],
    }),

  // Smart actions for financial calculations
  setCharge: (field, amount) => {
    set((state) => ({
      financialData: { ...state.financialData, [field]: amount },
    }));
    get().calculateTotals();
  },

  setDiscount: (type, value) => {
    set((state) => ({
      financialData: {
        ...state.financialData,
        discountType: type,
        discountValue: value,
      },
    }));
    get().calculateTotals();
  },

  setPaidAmount: (amount) => {
    set((state) => {
      const { grandTotal } = state.financialData;
      const { status } = state.admissionInfo;

      // Ensure minimum 300 payment unless status is Canceled
      let finalPaid = amount;
      if (status !== "Canceled") {
        finalPaid = Math.max(300, amount);
      }

      // Cap paid amount at grand total for better UX
      finalPaid = Math.min(finalPaid, grandTotal);

      return {
        financialData: { ...state.financialData, paidAmount: finalPaid },
      };
    });
    get().calculateTotals();
  },

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
      medicineChargeItems: [],
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
      medicineChargeItems: [],
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

export const useAdmissionMedicineChargeItems = () =>
  useAdmissionFormStore((state) => state.medicineChargeItems);

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
      setMedicineChargeItems: state.setMedicineChargeItems,
      updateMedicineChargeItem: state.updateMedicineChargeItem,
      removeMedicineChargeItem: state.removeMedicineChargeItem,
      clearMedicineChargeItems: state.clearMedicineChargeItems,
      initializeFormForEdit: state.initializeFormForEdit,
      resetForm: state.resetForm,
      calculateTotals: state.calculateTotals,
      setCharge: state.setCharge,
      setDiscount: state.setDiscount,
      setPaidAmount: state.setPaidAmount,
      afterAddModalClosed: state.afterAddModalClosed,
      afterEditModalClosed: state.afterEditModalClosed,
    })),
  );
