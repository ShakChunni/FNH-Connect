import { InfertilityPatient } from "../types";

const calculateAge = (dateOfBirth: Date | string | null): number | null => {
  if (!dateOfBirth) return null;
  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const normalizePatientData = (
  patientData: InfertilityPatient[] | undefined
) =>
  (patientData || []).map((row) => ({
    id: row.id,
    patientId: row.patient.id,
    hospitalId: row.hospital.id,
    hospitalName: row.hospital.name,
    hospitalAddress: row.hospital.address,
    hospitalPhone: row.hospital.phoneNumber,
    hospitalEmail: row.hospital.email,
    hospitalWebsite: row.hospital.website,
    hospitalType: row.hospital.type,
    patientFirstName: row.patient.fullName.split(" ")[0] || "",
    patientLastName: row.patient.fullName.split(" ").slice(1).join(" ") || null,
    patientFullName: row.patient.fullName,
    patientGender: row.patient.gender,
    patientAge: calculateAge(row.patient.dateOfBirth),
    patientDOB: row.patient.dateOfBirth
      ? row.patient.dateOfBirth instanceof Date
        ? row.patient.dateOfBirth.toISOString()
        : row.patient.dateOfBirth
      : null,
    husbandName: row.patient.guardianName,
    husbandAge: row.patient.spouseDOB
      ? calculateAge(row.patient.spouseDOB)
      : null,
    husbandDOB: row.patient.spouseDOB
      ? row.patient.spouseDOB instanceof Date
        ? row.patient.spouseDOB.toISOString()
        : row.patient.spouseDOB
      : null,
    spouseGender: row.patient.spouseGender || "Male",
    mobileNumber: row.patient.phoneNumber,
    email: row.patient.email,
    address: row.patient.address,
    bloodGroup: row.patient.bloodGroup,
    yearsMarried: row.yearsMarried,
    yearsTrying: row.yearsTrying,
    para: row.para,
    alc: null, // Not in schema, perhaps remove or add to schema
    weight: row.weight,
    bp: row.bloodPressure,
    infertilityType: row.infertilityType,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
