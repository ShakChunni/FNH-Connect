/**
 * General Admission Types
 * Type definitions for admission management
 */

// ═══════════════════════════════════════════════════════════════
// Status Types
// ═══════════════════════════════════════════════════════════════

export type AdmissionStatus =
  | "Admitted"
  | "Under Treatment"
  | "Awaiting Discharge"
  | "Discharged";

export const ADMISSION_STATUS_OPTIONS: {
  value: AdmissionStatus;
  label: string;
  color: string;
}[] = [
  { value: "Admitted", label: "Currently Admitted", color: "blue" },
  { value: "Under Treatment", label: "Under Active Care", color: "amber" },
  { value: "Awaiting Discharge", label: "Pending Discharge", color: "purple" },
  { value: "Discharged", label: "Discharged", color: "green" },
];

export type DiscountType = "percentage" | "value" | null;

export interface SortConfig {
  key: string;
  direction: string;
}

// ═══════════════════════════════════════════════════════════════
// Form Data Types
// ═══════════════════════════════════════════════════════════════

export interface HospitalData {
  id: number | null;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website: string;
  type: string;
}

export interface PatientData {
  id: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  age: number | null;
  dateOfBirth: Date | null;
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
}

export interface DepartmentData {
  id: number | null;
  name: string;
}

export interface DoctorData {
  id: number | null;
  fullName: string;
  specialization: string;
}

export interface AdmissionInfo {
  status: AdmissionStatus;
  seatNumber: string;
  ward: string;
  diagnosis: string;
  treatment: string;
  otType: string;
  remarks: string;
}

export interface FinancialData {
  admissionFee: number; // Fixed, read from config
  serviceCharge: number;
  seatRent: number;
  otCharge: number;
  medicineCharge: number;
  otherCharges: number;
  totalAmount: number;
  discountType: DiscountType;
  discountValue: number | null;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

export interface ValidationStatus {
  phone: boolean;
  email: boolean;
}

// ═══════════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════════

export interface AdmissionPatientData {
  id: number;
  admissionNumber: string;
  patientId: number;
  patientFullName: string;
  patientAge: number | null;
  patientGender: string;
  patientPhone: string;
  patientEmail: string;
  patientBloodGroup: string;
  patientAddress: string;
  guardianName: string;
  guardianPhone: string;
  hospitalId: number | null;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalWebsite: string;
  hospitalType: string;
  departmentId: number;
  departmentName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  status: AdmissionStatus;
  dateAdmitted: string;
  dateDischarged: string | null;
  isDischarged: boolean;
  seatNumber: string | null;
  ward: string | null;
  diagnosis: string | null;
  treatment: string | null;
  otType: string | null;
  remarks: string | null;
  admissionFee: number;
  serviceCharge: number;
  seatRent: number;
  otCharge: number;
  medicineCharge: number;
  otherCharges: number;
  totalAmount: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  lastModifiedBy: number;
}

export interface AdmissionFilters {
  status?: AdmissionStatus | "All";
  departmentId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ═══════════════════════════════════════════════════════════════
// Form State Types
// ═══════════════════════════════════════════════════════════════

export interface AdmissionFormState {
  hospitalData: HospitalData;
  patientData: PatientData;
  departmentData: DepartmentData;
  doctorData: DoctorData;
  admissionInfo: AdmissionInfo;
  financialData: FinancialData;
  validationStatus: ValidationStatus;
}

// ═══════════════════════════════════════════════════════════════
// API Payload Types
// ═══════════════════════════════════════════════════════════════

export interface CreateAdmissionPayload {
  hospital: {
    id: number | null;
    name: string;
    address: string;
    phoneNumber: string;
    email: string;
    website: string;
    type: string;
  };
  patient: {
    id: number | null;
    firstName: string;
    lastName: string;
    fullName: string;
    gender: string;
    age: number | null;
    dateOfBirth: Date | null;
    address: string;
    phoneNumber: string;
    email: string;
    bloodGroup: string;
    guardianName: string;
    guardianPhone: string;
  };
  departmentId: number;
  doctorId: number;
}

export interface UpdateAdmissionPayload {
  id: number;
  status?: AdmissionStatus;
  seatNumber?: string;
  ward?: string;
  diagnosis?: string;
  treatment?: string;
  otType?: string;
  remarks?: string;
  serviceCharge?: number;
  seatRent?: number;
  otCharge?: number;
  medicineCharge?: number;
  otherCharges?: number;
  discountType?: DiscountType;
  discountValue?: number | null;
  discountAmount?: number;
  paidAmount?: number;
  isDischarged?: boolean;
  dateDischarged?: Date | null;
}

// ═══════════════════════════════════════════════════════════════
// Department & Doctor Types
// ═══════════════════════════════════════════════════════════════

export interface Department {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  specialization: string | null;
  departmentId?: number;
  role?: string;
}

// ═══════════════════════════════════════════════════════════════
// Search Result Types (from API)
// ═══════════════════════════════════════════════════════════════

/**
 * Patient search result from API
 */
export interface Patient {
  id: number;
  firstName: string;
  lastName: string | null;
  fullName: string;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  dateOfBirth: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
}

/**
 * Hospital search result from API
 */
export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
}
