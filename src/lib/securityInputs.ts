import { z } from "zod";

export const positiveIdSchema = z.number().int().positive().max(2147483647);
export const moneySchema = z.number().finite().min(0).max(1_000_000_000);
export const queryPageSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(1_000_000));
export const queryLimitSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(100));
export const queryDateSchema = z.string().max(40).refine((value) => Number.isFinite(Date.parse(value)), "Invalid date");
export const selectedTestsSchema = z.array(z.string().trim().min(1).max(200)).min(1).max(200).refine((names) => new Set(names).size === names.length, "Duplicate tests are not allowed");
export const infertilityStatusSchema = z.enum(["Active", "Follow-up", "Completed", "Discontinued", "Investigation Ordered"]);
export const patientRecordsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  startDate: queryDateSchema.optional(),
  endDate: queryDateSchema.optional(),
  page: queryPageSchema.default(1),
  limit: queryLimitSchema.default(15),
  gyneOnly: z.enum(["true", "false"]).optional(),
  dischargedOnly: z.enum(["true", "false"]).optional(),
  infertilityOnly: z.enum(["true", "false"]).optional(),
});
