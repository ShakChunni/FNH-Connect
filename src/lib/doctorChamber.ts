import { z } from "zod";
import { parseDateOfBirth } from "@/lib/dateOfBirth";

export const DOCTOR_CHAMBER_CONFIG = {
  doctorDisplayName: "Prof. Dr. Sufia Khatun",
  doctorSearchFirstName: "Sufia",
  doctorSearchLastName: "Khatun",
  departmentName: "Dr Sufia Khatun Chamber",
  visitNumberPrefix: "CHAMBER",
  ultrasoundCode: "USG-LOWER-ABDOMEN",
  ultrasoundName: "Ultra Sono (Lower Abdomen)",
  ultrasoundCharge: 800,
} as const;

export interface DoctorChamberFeeInput {
  id?: number;
  feeName: string;
  amount: number;
}

export type DoctorChamberDiscountType = "percentage" | "value";

export interface DoctorChamberPatientInput {
  id: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
  guardianName: string;
  guardianGender: string;
  guardianPhone: string;
  guardianAddress: string;
  guardianEmail: string;
}

export interface DoctorChamberVisitInput {
  patient: DoctorChamberPatientInput;
  visitingCharge: number;
  fees: DoctorChamberFeeInput[];
  discountType: DoctorChamberDiscountType | null;
  discountValue: number | null;
  notes: string;
}

export interface DoctorChamberFeeRecord {
  id: number;
  feeName: string;
  amount: number;
}

export interface DoctorChamberVisitRecord {
  id: number;
  visitNumber: string;
  visitDate: string;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  patientId: number;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientGender: string;
  patientDateOfBirth: string | null;
  patientAddress: string | null;
  patientPhoneNumber: string | null;
  patientEmail: string | null;
  patientBloodGroup: string | null;
  guardianName: string | null;
  guardianGender: string | null;
  guardianPhone: string | null;
  guardianAddress: string | null;
  guardianEmail: string | null;
  ultrasoundCode: string;
  ultrasoundName: string;
  ultrasoundCharge: number;
  visitingCharge: number;
  subtotal: number;
  discountType: DoctorChamberDiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  fees: DoctorChamberFeeRecord[];
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName: string | null;
  lastModifiedBy: number;
  lastModifiedByName: string | null;
}

const dateOfBirthSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value !== "string" && !(value instanceof Date)) {
      return value;
    }

    return parseDateOfBirth(value);
  },
  z.date().nullable(),
);

const patientInputSchema = z.object({
  id: z.number().int().positive().nullable(),
  firstName: z.string().trim().min(1, "Patient first name is required").max(100),
  lastName: z.string().trim().max(100),
  fullName: z.string().trim().min(1, "Patient full name is required").max(205),
  gender: z.string().trim().min(1, "Patient gender is required").max(30),
  dateOfBirth: dateOfBirthSchema,
  address: z.string().trim().max(1000),
  phoneNumber: z.string().trim().max(30),
  email: z.string().trim().email("Invalid email").or(z.literal("")),
  bloodGroup: z.string().trim().max(10),
  guardianName: z.string().trim().max(205),
  guardianGender: z.string().trim().max(30),
  guardianPhone: z.string().trim().max(30),
  guardianAddress: z.string().trim().max(1000),
  guardianEmail: z.string().trim().email("Invalid guardian email").or(z.literal("")),
});

const feeInputSchema = z.object({
  id: z.number().int().positive().optional(),
  feeName: z.string().trim().min(1, "Charge name is required").max(100),
  amount: z.number().finite().min(0, "Charge amount cannot be negative").max(100000000),
});

const discountTypeSchema = z.enum(["percentage", "value"]).nullable().default("value");
const discountValueSchema = z
  .number()
  .finite()
  .min(0, "Discount cannot be negative")
  .nullable()
  .default(null);

export const doctorChamberVisitSchema = z.object({
  patient: patientInputSchema,
  visitingCharge: z
    .number()
    .finite()
    .min(0, "Visiting charge cannot be negative")
    .max(100000000),
  fees: z.array(feeInputSchema).max(20, "You can add up to 20 extra charges"),
  discountType: discountTypeSchema,
  discountValue: discountValueSchema,
  notes: z.string().trim().max(2000),
}).superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue !== null && value.discountValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.too_big,
      origin: "number",
      maximum: 100,
      inclusive: true,
      path: ["discountValue"],
      message: "Percentage discount cannot exceed 100%",
    });
  }
});

export const doctorChamberQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(15),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate) {
      if (new Date(value.startDate) >= new Date(value.endDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be after start date",
        });
      }
    }
  });

export type DoctorChamberVisitSchema = z.infer<typeof doctorChamberVisitSchema>;
export type DoctorChamberQuerySchema = z.infer<typeof doctorChamberQuerySchema>;
