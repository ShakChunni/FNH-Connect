/**
 * Data transformation utilities for pathology module
 * Convert between form state and API request formats
 */

import type {
  HospitalData,
  PatientData,
  GuardianInfo,
  PathologyInfo,
  AddPathologyPatientRequest,
  EditPathologyPatientRequest,
} from "../types";

/**
 * Transform form data to API request format for creating new patient
 */
export function transformPathologyDataForApi(
  hospitalData: HospitalData,
  patientData: PatientData,
  guardianData: GuardianInfo,
  pathologyInfo: PathologyInfo
): Omit<AddPathologyPatientRequest, "id"> {
  return {
    patient: {
      ...patientData,
      // Map guardian name to patient guardianName field
      guardianName: guardianData.name,
    },
    hospital: hospitalData,
    guardianInfo: guardianData,
    pathologyInfo: {
      ...pathologyInfo,
      discountType: pathologyInfo.discountType,
      discountValue: pathologyInfo.discountValue,
    },
  };
}

/**
 * Transform form data to API request format for editing existing patient
 */
export function transformPathologyDataForEdit(
  id: number,
  hospitalData: HospitalData,
  patientData: PatientData,
  guardianData: GuardianInfo,
  pathologyInfo: PathologyInfo
): EditPathologyPatientRequest {
  return {
    id,
    patient: {
      ...patientData,
      guardianName: guardianData.name,
    },
    hospital: hospitalData,
    guardianInfo: guardianData,
    pathologyInfo: {
      ...pathologyInfo,
      discountType: pathologyInfo.discountType,
      discountValue: pathologyInfo.discountValue,
    },
  };
}

/**
 * Calculate financial totals
 */
export function calculateFinancials(
  testCharge: number,
  discountAmount: number,
  paidAmount: number = 0
) {
  const grandTotal = Math.max(0, testCharge - discountAmount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  return {
    grandTotal,
    dueAmount,
  };
}

/**
 * Format currency for display (BDT)
 */
export function formatCurrency(amount: number): string {
  return `BDT ${amount.toLocaleString("en-BD")}`;
}

/**
 * Parse currency input (removes BDT prefix and commas)
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/BDT|,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
