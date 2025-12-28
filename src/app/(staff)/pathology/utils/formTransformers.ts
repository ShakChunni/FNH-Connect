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
 * Serialize date to YYYY-MM-DD format (local date without timezone conversion)
 * This prevents the UTC conversion issue where dates shift back a day/year
 */
function serializeDate(date: Date | null): string | null {
  if (!date) return null;
  // Use local date components to avoid timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
      // Serialize date properly to avoid timezone issues
      dateOfBirth: serializeDate(patientData.dateOfBirth) as any,
      // Map guardian name to patient guardianName field
      guardianName: guardianData.name,
    },
    hospital: hospitalData,
    guardianInfo: {
      ...guardianData,
      dateOfBirth: serializeDate(guardianData.dateOfBirth) as any,
    },
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
      // Serialize date properly to avoid timezone issues
      dateOfBirth: serializeDate(patientData.dateOfBirth) as any,
      guardianName: guardianData.name,
    },
    hospital: hospitalData,
    guardianInfo: {
      ...guardianData,
      dateOfBirth: serializeDate(guardianData.dateOfBirth) as any,
    },
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
