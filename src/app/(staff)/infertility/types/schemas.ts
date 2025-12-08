/**
 * Zod Validation Schemas for Infertility Patient Management
 * Used for request validation in API routes
 */

import { z } from "zod";

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
  dateOfBirth: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    },
    z
      .string()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
  ),
  guardianName: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  bloodGroup: z.string(),
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
  dateOfBirth: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    },
    z
      .string()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
  ),
  gender: z.string(),
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
  nextAppointment: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      if (val instanceof Date) return val.toISOString();
      return String(val);
    },
    z
      .string()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
  ),
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
