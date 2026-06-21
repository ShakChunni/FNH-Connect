/**
 * Zod Validation Schemas for General Admission
 * Used for request validation in API routes
 */

import { z } from "zod";
import { parseDateOfBirth } from "@/lib/dateOfBirth";
import { patientAddressSchema } from "@/lib/bangladeshAddressSchema";

// ═══════════════════════════════════════════════════════════════
// GET Query Schemas
// ═══════════════════════════════════════════════════════════════

export const admissionFiltersSchema = z.object({
  status: z.string().optional(),
  departmentId: z.string().transform(Number).optional(),
  doctorId: z.string().transform(Number).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});

export type AdmissionFiltersInput = z.infer<typeof admissionFiltersSchema>;

// ═══════════════════════════════════════════════════════════════
// POST/PUT Schemas
// ═══════════════════════════════════════════════════════════════

export const admissionMedicineChargeItemSchema = z.object({
  id: z.number().optional(),
  medicineId: z
    .number()
    .int()
    .positive("Pharmacy medicine is required")
    .nullable(),
  packageCode: z.string().trim().nullable(),
  operationName: z.string().trim().min(1, "Operation name is required"),
  requestedMedicineName: z.string().trim().nullable().optional(),
  medicineName: z.string().trim().min(1, "Medicine name is required"),
  genericName: z.string().trim().nullable(),
  groupName: z.string().trim().nullable(),
  companyName: z.string().trim().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  /**
   * `unitPrice` is optional in the schema because the inventory-only
   * mode hides the price field. The server enforces a positive price
   * for legacy billable admissions; for inventory-only admissions the
   * live `Medicine.defaultSalePrice` is used as the authoritative
   * snapshot regardless of what the client submits.
   */
  unitPrice: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
  defaultSalePrice: z.number().min(0).optional(),
  isMatched: z.boolean().optional(),
});

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
  dateOfBirth: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    return parseDateOfBirth(val as Date | string | null | undefined);
  }, z.date().nullable()),
  address: patientAddressSchema,
  phoneNumber: z.string(),
  email: z.string(),
  bloodGroup: z.string(),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: z.string(),
});

export const createAdmissionSchema = z.object({
  hospital: hospitalSchema,
  patient: patientSchema,
  departmentId: z.number().min(1, "Department is required"),
  doctorId: z.number().min(1, "Doctor is required"),
  chiefComplaint: z.string().optional(),
  ward: z.string().optional(),
  seatNumber: z.string().optional(),
  status: z
    .enum([
      "Admitted",
      "Under Treatment",
      "Awaiting Discharge",
      "Discharged",
      "Canceled",
    ])
    .optional(),
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
  otherCharges: z.number().optional(),
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: z.number().nullable().optional(),
  discountAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  medicineChargeItems: z.array(admissionMedicineChargeItemSchema).optional(),
});

export const updateAdmissionSchema = z.object({
  id: z.number(),
  patient: patientSchema.optional(),
  doctorId: z.number().min(1, "Doctor is required").optional(),
  status: z
    .enum([
      "Admitted",
      "Under Treatment",
      "Awaiting Discharge",
      "Discharged",
      "Canceled",
    ])
    .optional(),
  seatNumber: z.string().optional(),
  ward: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  otType: z.string().optional(),
  remarks: z.string().optional(),
  chiefComplaint: z.string().optional(),
  serviceCharge: z.number().optional(),
  seatRent: z.number().optional(),
  otCharge: z.number().optional(),
  doctorCharge: z.number().optional(),
  surgeonCharge: z.number().optional(),
  anesthesiaFee: z.number().optional(),
  assistantDoctorFee: z.number().optional(),
  medicineCharge: z.number().min(0).optional(),
  otherCharges: z.number().optional(),
  discountType: z.enum(["percentage", "value"]).nullable().optional(),
  discountValue: z.number().nullable().optional(),
  discountAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  isDischarged: z.boolean().optional(),
  dateDischarged: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === "") return null;
      return val instanceof Date ? val : new Date(String(val));
    }, z.date().nullable())
    .optional(),
  medicineChargeItems: z.array(admissionMedicineChargeItemSchema).optional(),
});

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>;
export type UpdateAdmissionInput = z.infer<typeof updateAdmissionSchema>;
