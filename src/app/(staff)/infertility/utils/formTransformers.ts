import {
  HospitalData,
  PatientData,
  SpouseInfo,
  InfertilityMedicalData,
} from "../types";

// Flexible payload type that covers both Add and Edit needs
// We make 'id' optional because it's only needed for Edit (top-level) or Update (nested)
export interface InfertilityApiPayload {
  id?: number | null; // Top-level ID for Edit
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
    guardianName: string;
    address: string;
    phoneNumber: string;
    email: string;
    bloodGroup: string;
    occupation: string;
  };
  spouseInfo: {
    name: string;
    age: number | null;
    dateOfBirth: Date | null;
    gender: string;
    occupation: string;
  };
  medicalInfo: {
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
  };
}

export const transformInfertilityDataForApi = (
  hospitalData: HospitalData,
  patientData: PatientData,
  spouseData: SpouseInfo,
  medicalInfo: InfertilityMedicalData
): InfertilityApiPayload => {
  return {
    id:
      typeof patientData.id === "string"
        ? parseInt(patientData.id)
        : patientData.id,
    hospital: {
      id:
        typeof hospitalData.id === "string"
          ? parseInt(hospitalData.id)
          : hospitalData.id,
      name: hospitalData.name,
      address: hospitalData.address || "",
      phoneNumber: hospitalData.phoneNumber || "",
      email: hospitalData.email || "",
      website: hospitalData.website || "",
      type: hospitalData.type || "",
    },
    patient: {
      id:
        typeof patientData.id === "string"
          ? parseInt(patientData.id)
          : patientData.id,
      firstName: patientData.firstName,
      lastName: patientData.lastName || "",
      fullName: patientData.fullName,
      gender: patientData.gender || "Female",
      age: patientData.age,
      dateOfBirth: patientData.dateOfBirth,
      guardianName: spouseData.name || "", // Often spouse name is used as guardian for infertility cases
      address: patientData.address || "",
      phoneNumber: patientData.phoneNumber || "",
      email: patientData.email || "",
      bloodGroup: patientData.bloodGroup || "",
      occupation: patientData.occupation || "",
    },
    spouseInfo: {
      name: spouseData.name || "",
      age: spouseData.age,
      dateOfBirth: spouseData.dateOfBirth,
      gender: spouseData.gender || "Male",
      occupation: spouseData.occupation || "",
    },
    medicalInfo: {
      yearsMarried: medicalInfo.yearsMarried,
      yearsTrying: medicalInfo.yearsTrying,
      infertilityType: medicalInfo.infertilityType || "",
      para: medicalInfo.para || "",
      gravida: medicalInfo.gravida || "",
      weight: medicalInfo.weight,
      height: medicalInfo.height,
      bmi: medicalInfo.bmi,
      bloodPressure: medicalInfo.bloodPressure || "",
      medicalHistory: medicalInfo.medicalHistory || "",
      surgicalHistory: medicalInfo.surgicalHistory || "",
      menstrualHistory: medicalInfo.menstrualHistory || "",
      contraceptiveHistory: medicalInfo.contraceptiveHistory || "",
      referralSource: medicalInfo.referralSource || "",
      chiefComplaint: medicalInfo.chiefComplaint || "",
      treatmentPlan: medicalInfo.treatmentPlan || "",
      medications: medicalInfo.medications || "",
      nextAppointment: medicalInfo.nextAppointment,
      status: medicalInfo.status || "",
      notes: medicalInfo.notes || "",
    },
  };
};
