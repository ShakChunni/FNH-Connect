// Patient data types for the Patient Records module

export interface PatientData {
  id: number;
  firstName: string;
  lastName: string | null;
  fullName: string;
  gender: string;
  dateOfBirth: Date | null;
  guardianName: string | null;
  guardianDOB: Date | null;
  guardianGender: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  bloodGroup: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date | null;
  guardianName: string;
  phoneNumber: string;
  address: string;
}

// API response type
export interface PatientsApiResponse {
  success: boolean;
  data: PatientData[];
  total: number;
  error?: string;
}

export interface PatientUpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string | null;
  guardianName?: string;
  phoneNumber?: string;
  address?: string;
}
