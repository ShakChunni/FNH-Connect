import { InfertilityPatientData } from "../../../types";

export interface FormDataStructure {
  hospitalData: {
    id: number | null;
    name: string;
    address: string;
    phoneNumber: string;
    email: string;
    website: string;
    type: string;
  };
  patientData: {
    id: number | null;
    patientFirstName: string;
    patientLastName: string;
    patientFullName: string;
    patientGender: string;
    patientAge: number | null;
    patientDOB: Date | null;
    mobileNumber: string;
    email: string;
    address: string;
    spouseName: string;
    spouseAge: number | null;
    spouseDOB: Date | null;
    spouseGender: string;
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
    bloodGroup: string;
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

export const initializeFormData = (
  patientData: InfertilityPatientData
): FormDataStructure => {
  return {
    hospitalData: {
      id: patientData.hospitalId,
      name: patientData.hospitalName || "",
      address: patientData.hospitalAddress || "",
      phoneNumber: patientData.hospitalPhone || "",
      email: patientData.hospitalEmail || "",
      website: patientData.hospitalWebsite || "",
      type: patientData.hospitalType || "",
    },
    patientData: {
      id: patientData.patientId,
      patientFirstName: patientData.patientFirstName || "",
      patientLastName: patientData.patientLastName || "",
      patientFullName: patientData.patientFullName || "",
      patientGender: patientData.patientGender || "Female",
      patientAge: patientData.patientAge || null,
      patientDOB: patientData.patientDOB
        ? new Date(patientData.patientDOB)
        : null,
      mobileNumber: patientData.mobileNumber || "",
      email: patientData.email || "",
      address: patientData.address || "",
      spouseName: patientData.husbandName || "",
      spouseAge: patientData.husbandAge || null,
      spouseDOB: patientData.husbandDOB
        ? new Date(patientData.husbandDOB)
        : null,
      spouseGender: patientData.spouseGender || "Male",
    },
    medicalInfo: {
      yearsMarried: patientData.yearsMarried || null,
      yearsTrying: patientData.yearsTrying || null,
      infertilityType: patientData.infertilityType || "",
      para: patientData.para || "",
      gravida: patientData.gravida || "",
      weight: patientData.weight || null,
      height: patientData.height || null,
      bmi: patientData.bmi || null,
      bloodPressure: patientData.bloodPressure || "",
      bloodGroup: patientData.bloodGroup || "",
      medicalHistory: patientData.medicalHistory || "",
      surgicalHistory: patientData.surgicalHistory || "",
      menstrualHistory: patientData.menstrualHistory || "",
      contraceptiveHistory: patientData.contraceptiveHistory || "",
      referralSource: patientData.referralSource || "",
      chiefComplaint: patientData.chiefComplaint || "",
      treatmentPlan: patientData.treatmentPlan || "",
      medications: patientData.medications || "",
      nextAppointment: patientData.nextAppointment
        ? new Date(patientData.nextAppointment)
        : null,
      status: patientData.status || "Active",
      notes: patientData.notes || "",
    },
  };
};
