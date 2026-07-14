import type {
  DoctorChamberFeeInput,
  DoctorChamberDiscountType,
  DoctorChamberPatientInput,
  DoctorChamberVisitInput,
  DoctorChamberVisitRecord,
} from "@/lib/doctorChamber";

export type {
  DoctorChamberFeeInput,
  DoctorChamberDiscountType,
  DoctorChamberPatientInput,
  DoctorChamberVisitInput,
  DoctorChamberVisitRecord,
};

export type DoctorChamberInput = DoctorChamberVisitInput;

export interface DoctorChamberPatientSearchResult
  extends Omit<DoctorChamberPatientInput, "id"> {
  id: number;
}

export interface DoctorChamberSummary {
  visits: number;
  totalUltrasoundCharges: number;
  totalVisitingCharges: number;
  totalAmount: number;
}

export interface DoctorChamberDoctorConfig {
  doctorId: number;
  doctorName: string;
  specialization: string | null;
  departmentName: string;
  ultrasoundCode: string;
  ultrasoundName: string;
  ultrasoundCharge: number;
}

export interface DoctorChamberListResponse {
  success: boolean;
  data: DoctorChamberVisitRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: DoctorChamberSummary;
  doctor: {
    id: number;
    name: string;
    specialization: string | null;
  };
  error?: string;
}

export interface DoctorChamberConfigResponse {
  success: boolean;
  data: DoctorChamberDoctorConfig;
  error?: string;
}

export interface DoctorChamberPatientSearchResponse {
  success: boolean;
  data: DoctorChamberPatientSearchResult[];
  error?: string;
}

export interface DoctorChamberMutationResponse {
  success: boolean;
  data?: {
    id: number;
    visitNumber: string;
  };
  error?: string;
}

export const EMPTY_PATIENT: DoctorChamberPatientInput = {
  id: null,
  firstName: "",
  lastName: "",
  fullName: "",
  gender: "",
  dateOfBirth: null,
  address: "",
  phoneNumber: "",
  email: "",
  bloodGroup: "",
  guardianName: "",
  guardianGender: "",
  guardianPhone: "",
  guardianAddress: "",
  guardianEmail: "",
};

export const EMPTY_VISIT: DoctorChamberVisitInput = {
  patient: EMPTY_PATIENT,
  visitingCharge: 0,
  fees: [],
  discountType: "value",
  discountValue: null,
  notes: "",
};
