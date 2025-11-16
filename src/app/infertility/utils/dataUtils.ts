import { InfertilityPatient } from "../types";

export const normalizePatientData = (
  patientData: InfertilityPatient[] | undefined
) =>
  (patientData || []).map((row) => ({
    id: row.id,
    hospitalName: row.hospital.name,
    patientFirstName: row.patient.fullName.split(" ")[0] || "",
    patientLastName: row.patient.fullName.split(" ").slice(1).join(" ") || null,
    patientFullName: row.patient.fullName,
    patientAge: row.patient.age,
    patientDOB: null, // Not available in current API
    husbandName: null, // Not in API
    husbandAge: null, // Not in API
    husbandDOB: null, // Not in API
    mobileNumber: row.patient.phoneNumber,
    address: null, // Not in API
    yearsMarried: row.yearsMarried,
    yearsTrying: row.yearsTrying,
    para: null, // Not in API
    alc: null, // Not in API
    weight: null, // Not in API
    bp: null, // Not in API
    infertilityType: row.infertilityType,
    notes: null, // Not in API
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
