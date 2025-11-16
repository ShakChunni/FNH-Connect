// Type definitions for Infertility Patient Management

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
  patientId: number;
  hospitalId: number;
  patient: {
    id: number;
    fullName: string;
    age: number | null;
    phoneNumber: string | null;
    email: string | null;
    gender: string;
  };
  hospital: {
    id: number;
    name: string;
    type: string | null;
  };
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string | null;
  status: string | null;
  nextAppointment: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Filter options
export interface InfertilityFilters {
  status?: string;
  hospitalId?: number;
  infertilityType?: string;
  search?: string;
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
  mobileNumber: string | null;
  email: string | null;
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
  hospitalName: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientAge: number | null;
  patientDOB: string | null;
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: string | null;
  mobileNumber: string | null;
  address: string | null;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string | null;
  alc: string | null;
  weight: number | null;
  bp: string | null;
  infertilityType: string | null;
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
