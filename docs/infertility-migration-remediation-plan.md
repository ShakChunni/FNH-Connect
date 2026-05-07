# Infertility Migration Remediation Plan

## Purpose

This document explains:

1. What was broken in the infertility investigation migration.
2. What the corrected infertility investigation model should be.
3. What code and data changes are required to make the system safe, repeatable, and maintainable.
4. What has already been implemented in this repository.

It is written for follow-up work by smaller models or future engineers. Do not treat the old pathology-to-infertility migration flow as valid. The previous flow guessed identity in unsafe ways and produced cross-patient contamination.

## Problem Summary

The infertility module had three separate classes of failure:

1. Authorization drift:
   - A normal `receptionist` should be able to work inside infertility investigations.
   - Access rules were duplicated across `src/lib/roles.ts` and `src/middleware.ts`.
   - The two definitions drifted, which made infertility permissions fragile.

2. Investigation data-contract bugs:
   - The infertility overview UI sent `infertilityPatientId`, but the API validation schema dropped it.
   - The overview query could therefore return investigations outside the active infertility case.
   - The filters hook and API disagreed on the format for `status` and `testNames`.

3. Migration/data-model bugs:
   - The pathology-to-infertility migration matched records by phone number.
   - It created infertility investigations with two identity sources:
     - `infertilityPatientId` from the infertility case.
     - `patientId` from the pathology test row.
   - That design allowed an infertility investigation to belong to one infertility case while still pointing directly at another patient row.
   - A single patient overview could therefore show tests from other people.

## Root Causes

### 1. Redundant patient identity on `InfertilityTest`

The old model stored both:

- `InfertilityTest.infertilityPatientId`
- `InfertilityTest.patientId`

That is structurally unsafe. An infertility investigation should belong to one infertility case, and that case already belongs to one patient. Storing a second patient foreign key on the investigation creates a second truth source that can drift.

### 2. Migration guessed identity with weak matching

The previous migration used phone-number matching to decide which infertility case to attach a pathology test to. This is not acceptable because:

- phone numbers are not unique,
- phone numbers can be shared inside families,
- phone numbers can change,
- legacy data can be incomplete or malformed.

The migration also mixed source identities by using the infertility case from one patient and the `patientId` from another row.

### 3. Repeat investigations were not modeled clearly

The infertility workflow needs to support repeat investigation orders over time. The correct business model is:

- one infertility case per patient and hospital context,
- many infertility investigation orders under that case,
- repeated test sets are allowed and must produce new investigation rows.

The system was close to this model already, but the migration and some UI assumptions did not enforce it clearly enough.

### 4. Contract drift between UI and API

The investigations UI and API had several mismatches:

- `infertilityPatientId` filter was not accepted by the schema.
- `status` was sent as booleans or mismatched values instead of `Completed | Pending | All`.
- `testNames` was passed as a serialized single string in some places instead of repeated values.

That made the filters unreliable and caused over-broad result sets.

## Correct Target Model

### Case Model

`InfertilityPatient` is the longitudinal infertility case.

This is the correct unit for:

- patient identity,
- spouse context,
- infertility history,
- hospital association,
- long-term follow-up.

### Investigation Model

`InfertilityTest` is one investigation order instance.

This is the correct unit for:

- selected test list,
- ordering date,
- completion status,
- ordering clinician,
- performing clinician,
- financial totals,
- receipts,
- repeat investigations.

A patient can receive the same test set multiple times. Each occurrence must create a new `InfertilityTest` row with its own `testNumber`, `testDate`, charges, and payment history.

### Subject Model

Infertility investigations may belong to:

- the patient,
- the spouse,
- an unresolved historical subject from legacy data.

The corrected model uses:

- `subjectType: PATIENT | SPOUSE`
- `subjectNameSnapshot: string | null`

Rules:

- New real-time orders must explicitly set `subjectType`.
- If `subjectType = PATIENT`, `subjectNameSnapshot` should usually be `null`.
- If `subjectType = SPOUSE`, the display can use spouse data from the infertility case, with `subjectNameSnapshot` available for migrations or historical fidelity.
- No migration or UI workflow should create `UNKNOWN`. Existing `UNKNOWN` rows are transitional artifacts from the additive schema rollout and should be removed only as part of scoped bad-migration cleanup.

