import { InfertilityPatient } from "../../../app/(staff)/infertility/types";

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
    gravida: row.gravida,
    weight: row.weight,
    height: row.height,
    bmi: row.bmi,
    bloodPressure: row.bloodPressure,
    infertilityType: row.infertilityType,
    // Medical history fields
    medicalHistory: row.medicalHistory,
    surgicalHistory: row.surgicalHistory,
    menstrualHistory: row.menstrualHistory,
    contraceptiveHistory: row.contraceptiveHistory,
    referralSource: row.referralSource,
    chiefComplaint: row.chiefComplaint,
    treatmentPlan: row.treatmentPlan,
    medications: row.medications,
    nextAppointment: row.nextAppointment
      ? row.nextAppointment instanceof Date
        ? row.nextAppointment.toISOString()
        : row.nextAppointment
      : null,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
