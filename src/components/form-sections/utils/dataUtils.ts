import {
  InfertilityPatient,
  InfertilityPatientData,
} from "../../../app/(staff)/infertility/types";

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
): InfertilityPatientData[] =>
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
    husbandAge: row.patient.guardianDOB
      ? calculateAge(row.patient.guardianDOB)
      : null,
    husbandDOB: row.patient.guardianDOB
      ? row.patient.guardianDOB instanceof Date
        ? row.patient.guardianDOB.toISOString()
        : row.patient.guardianDOB
      : null,
    husbandPhone: row.patient.guardianPhone,
    husbandEmail: row.patient.guardianEmail,
    husbandAddress: row.patient.guardianAddress,
    spouseGender: row.patient.guardianGender || "Male",
    mobileNumber: row.patient.phoneNumber,
    email: row.patient.email,
    address: row.patient.address,
    bloodGroup: row.patient.bloodGroup,
    patientOccupation: row.patient.occupation,
    husbandOccupation: row.patient.guardianOccupation,
    yearsMarried: row.yearsMarried,
    yearsTrying: row.yearsTrying,
    para: row.para,
    gravida: row.gravida,
    weight: row.weight ? Number(row.weight) : null,
    height: row.height ? Number(row.height) : null,
    bmi: row.bmi ? Number(row.bmi) : null,
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
