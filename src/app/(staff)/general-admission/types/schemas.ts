/**
 * Zod Validation Schemas for General Admission
 * Used for request validation in API routes
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// GET Query Schemas
// ═══════════════════════════════════════════════════════════════

export const admissionFiltersSchema = z.object({
  status: z.string().optional(),
  departmentId: z.string().transform(Number).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AdmissionFiltersInput = z.infer<typeof admissionFiltersSchema>;

// ═══════════════════════════════════════════════════════════════
// POST/PUT Schemas
// ═══════════════════════════════════════════════════════════════

export const hospitalSchema = z.object({
  id: z.number().nullable(),
  name: z.string().min(1, "Hospital name is required"),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  website: z.string(),
  type: z.string(),
});

export const patientSchema = z.object({
  id: z.number().nullable(),
  firstName: z.string().min(1, "Patient first name is required"),
  lastName: z.string(),
  fullName: z.string(),
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
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  bloodGroup: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
});

export const createAdmissionSchema = z.object({
  hospital: hospitalSchema,
  patient: patientSchema,
  departmentId: z.number().min(1, "Department is required"),
  doctorId: z.number().min(1, "Doctor is required"),
});

export const updateAdmissionSchema = z.object({
  id: z.number(),
  status: z
    .enum(["Admitted", "Under Treatment", "Awaiting Discharge", "Discharged"])
    .optional(),
  seatNumber: z.string().optional(),
  ward: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  otType: z.string().optional(),
  remarks: z.string().optional(),
  serviceCharge: z.number().optional(),
  seatRent: z.number().optional(),
  otCharge: z.number().optional(),
  doctorCharge: z.number().optional(),
  surgeonCharge: z.number().optional(),
  anesthesiaFee: z.number().optional(),
  assistantDoctorFee: z.number().optional(),
  medicineCharge: z.number().optional(),
  otherCharges: z.number().optional(),
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: z.number().nullable().optional(),
  discountAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  isDischarged: z.boolean().optional(),
  dateDischarged: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null;
        if (val instanceof Date) return val.toISOString();
        return String(val);
      },
      z
        .string()
        .nullable()
        .transform((val) => (val ? new Date(val) : null))
    )
    .optional(),
});

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>;
export type UpdateAdmissionInput = z.infer<typeof updateAdmissionSchema>;
