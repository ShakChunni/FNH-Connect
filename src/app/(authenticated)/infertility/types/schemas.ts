/**
 * Zod Validation Schemas for Infertility Patient Management
 * Used for request validation in API routes
 */

import { z } from "zod";
import { parseDateOfBirth } from "@/lib/dateOfBirth";

// ═══════════════════════════════════════════════════════════════
// GET Query Schemas
// ═══════════════════════════════════════════════════════════════

export const infertilityFiltersSchema = z.object({
  status: z.string().optional(),
  hospitalId: z.string().transform(Number).optional(),
  infertilityType: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  // Pagination params
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type InfertilityFiltersInput = z.infer<typeof infertilityFiltersSchema>;

// ═══════════════════════════════════════════════════════════════
// POST/PATCH Request Schemas
// ═══════════════════════════════════════════════════════════════

export const patientDataSchema = z.object({
  id: z.number().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z.number().nullable(),
  dateOfBirth: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return parseDateOfBirth(val as Date | string | null | undefined);
  }, z.date().nullable()),
  guardianName: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  bloodGroup: z.string(),
  occupation: z.string(),
});

export const hospitalDataSchema = z.object({
  id: z.number().nullable(),
  name: z.string().min(1, "Hospital name is required"),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  website: z.string(),
  type: z.string(),
});

export const spouseInfoSchema = z.object({
  name: z.string(),
  age: z.number().nullable(),
  dateOfBirth: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return parseDateOfBirth(val as Date | string | null | undefined);
  }, z.date().nullable()),
  gender: z.string(),
  occupation: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
});

export const medicalInfoSchema = z.object({
  yearsMarried: z.number().nullable(),
  yearsTrying: z.number().nullable(),
  infertilityType: z.string(),
  para: z.string(),
  gravida: z.string(),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  bmi: z.number().nullable(),
  bloodPressure: z.string(),
  medicalHistory: z.string(),
  surgicalHistory: z.string(),
  menstrualHistory: z.string(),
  contraceptiveHistory: z.string(),
  referralSource: z.string(),
  chiefComplaint: z.string(),
  treatmentPlan: z.string(),
  medications: z.string(),
  nextAppointment: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return val instanceof Date ? val : new Date(String(val));
  }, z.date().nullable()),
  status: z.string(),
  notes: z.string(),
});

export const addPatientSchema = z.object({
  patient: patientDataSchema,
  hospital: hospitalDataSchema,
  spouseInfo: spouseInfoSchema,
  medicalInfo: medicalInfoSchema,
});

export type AddPatientInput = z.infer<typeof addPatientSchema>;

// Edit schema - id comes from URL, not body
export const editPatientSchema = z.object({
  patient: patientDataSchema,
  hospital: hospitalDataSchema,
  spouseInfo: spouseInfoSchema,
  medicalInfo: medicalInfoSchema,
});

export type EditPatientInput = z.infer<typeof editPatientSchema>;

// Hospital search schema
export const hospitalSearchSchema = z.object({
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
});

export type HospitalSearchInput = z.infer<typeof hospitalSearchSchema>;

// Hospital query schema (for GET with more filter options)
export const hospitalQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  limit: z.string().transform(Number).optional(),
});

export type HospitalQueryInput = z.infer<typeof hospitalQuerySchema>;

// Hospital creation schema
export const createHospitalSchema = z.object({
  name: z.string().min(1, "Hospital name is required").max(200),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  type: z.string().optional(),
});

export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;

export const infertilityTestFiltersSchema = z.object({
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["Completed", "Pending", "All"]).optional(),
  orderedById: z.coerce.number().optional(),
  doneById: z.coerce.number().optional(),
  testNames: z.array(z.string()).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15),
});

export const createInfertilityTestSchema = z.object({
  infertilityPatientId: z.number(),
  selectedTests: z.array(z.string()).min(1),
  testCharge: z.number().min(0),
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: z.number().nullable().optional(),
  discountAmount: z.number().default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0),
  dueAmount: z.number().min(0),
  orderedById: z.number(),
  doneById: z.number().nullable().optional(),
  remarks: z.string().optional(),
  testDate: z.string().optional(),
});
