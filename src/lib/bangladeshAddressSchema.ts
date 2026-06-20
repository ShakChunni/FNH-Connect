/**
 * Shared Zod schema for patient address validation.
 *
 * This schema keeps the strict 64-district list and district-aware
 * canonicalization out of the lightweight `bangladeshAddress` bundle
 * (which is also pulled into client components).
 */

import { z } from "zod";
import {
  canonicalizeBangladeshAddress,
  hasRequiredBangladeshDistrict,
} from "./bangladeshAddress";

export const patientAddressSchema = z
  .string()
  .trim()
  .min(1, "Patient district is required")
  .refine(hasRequiredBangladeshDistrict, "Select a valid Bangladesh district")
  .transform(canonicalizeBangladeshAddress);
