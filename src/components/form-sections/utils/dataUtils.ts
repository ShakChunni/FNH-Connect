import {
  InfertilityPatient,
  InfertilityPatientData,
} from "../../../app/(authenticated)/infertility/types";
import {
  getAgeInYearsFromDateOfBirth,
  serializeDateOfBirth,
} from "@/lib/dateOfBirth";

const calculateAge = (dateOfBirth: Date | string | null): number | null => {
  return getAgeInYearsFromDateOfBirth(dateOfBirth);
};

export const normalizePatientData = (
  patientData: InfertilityPatient[] | undefined,
): InfertilityPatientData[] =>
  (patientData || []).map((row) => ({
    id: row.id,
    caseNumber: row.caseNumber, // Format: INF-YYMMDD-XXXX
    patientId: row.patient.id,
    hospitalId: row.hospital.id,
    hospitalName: row.hospital.name,
    hospitalAddress: row.hospital.address,
    hospitalPhone: row.hospital.phoneNumber,
    hospitalEmail: row.hospital.email,
    hospitalWebsite: row.hospital.website,
    hospitalType: row.hospital.type,
    patientFirstName: row.patient.firstName,
    patientLastName: row.patient.lastName,
    patientFullName: row.patient.fullName,
    patientGender: row.patient.gender,
    patientAge: calculateAge(row.patient.dateOfBirth),
    patientDOB: serializeDateOfBirth(row.patient.dateOfBirth),
    husbandName: row.patient.guardianName,
    husbandAge: row.patient.guardianDOB
      ? calculateAge(row.patient.guardianDOB)
      : null,
    husbandDOB: serializeDateOfBirth(row.patient.guardianDOB),
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
