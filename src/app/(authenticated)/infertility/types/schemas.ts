import { positiveIdSchema, moneySchema, queryPageSchema, queryLimitSchema, queryDateSchema, selectedTestsSchema, infertilityStatusSchema } from "@/lib/securityInputs";
/**
 * Zod Validation Schemas for Infertility Patient Management
 * Used for request validation in API routes
 */

import { z } from "zod";
import { parseDateOfBirth } from "@/lib/dateOfBirth";
import { patientAddressSchema } from "@/lib/bangladeshAddressSchema";

const investigationSubjectTypeSchema = z.enum([
  "PATIENT",
  "SPOUSE",
]);

// ═══════════════════════════════════════════════════════════════
// GET Query Schemas
// ═══════════════════════════════════════════════════════════════

export const infertilityFiltersSchema = z.object({
  status: z.enum(["Active", "Follow-up", "Completed", "Discontinued", "Inactive", "Pending", "All"]).optional(),
  hospitalId: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(positiveIdSchema).optional(),
  infertilityType: z.string().max(10000).optional(),
  search: z.string().max(200).optional(),
  startDate: queryDateSchema.optional(), // ISO date string
  endDate: queryDateSchema.optional(), // ISO date string
  testNames: z
    .string().max(40000)
    .optional()
    .transform((value) =>
      value ? value.split("|").filter(Boolean) : undefined,
    ).pipe(z.array(z.string().min(1).max(200)).max(200).optional()),
  // Pagination params
  page: queryPageSchema.optional(),
  limit: queryLimitSchema.optional(),
});

export type InfertilityFiltersInput = z.infer<typeof infertilityFiltersSchema>;

// ═══════════════════════════════════════════════════════════════
// POST/PATCH Request Schemas
// ═══════════════════════════════════════════════════════════════

export const patientDataSchema = z.object({
  id: positiveIdSchema.nullable(),
  firstName: z.string().max(200).min(1, "First name is required"),
  lastName: z.string().max(200),
  fullName: z.string().max(200).min(1, "Full name is required"),
  gender: z.string().max(200).min(1, "Gender is required"),
  age: z.number().nullable(),
  dateOfBirth: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return parseDateOfBirth(val as Date | string | null | undefined);
  }, z.date().nullable()),
  guardianName: z.string().max(200),
  address: patientAddressSchema,
  phoneNumber: z.string().max(200),
  email: z.string().max(200),
  bloodGroup: z.string().max(200),
  occupation: z.string().max(200),
});

export const hospitalDataSchema = z.object({
  id: positiveIdSchema.nullable(),
  name: z.string().max(200).min(1, "Hospital name is required"),
  address: z.string().max(10000),
  phoneNumber: z.string().max(200),
  email: z.string().max(200),
  website: z.string().max(200),
  type: z.string().max(200),
});

export const spouseInfoSchema = z.object({
  name: z.string().max(200),
  age: z.number().nullable(),
  dateOfBirth: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return parseDateOfBirth(val as Date | string | null | undefined);
  }, z.date().nullable()),
  gender: z.string().max(200),
  occupation: z.string().max(200),
  phoneNumber: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
});

export const medicalInfoSchema = z.object({
  yearsMarried: z.number().nullable(),
  yearsTrying: z.number().nullable(),
  infertilityType: z.string().max(10000),
  para: z.string().max(10000),
  gravida: z.string().max(10000),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  bmi: z.number().nullable(),
  bloodPressure: z.string().max(10000),
  medicalHistory: z.string().max(10000),
  surgicalHistory: z.string().max(10000),
  menstrualHistory: z.string().max(10000),
  contraceptiveHistory: z.string().max(10000),
  referralSource: z.string().max(10000),
  chiefComplaint: z.string().max(10000),
  treatmentPlan: z.string().max(10000),
  medications: z.string().max(10000),
  nextAppointment: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return val instanceof Date ? val : new Date(String(val));
  }, z.date().nullable()),
  status: infertilityStatusSchema,
  notes: z.string().max(10000),
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
  search: z.string().max(200).optional(),
  limit: queryLimitSchema.optional(),
});

export type HospitalSearchInput = z.infer<typeof hospitalSearchSchema>;

// Hospital query schema (for GET with more filter options)
export const hospitalQuerySchema = z.object({
  search: z.string().max(200).optional(),
  type: z.string().max(200).optional(),
  limit: queryLimitSchema.optional(),
});

export type HospitalQueryInput = z.infer<typeof hospitalQuerySchema>;

// Hospital creation schema
export const createHospitalSchema = z.object({
  name: z.string().max(200).min(1, "Hospital name is required"),
  address: z.string().max(10000).optional(),
  phoneNumber: z.string().max(200).optional(),
  email: z.string().max(200).email().optional().or(z.literal("")),
  website: z.string().max(200).url().optional().or(z.literal("")),
  type: z.string().max(200).optional(),
});

export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;

export const infertilityTestFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  startDate: queryDateSchema.optional(),
  endDate: queryDateSchema.optional(),
  status: z.enum(["Completed", "Pending", "All"]).optional(),
  orderedById: z.coerce.number().int().positive().max(2147483647).optional(),
  doneById: z.coerce.number().int().positive().max(2147483647).optional(),
  testNames: z.array(z.string().max(200)).max(200).optional(),
  infertilityPatientId: z.coerce.number().int().positive().max(2147483647).optional(),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const createInfertilityTestSchema = z.object({
  infertilityPatientId: positiveIdSchema,
  subjectType: investigationSubjectTypeSchema,
  subjectNameSnapshot: z.string().max(200).trim().min(1).nullable().optional(),
  selectedTests: selectedTestsSchema,
  testCharge: moneySchema,
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: moneySchema.nullable().optional(),
  discountAmount: moneySchema.default(0),
  grandTotal: moneySchema,
  paidAmount: moneySchema,
  dueAmount: moneySchema,
  orderedById: positiveIdSchema,
  doneById: positiveIdSchema.nullable().optional(),
  remarks: z.string().max(10000).optional(),
  testDate: queryDateSchema.optional(),
  isCompleted: z.boolean().optional(),
});

export const updateInfertilityTestSchema = z.object({
  subjectType: investigationSubjectTypeSchema.optional(),
  subjectNameSnapshot: z.string().max(200).trim().min(1).nullable().optional(),
  selectedTests: selectedTestsSchema.optional(),
  testCharge: moneySchema.optional(),
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: moneySchema.nullable().optional(),
  discountAmount: moneySchema.optional(),
  grandTotal: moneySchema.optional(),
  paidAmount: moneySchema.optional(),
  dueAmount: moneySchema.optional(),
  orderedById: positiveIdSchema.optional(),
  doneById: positiveIdSchema.nullable().optional(),
  remarks: z.string().max(10000).nullable().optional(),
  testDate: queryDateSchema.optional(),
  isCompleted: z.boolean().optional(),
});
