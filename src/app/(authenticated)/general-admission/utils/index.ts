/**
 * General Admission Utilities
 * Form transformers and helper functions
 */

import {
  HospitalData,
  PatientData,
  DepartmentData,
  DoctorData,
  AdmissionInfo,
  FinancialData,
  CreateAdmissionPayload,
  UpdateAdmissionPayload,
  AdmissionPatientData,
  AdmissionMedicineChargeItem,
} from "../types";
import {
  getAgeInYears,
  serializeDateOfBirth,
} from "@/components/form-sections/utils/dateUtils";

/**
 * Serialize date to YYYY-MM-DD format (local date without timezone conversion)
 * This prevents the UTC conversion issue where dates shift back a day/year
 */
function serializeDate(date: Date | null): string | null {
  return serializeDateOfBirth(date);
}

/**
 * Transform form data to API payload for creating admission
 */
export function transformFormToCreatePayload(
  hospitalData: HospitalData,
  patientData: PatientData,
  departmentData: DepartmentData,
  doctorData: DoctorData,
  admissionInfo?: AdmissionInfo,
  financialData?: FinancialData,
  medicineChargeItems?: AdmissionMedicineChargeItem[],
): CreateAdmissionPayload {
  return {
    hospital: {
      id: hospitalData.id,
      name: hospitalData.name,
      address: hospitalData.address,
      phoneNumber: hospitalData.phoneNumber,
      email: hospitalData.email,
      website: hospitalData.website,
      type: hospitalData.type,
    },
    patient: {
      id: patientData.id,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      fullName: patientData.fullName,
      gender: patientData.gender,
      age: patientData.age,
      dateOfBirth: serializeDate(patientData.dateOfBirth),
      address: patientData.address,
      phoneNumber: patientData.phoneNumber,
      email: patientData.email,
      bloodGroup: patientData.bloodGroup,
      guardianName: patientData.guardianName,
      guardianPhone: patientData.guardianPhone,
    },
    departmentId: departmentData.id!,
    doctorId: doctorData.id!,
    chiefComplaint: admissionInfo?.chiefComplaint,
    status: admissionInfo?.status,
    seatNumber: admissionInfo?.seatNumber,
    ward: admissionInfo?.ward,
    diagnosis: admissionInfo?.diagnosis,
    treatment: admissionInfo?.treatment,
    otType: admissionInfo?.otType,
    remarks: admissionInfo?.remarks,
    serviceCharge: financialData?.serviceCharge,
    seatRent: financialData?.seatRent,
    otCharge: financialData?.otCharge,
    doctorCharge: financialData?.doctorCharge,
    surgeonCharge: financialData?.surgeonCharge,
    anesthesiaFee: financialData?.anesthesiaFee,
    assistantDoctorFee: financialData?.assistantDoctorFee,
    // medicineCharge is intentionally NOT sent: the server derives it
    // from the Admission.medicineBillingEnabled flag.
    otherCharges: financialData?.otherCharges,
    discountType: financialData?.discountType,
    discountValue: financialData?.discountValue,
    discountAmount: financialData?.discountAmount,
    paidAmount: financialData?.paidAmount,
    medicineChargeItems:
      medicineChargeItems && medicineChargeItems.length > 0
        ? medicineChargeItems.map((item) => {
            const { clientId, ...rest } = item;
            return rest;
          })
        : undefined,
  };
}

/**
 * Transform form data to API payload for updating admission
 */
export function transformFormToUpdatePayload(
  admissionId: number,
  admissionInfo: AdmissionInfo,
  financialData: FinancialData,
  medicineChargeItems?: AdmissionMedicineChargeItem[],
): UpdateAdmissionPayload {
  return {
    id: admissionId,
    status: admissionInfo.status,
    seatNumber: admissionInfo.seatNumber,
    ward: admissionInfo.ward,
    diagnosis: admissionInfo.diagnosis,
    treatment: admissionInfo.treatment,
    otType: admissionInfo.otType,
    remarks: admissionInfo.remarks,
    chiefComplaint: admissionInfo.chiefComplaint,
    serviceCharge: financialData.serviceCharge,
    seatRent: financialData.seatRent,
    otCharge: financialData.otCharge,
    doctorCharge: financialData.doctorCharge,
    surgeonCharge: financialData.surgeonCharge,
    anesthesiaFee: financialData.anesthesiaFee,
    assistantDoctorFee: financialData.assistantDoctorFee,
    medicineCharge: financialData.medicineCharge,
    otherCharges: financialData.otherCharges,
    discountType: financialData.discountType,
    discountValue: financialData.discountValue,
    discountAmount: financialData.discountAmount,
    paidAmount: financialData.paidAmount,
    isDischarged: admissionInfo.status === "Discharged",
    medicineChargeItems:
      medicineChargeItems?.map((item) => {
        const { clientId, ...rest } = item;
        return rest;
      }) ?? medicineChargeItems,
  };
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date with time for display
 */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format currency (BDT)
 */
export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null): number | null {
  return getAgeInYears(dateOfBirth);
}

/**
 * Calculate financial totals
 */
export function calculateFinancialTotals(
  admissionFee: number,
  serviceCharge: number,
  seatRent: number,
  otCharge: number,
  medicineCharge: number,
  otherCharges: number,
  discountType: "percentage" | "value" | null,
  discountValue: number | null,
  paidAmount: number,
): {
  totalAmount: number;
  discountAmount: number;
  grandTotal: number;
  dueAmount: number;
} {
  // Calculate total before discount
  const totalAmount =
    admissionFee +
    serviceCharge +
    seatRent +
    otCharge +
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
    totalAmount,
    discountAmount,
    grandTotal,
    dueAmount,
  };
}

/**
 * Validate form for submission
 */
export function validateAddAdmissionForm(
  hospitalData: HospitalData,
  patientData: PatientData,
  departmentData: DepartmentData,
  doctorData: DoctorData,
  validationStatus: { phone: boolean; email: boolean },
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!hospitalData.name.trim()) {
    errors.push("Hospital name is required");
  }
  if (!patientData.firstName.trim()) {
    errors.push("Patient first name is required");
  }
  if (!patientData.gender.trim()) {
    errors.push("Patient gender is required");
  }
  if (!departmentData.id) {
    errors.push("Department is required");
  }
  if (!doctorData.id) {
    errors.push("Doctor is required");
  }
  if (!validationStatus.phone) {
    errors.push("Invalid phone number");
  }
  if (!validationStatus.email) {
    errors.push("Invalid email address");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get status badge color class
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    Admitted: "blue",
    "Under Treatment": "amber",
    "Awaiting Discharge": "purple",
    Discharged: "green",
  };
  return colorMap[status] || "gray";
}

/**
 * Check if room number is required
 */
export function isRoomRequired(seatRent: number): boolean {
  return seatRent > 0;
}
