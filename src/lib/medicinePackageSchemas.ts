import { z } from "zod";

export const medicinePackageQuerySchema = z.object({
  code: z.string().trim().min(1).max(100).optional(),
});

