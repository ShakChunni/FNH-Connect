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
  occupation: string; // Patient's occupation
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

// Complete submission data
export interface AddInfertilityPatientRequest {
  patient: PatientData;
  hospital: HospitalData;
  medicalInfo: InfertilityMedicalData;
  spouseInfo: {
    name: string;
    age: number | null;
    dateOfBirth: Date | null;
    gender: string;
    occupation: string; // Spouse occupation
  };
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
