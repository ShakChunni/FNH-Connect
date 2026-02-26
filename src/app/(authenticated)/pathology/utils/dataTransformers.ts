/**
 * Pathology Data Transformers
 * Utility functions to transform data between API and UI formats
 */

import { PathologyPatient, PathologyPatientData } from "../types";

/**
 * Transform PathologyPatient (API response) to PathologyPatientData (UI format)
 * This is used for report generation and table display
 */
export function transformPathologyPatient(
  patient: PathologyPatient,
): PathologyPatientData {
  return {
    id: patient.id,
    patientId: patient.patientId,
    testNumber: patient.testNumber,
    patientFullName: patient.patient.fullName,
    patientFirstName: patient.patient.firstName,
    patientLastName: patient.patient.lastName,
    patientGender: patient.patient.gender,
    patientAge: patient.patient.age,
    patientDOB: patient.patient.dateOfBirth
      ? new Date(patient.patient.dateOfBirth).toISOString()
      : null,
    guardianName: patient.patient.guardianName,
    guardianAge: null,
    guardianDOB: patient.patient.guardianDOB
      ? new Date(patient.patient.guardianDOB).toISOString()
      : null,
    guardianGender: patient.patient.guardianGender || "",
    mobileNumber: patient.patient.phoneNumber,
    email: patient.patient.email,
    address: patient.patient.address,
    bloodGroup: patient.patient.bloodGroup,
    hospitalId: patient.patient.hospitalId || 0,
    hospitalName: patient.patient.hospital?.name || null,
    hospitalAddress: patient.patient.hospital?.address || null,
    hospitalPhone: patient.patient.hospital?.phoneNumber || null,
    hospitalEmail: patient.patient.hospital?.email || null,
    hospitalWebsite: patient.patient.hospital?.website || null,
    hospitalType: patient.patient.hospital?.type || null,
    testDate: patient.testDate,
    reportDate: patient.reportDate,
    testCategory: patient.testCategory,
    testResults: patient.testResults,
    remarks: patient.remarks,
    isCompleted: patient.isCompleted,
    testCharge: Number(patient.testCharge),
    discountType: patient.discountType,
    discountValue: patient.discountValue ? Number(patient.discountValue) : null,
    discountAmount: Number(patient.discountAmount),
    grandTotal: Number(patient.grandTotal),
    paidAmount: Number(patient.paidAmount),
    dueAmount: Number(patient.dueAmount),
    referredBy: patient.referredBy || null,
    orderedById: patient.orderedById,
    orderedBy: patient.orderedBy?.fullName || null,
    doneById: patient.doneById,
    doneBy: patient.doneBy?.fullName || null,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    createdBy: patient.createdBy,
    lastModifiedBy: patient.lastModifiedBy,
    createdByName: patient.createdByName || null,
    lastModifiedByName: patient.lastModifiedByName || null,
  };
}

/**
 * Transform array of PathologyPatient to PathologyPatientData
 */
export function transformPathologyPatients(
  patients: PathologyPatient[],
): PathologyPatientData[] {
  return patients.map(transformPathologyPatient);
}
