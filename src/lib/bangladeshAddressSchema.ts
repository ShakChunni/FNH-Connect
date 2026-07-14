/**
 * Shared Zod schema for patient address validation.
 *
 * Patient address details remain free-form, but the final district is
 * required so reports and patient records keep a consistent zilla value.
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
