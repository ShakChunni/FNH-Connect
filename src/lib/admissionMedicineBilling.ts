/**
 * Admission Medicine Billing Mode
 *
 * Controls whether medicines attached to a General Admission increase
 * admission billing totals, patient-account charges, service charges, and
 * invoice money.
 *
 * The browser-safe default below is used at the boundary where the server
 * needs to know which mode to assign to a new admission. Historical
 * admissions keep their own `Admission.medicineBillingEnabled` value
 * written by the migration; this constant only affects admissions created
 * after a deployment.
 *
 * Switching back to billed medicines later only requires changing this
 * constant and redeploying — no data rewrite of existing rows.
 */

export const DEFAULT_ADMISSION_MEDICINE_BILLING_ENABLED = false;
