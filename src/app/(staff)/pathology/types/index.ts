/**
 * Centralized Type Definitions for Pathology Patient Management
 * All types are defined here to ensure consistency across the application
 */

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export interface AgeInfo {
  years: number;
  months: number;
  days: number;
}

// ═══════════════════════════════════════════════════════════════
// PATIENT & HOSPITAL TYPES
// ═══════════════════════════════════════════════════════════════

export interface PatientData {
  id: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  age: number | null;
  dateOfBirth: Date | null;
  guardianName: string; // Guardian name for pathology patients
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
}

export interface HospitalData {
  id: number | null;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website: string;
  type: string;
}

// Hospital type for API responses (hospitals from database have required id)
export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
}

export interface GuardianInfo {
  name: string;
  age: number | null;
  dateOfBirth: Date | null;
  gender: string;
}

export interface PathologyInfo {
  selectedTests: string[]; // Array of test codes
  testCharge: number;
  discountAmount: number | null;
  grandTotal: number;
  paidAmount: number; // Tracks total paid - managed via shifts/payments
  dueAmount: number;
  testDate: string; // ISO date string
  testCategory: string;
  remarks: string;
  isCompleted: boolean;
  orderedById: number | null; // Doctor who ordered the test
  doneById: number | null; // Staff who performed the test
}

// Complete submission data
export interface AddPathologyPatientRequest {
  patient: PatientData;
  hospital: HospitalData;
  guardianInfo: GuardianInfo;
  pathologyInfo: PathologyInfo;
}

// API Response types
export interface AddPathologyPatientResponse {
  success: boolean;
  data?: {
    patient: {
      id: number;
      fullName: string;
      isNew: boolean;
    };
    hospital: {
      id: number;
      name: string;
      isNew: boolean;
    };
    pathologyTest: {
      id: number;
      testNumber: string;
    };
    displayId: string;
  };
  message: string;
  error?: string;
}

// Edit request type
export interface EditPathologyPatientRequest {
  id: number; // Pathology test record ID
  patient: PatientData;
  hospital: HospitalData;
  guardianInfo: GuardianInfo;
  pathologyInfo: PathologyInfo;
}

// Edit response type
export interface EditPathologyPatientResponse {
  success: boolean;
  data?: {
    id: number;
    patient: {
      id: number;
      fullName: string;
    };
    testNumber: string;
  };
  message?: string;
  error?: string;
}

// Response type for pathology patient list
export interface PathologyPatient {
  id: number;
  patientId: number;
  hospitalId: number;
  testNumber: string;
  patient: {
    id: number;
    fullName: string;
    age: number | null;
    phoneNumber: string | null;
    email: string | null;
    gender: string;
    dateOfBirth: Date | null;
    guardianName: string | null;
    guardianDOB: Date | null;
    guardianGender: string | null;
    address: string | null;
    bloodGroup: string | null;
  };
  hospital: {
    id: number;
    name: string;
    type: string | null;
    address: string | null;
    phoneNumber: string | null;
    email: string | null;
    website: string | null;
  };
  testDate: string;
  reportDate: string | null;
  testCategory: string;
  testResults: any; // JSON field
  remarks: string | null;
  isCompleted: boolean;
  testCharge: number;
  discountAmount: number | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  referredBy: number | null;
  orderedById: number;
  doneById: number | null;
  createdAt: string;
  updatedAt: string;
}

// Filter options
export interface PathologyFilters {
  search?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  isCompleted?: boolean;
  testCategory?: string;
}

// Fetch response type
export interface FetchPathologyPatientsResponse {
  success: boolean;
  data: PathologyPatient[];
  error?: string;
}

// Search result types
export interface PathologyPatientBasic {
  id: number;
  patientFullName: string;
  patientAge: number | null;
  dateOfBirth: Date | string | null;
  mobileNumber: string | null;
  email: string | null;
  testNumber: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
}

// Activity logging
export interface ActivityLogData {
  action: "CREATE" | "UPDATE" | "DELETE";
  description: string;
  sourceTable: "pathology_test";
  sourceId: number;
}

// Page-specific types
export interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  testCategoryFilter: string;
  completionFilter: string;
}

export interface SearchParams {
  searchTerm: string;
  searchField: string;
}

// Patient Table Types
export interface PathologyPatientData {
  id: number;
  patientId: number;
  hospitalId: number;
  testNumber: string;
  hospitalName: string | null;
  hospitalAddress: string | null;
  hospitalPhone: string | null;
  hospitalEmail: string | null;
  hospitalWebsite: string | null;
  hospitalType: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientGender: string;
  patientAge: number | null;
  patientDOB: string | null;
  guardianName: string | null;
  guardianAge: number | null;
  guardianDOB: string | null;
  guardianGender: string;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  testDate: string;
  reportDate: string | null;
  testCategory: string;
  testResults: any; // JSON
  remarks: string | null;
  isCompleted: boolean;
  testCharge: number;
  discountAmount: number | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  referredBy: number | null;
  orderedById: number;
  doneById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TableHeader {
  key: string;
  label: string;
}

export interface SortConfig {
  key: string;
  direction: string;
}

// ═══════════════════════════════════════════════════════════════
// FORM STATE TYPES (for modals)
// ═══════════════════════════════════════════════════════════════

export interface FormDataState {
  hospitalData: HospitalData;
  patientData: PatientData;
  guardianData: GuardianInfo;
  pathologyInfo: PathologyInfo;
}

export interface ValidationStatus {
  phone: boolean;
  email: boolean;
}

export interface ModalFormState extends FormDataState {
  validationStatus: ValidationStatus;
  isDropdownOpen: boolean;
  activeSection: string;
}
