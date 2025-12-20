/**
 * Zod Validation Schemas for Pathology Module
 * Server-side and client-side validation for pathology patient data
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// UTILITY SCHEMAS
// ═══════════════════════════════════════════════════════════════

// Date preprocessing - handles string dates from JSON payloads
const datePreprocess = z.preprocess((arg) => {
  if (arg === null || arg === undefined || arg === "") return null;
  if (arg instanceof Date) return arg;
  if (typeof arg === "string") {
    const parsed = new Date(arg);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}, z.date().nullable().optional());

// ═══════════════════════════════════════════════════════════════
// BASE SCHEMAS
// ═══════════════════════════════════════════════════════════════

// Hospital validation schema
export const hospitalSchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().min(1, "Hospital name is required"),
  address: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  email: z
    .string()
    .email("Invalid email")
    .or(z.literal(""))
    .optional()
    .default(""),
  website: z
    .string()
    .url("Invalid URL")
    .or(z.literal(""))
    .optional()
    .default(""),
  type: z.string().optional().default(""),
});

// Patient validation schema
export const patientSchema = z.object({
  id: z.number().nullable().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().default(""),
  fullName: z.string().min(1, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z.number().nullable().optional(),
  dateOfBirth: datePreprocess, // Use preprocessed date
  guardianName: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  email: z
    .string()
    .email("Invalid email")
    .or(z.literal(""))
    .optional()
    .default(""),
  bloodGroup: z.string().optional().default(""),
});

// Guardian information schema
export const guardianInfoSchema = z.object({
  name: z.string().optional().default(""),
  age: z.number().nullable().optional(),
  dateOfBirth: datePreprocess, // Use preprocessed date
  gender: z.string().optional().default(""),
});

// Pathology information schema
export const pathologyInfoSchema = z.object({
  selectedTests: z
    .array(z.string())
    .min(1, "At least one test must be selected"),
  testCharge: z.number().min(0, "Test charge must be non-negative"),
  discountAmount: z
    .number()
    .min(0, "Discount must be non-negative")
    .nullable()
    .optional(),
  grandTotal: z.number().min(0, "Grand total must be non-negative"),
  // paidAmount tracks total paid - managed via shifts/payments
  paidAmount: z.number().min(0).default(0),
  dueAmount: z.number().min(0, "Due amount must be non-negative"),
  remarks: z.string().optional().default(""),
  isCompleted: z.boolean().default(false),
  referredBy: z.number().nullable().optional(),
  orderedById: z.number().nullable().optional(),
  doneById: z.number().nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════
// REQUEST/RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════

// Add patient schema (used for POST requests)
export const addPatientSchema = z.object({
  patient: patientSchema,
  hospital: hospitalSchema,
  guardianInfo: guardianInfoSchema,
  pathologyInfo: pathologyInfoSchema,
});

// Edit patient schema (used for PATCH requests)
export const editPatientSchema = z.object({
  id: z.number().positive("Invalid pathology test ID"),
  patient: patientSchema,
  hospital: hospitalSchema,
  guardianInfo: guardianInfoSchema,
  pathologyInfo: pathologyInfoSchema,
});

// Pathology filters schema (used for GET requests)
export const pathologyFiltersSchema = z.object({
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  testCategory: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// TYPE INFERENCE
// ═══════════════════════════════════════════════════════════════

export type HospitalSchema = z.infer<typeof hospitalSchema>;
export type PatientSchema = z.infer<typeof patientSchema>;
export type GuardianInfoSchema = z.infer<typeof guardianInfoSchema>;
export type PathologyInfoSchema = z.infer<typeof pathologyInfoSchema>;
export type AddPatientSchema = z.infer<typeof addPatientSchema>;
export type EditPatientSchema = z.infer<typeof editPatientSchema>;
export type PathologyFiltersSchema = z.infer<typeof pathologyFiltersSchema>;
