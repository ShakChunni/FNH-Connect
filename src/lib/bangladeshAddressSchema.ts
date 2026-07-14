/**
 * Shared Zod schema for patient address validation.
 *
 * Zilla autocomplete and canonicalization are helpful UI enhancements, but
 * the patient address itself remains free-form. A receptionist should not be
 * blocked from saving a complete address just because the final segment was
 * typed manually or does not match the district list exactly.
 */

import { z } from "zod";
import { canonicalizeBangladeshAddress } from "./bangladeshAddress";

export const patientAddressSchema = z
  .string()
  .trim()
  .min(1, "Patient address is required")
  .transform(canonicalizeBangladeshAddress);