## Data Model Changes

The corrected schema removes the unsafe duplicate patient link and adds idempotent migration tracing.

### `InfertilityTest`

Implemented changes:

- application logic stops trusting the legacy direct patient link
- legacy `InfertilityTest.patientId` is retained temporarily in the database as a non-authoritative field so the Prisma migration is non-destructive
- added `subjectType`
- added `subjectNameSnapshot`
- added `sourcePathologyTestId`
- added an index on `(infertilityPatientId, testDate desc)`

### Financial Tables

Implemented source-id tracking so migration can be rerun safely:

- `InfertilityShift.sourceShiftId`
- `InfertilityCashMovement.sourceCashMovementId`
- `InfertilityServiceCharge.sourceServiceChargeId`
- `InfertilityPayment.sourcePaymentId`
- `InfertilityPaymentAllocation.sourcePaymentAllocationId`

These fields make migration idempotent and auditable.

## Behavior Changes Required

### 1. Use infertility case identity only

All infertility investigation reads must derive patient identity through:

- `InfertilityTest -> InfertilityPatient -> Patient`

No feature should rely on a direct patient foreign key on `InfertilityTest`.
The legacy direct patient link is retained only to avoid data loss during the transitional schema migration and to help audit old migrated rows.

### 2. Allow repeated investigations

The system must treat every new order as a new row, even when:

- the same tests are ordered again,
- the same patient returns later,
- the same subject is selected.

No deduplication by selected test names should occur.

### 3. Require explicit subject selection

The investigation creation and editing flow must capture the subject clearly:

- `Patient`
- `Spouse`

This keeps future data clean and makes legacy ambiguity explicit instead of hidden.

### 4. Centralize receptionist permissions

Receptionist route access must come from one source of truth. Middleware should consume shared helpers instead of maintaining a second hard-coded route matrix.

## Migration Strategy

### Old migration status

The old `scripts/migrate-pathology-to-infertility.ts` flow is deprecated. It should not be used for new runs.

### New migration principles

The new migration must:

1. use explicit reviewed mappings,
2. migrate one pathology test to one infertility investigation,
3. write source ids into infertility target tables,
4. refuse ambiguous mappings instead of guessing,
5. flip `migratedToInfertility` only after the full migration succeeds.

### Mapping file requirement

The new migration expects a mapping JSON file with entries like:

```json
{
  "entries": [
    {
      "pathologyTestId": 123,
      "infertilityPatientId": 45,
      "subjectType": "PATIENT",
      "subjectNameSnapshot": null
    }
  ]
}
```

This is intentional. Historical migration should be reviewed, not inferred.

### Audit and reset support

Two supporting scripts are required:

- `scripts/audit-infertility-migration.ts`
- `scripts/reset-infertility-migration-batch.ts`

Audit reports unsafe or duplicate states. Reset removes migration-generated infertility rows in dependency order and reopens the corresponding pathology rows for clean remigration.

## Repository Changes Implemented

### Schema and migration

Implemented in:

- `prisma/schema.prisma`
- `prisma/migrations/20260507103000_infertility_investigation_remediation/migration.sql`

### Infertility service layer

Implemented in:

- `src/services/infertilityService.ts`

Key changes:

- flattened investigation DTOs,
- removed direct test-level patient dependency,
- added subject-aware serialization,
- fixed filter semantics,
- updated create and update flows,
- normalized selected-tests parsing.

### UI and API contract repair

Implemented in:

