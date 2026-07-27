import { z } from "zod";

export const medicinePackageQuerySchema = z.object({
  code: z.string().trim().min(1).max(100).optional(),
  mode: z.enum(["resolve", "list", "manage"]).optional(),
});

export const medicinePackageItemSchema = z.object({
  templateName: z.string().trim().min(1).max(200),
  aliases: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
  quantity: z.number().int().min(1).max(1000).default(1),
});

export const medicinePackageDefinitionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, "Package code may contain only letters, numbers, _ and -"),
  name: z.string().trim().min(1).max(200),
  operationName: z.string().trim().min(1).max(100),
  // Optional for backward compatibility with the original global package
  // config. The service assigns a safe legacy default when it is missing.
  departmentName: z.string().trim().min(1).max(100).optional(),
  items: z.array(medicinePackageItemSchema).min(1).max(200),
});

export const medicinePackageDefinitionsSchema = z.array(
  medicinePackageDefinitionSchema,
);

export type MedicinePackageDefinition = z.infer<
  typeof medicinePackageDefinitionSchema
>;
