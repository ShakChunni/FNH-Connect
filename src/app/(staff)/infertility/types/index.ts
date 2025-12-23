/**
 * Centralized Type Definitions for Infertility Patient Management
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
  guardianName: string; // Spouse name for infertility patients
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
  occupation: string;
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

export interface InfertilityMedicalData {
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string;
  para: string;
  gravida: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string;
  medicalHistory: string;
  surgicalHistory: string;
  menstrualHistory: string;
  contraceptiveHistory: string;
  referralSource: string;
  chiefComplaint: string;
  treatmentPlan: string;
  medications: string;
  nextAppointment: Date | null;
  status: string;
  notes: string;
}

export interface SpouseInfo {
  name: string;
  age: number | null;
  dateOfBirth: Date | null;
  gender: string;
  occupation: string;
  phoneNumber?: string;
  email?: string;
}

// Complete submission data
export interface AddInfertilityPatientRequest {
  patient: PatientData;
  hospital: HospitalData;
  medicalInfo: InfertilityMedicalData;
  spouseInfo: SpouseInfo;
}

// API Response types
export interface AddInfertilityPatientResponse {
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
    infertilityRecord: {
      id: number;
      caseNumber: string;
    };
    displayId: string;
  };
  message: string;
  error?: string;
}

// Edit request type
export interface EditInfertilityPatientRequest {
  id: number; // Infertility patient record ID
  patient: PatientData;
  hospital: HospitalData;
  spouseInfo: SpouseInfo;
  medicalInfo: InfertilityMedicalData;
}

// Edit response type
export interface EditInfertilityPatientResponse {
  success: boolean;
  data?: {
    id: number;
    patient: {
      id: number;
      fullName: string;
    };
    displayId: string;
  };
  message?: string;
  error?: string;
}

// Response type for infertility patient list
export interface InfertilityPatient {
  id: number;
  caseNumber: string; // Format: INF-YYMMDD-XXXX
  patientId: number;
  hospitalId: number;
  patient: {
    id: number;
    fullName: string;
    age: number | null;
    phoneNumber: string | null;
    email: string | null;
    gender: string;
    dateOfBirth: Date | null;
    guardianName: string | null;
    guardianDOB: Date | null; // Stores spouse DOB in infertility context
    guardianGender: string | null; // Stores spouse gender in infertility context
    address: string | null;
    bloodGroup: string | null;
    occupation: string | null;
    guardianOccupation: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    guardianAddress: string | null;
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
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string | null;
  status: string | null;
  nextAppointment: Date | null;
  para: string | null;
  gravida: string | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string | null;
  bloodGroup: string | null;
  medicalHistory: string | null;
  surgicalHistory: string | null;
  menstrualHistory: string | null;
  contraceptiveHistory: string | null;
  referralSource: string | null;
  chiefComplaint: string | null;
  treatmentPlan: string | null;
  medications: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Filter options
export interface InfertilityFilters {
  status?: string;
  hospitalId?: number;
  infertilityType?: string;
  search?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

// Fetch response type
export interface FetchInfertilityPatientsResponse {
  success: boolean;
  data: InfertilityPatient[];
  error?: string;
}

// Search result types
export interface InfertilityPatientBasic {
  id: number;
  patientFullName: string;
  patientAge: number | null;
  dateOfBirth: Date | string | null;
  mobileNumber: string | null;
  email: string | null;
  gender: string | null;
  address: string | null;
  guardianName: string | null;
  guardianDOB: Date | string | null;
  guardianGender: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianAddress: string | null;
  bloodGroup: string | null;
  occupation: string | null;
  guardianOccupation: string | null;
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
  sourceTable: "infertility_patient";
  sourceId: number;
}

// Page-specific types
export interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  leadsFilter: string;
}

export interface SearchParams {
  searchTerm: string;
  searchField: string;
}

// Patient Table Types
export interface InfertilityPatientData {
  id: number;
  caseNumber: string; // Format: INF-YYMMDD-XXXX
  patientId: number;
  hospitalId: number;
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
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: string | null;
  husbandPhone: string | null;
  husbandEmail: string | null;
  husbandAddress: string | null;
  spouseGender: string;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  patientOccupation: string | null;
  husbandOccupation: string | null;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string | null;
  gravida: string | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string | null;
  infertilityType: string | null;
  // Medical history fields
  medicalHistory: string | null;
  surgicalHistory: string | null;
  menstrualHistory: string | null;
  contraceptiveHistory: string | null;
  referralSource: string | null;
  chiefComplaint: string | null;
  treatmentPlan: string | null;
  medications: string | null;
  nextAppointment: string | null;
  status: string | null;
  notes: string | null;
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
  spouseData: SpouseInfo;
  medicalInfo: InfertilityMedicalData;
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