- `src/app/(authenticated)/infertility/types/schemas.ts`
- `src/app/(authenticated)/infertility/types/index.ts`
- `src/app/(authenticated)/infertility/hooks/useFetchInfertilityTests.ts`
- `src/app/(authenticated)/infertility/hooks/useFetchInfertilityTestReport.ts`
- `src/app/(authenticated)/infertility/hooks/useAddInfertilityTest.ts`
- `src/app/(authenticated)/infertility/hooks/useEditInfertilityTest.ts`
- `src/app/(authenticated)/infertility/components/OrderInvestigationModal.tsx`
- `src/app/(authenticated)/infertility/components/EditData/EditInvestigationModal.tsx`
- `src/app/(authenticated)/infertility/components/AddNewData/AddNewDataInfertility.tsx`
- `src/app/(authenticated)/infertility/components/form-sections/InvestigationInformation/InvestigationInformation.tsx`
- `src/app/(authenticated)/infertility/stores/testFormStore.ts`
- `src/app/api/infertility-patients/tests/route.ts`
- `src/app/api/infertility-patients/tests/[id]/route.ts`
- `src/app/api/infertility-patients/tests/report/route.ts`

Key changes:

- `infertilityPatientId` filter preserved end-to-end,
- `status` normalized to `Completed | Pending | All`,
- `testNames[]` supported consistently,
- subject selection exposed in the form flow,
- update route validated with the new schema.

### Permission consolidation

Implemented in:

- `src/lib/roles.ts`
- `src/middleware.ts`
- `tests/validate-architecture.ts`

Key changes:

- centralized receptionist allowed-route logic,
- regular infertility-portal receptionists can use infertility routes,
- architecture test updated to validate the shared helper.

### Reporting and receipts

Implemented in:

- `src/app/(authenticated)/infertility/utils/exportToCSV.ts`
- `src/app/(authenticated)/infertility/utils/generateInvestigationReport.ts`
- `src/app/(authenticated)/infertility/utils/generateReceipt.ts`
- `src/app/(authenticated)/infertility/components/InvestigationsTable/components/PatientOverview/components/ProfileCard.tsx`

Key changes:

- reports and receipts now use normalized selected tests,
- subject information is visible in output,
- profile display is consistent with the new model.

### Migration scripts

Implemented in:

- `scripts/audit-infertility-migration.ts`
- `scripts/reset-infertility-migration-batch.ts`
- `scripts/migrate-pathology-to-infertility-v2.ts`
- `scripts/migrate-pathology-to-infertility.ts`
- `scripts/migrate-infertility-cash.ts`
- `package.json`

Key changes:

- new v2 migration path requires explicit mapping,
- old migration entrypoint is now a deprecation stop,
- shared-table cash migration no longer tries to own historical pathology-origin infertility data,
- npm scripts added for audit/reset/v2 migration flows.

## Operational Runbook

Use this order when repairing a real environment:

1. Generate Prisma client and apply the additive schema migration.
2. Run the audit script and save the report.
3. Prepare the reviewed mapping JSON for historical pathology rows.
4. Run the reset script in dry-run mode.
5. Review the reset target counts.
6. Run the reset script with `--apply`.
7. Run the v2 pathology-to-infertility migration with the reviewed mapping.
8. Run the audit script again.
9. Verify patient overviews and repeated investigations manually in the UI.

Recommended commands:

```bash
npx prisma generate
npx prisma migrate dev --name infertility_investigation_remediation
npm run db:audit-infertility-migration
npm run db:reset-infertility-migration -- --dry-run
npm run db:reset-infertility-migration -- --apply
npm run db:migrate-pathology-to-infertility-v2 -- --mapping path/to/mapping.json --dry-run
npm run db:migrate-pathology-to-infertility-v2 -- --mapping path/to/mapping.json
npm run db:audit-infertility-migration
```

## Verification Checklist

- Patient overview only shows investigations for the selected `infertilityPatientId`.
- Regular `receptionist` users can perform infertility investigation work in the infertility portal.
- New investigations require a subject choice.
- A patient can receive the same test set multiple times and each order creates a distinct investigation row.
- Receipts and exports show the correct subject and selected tests.
- Migration-generated infertility rows can be audited by source ids.
- Historical pathology rows are never migrated by phone-number guessing.

## Validation Status

Repository validation completed after implementation:

- `npx prisma generate`
- `npx tsc --noEmit`

Additional validation should still be performed against a real dataset after database migration and remigration execution.
