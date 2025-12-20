/**
 * General Admission Constants
 */

// Default admission fee (in BDT)
export const DEFAULT_ADMISSION_FEE = 300;

// Status options for admissions
export const ADMISSION_STATUS = {
  ADMITTED: "Admitted",
  UNDER_TREATMENT: "Under Treatment",
  AWAITING_DISCHARGE: "Awaiting Discharge",
  DISCHARGED: "Discharged",
} as const;

// Discount types
export const DISCOUNT_TYPE = {
  PERCENTAGE: "percentage",
  VALUE: "value",
} as const;

// Hospital types
export const HOSPITAL_TYPES = [
  "Government Hospital",
  "Private Hospital",
  "Clinic",
  "Medical Center",
  "Specialty Center",
  "Other",
] as const;

// Gender options
export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

// Blood group options
export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

// API endpoints
export const API_ENDPOINTS = {
  ADMISSIONS: "/api/admissions",
  DEPARTMENTS: "/api/departments",
  DOCTORS: "/api/staff/doctors",
  HOSPITALS: "/api/hospitals",
  CONFIG_ADMISSION_FEE: "/api/config/admission-fee",
} as const;
