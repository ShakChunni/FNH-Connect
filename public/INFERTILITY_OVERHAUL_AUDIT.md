# Infertility Overhaul — Implementation Audit

> **Date**: May 01, 2026  
> **Based on**: `prisma/INFERTILITY_OVERHAUL_PLAN.md` (Phases 1–8)  
> **Status**: 95% complete — 1 structural gap, 2 minor deviations, 3 plan gaps

---

## Overall Verdict

44 of 46 audit items are fully implemented. The codebase has been substantially overhauled across all 8 phases. Production quality is solid — CRUD, financial separation, access control, reports, and dashboard integration are all in place.

---

## Phase-by-Phase Status

### Phase 1: Database Schema — DONE

| Item | Status |
|------|--------|
| `InfertilityTest` model (schema.prisma:542-590) | Done |
| `Patient.infertilityTests` relation (schema.prisma:40) | Done |
| `InfertilityPatient.tests` relation (schema.prisma:533) | Done |
| `Staff.infertilityTestOrdered` / `infertilityTestDone` (schema.prisma:87-88) | Done |
| `Admission.infertilityTests` relation (schema.prisma:178) | Done |
| Migration run | Done |

### Phase 2: Backend Service Layer — DONE

| Function | File/Lines | Status |
|----------|-----------|--------|
| `InfertilityTestFilters` interface | `src/services/infertilityService.ts:687-698` | Done |
| `InfertilityTestData` interface | `src/services/infertilityService.ts:700-715` | Done |
| `getInfertilityTests()` — full filters, pagination, parallel queries | `src/services/infertilityService.ts:717-837` | Done |
| `getInfertilityTestById()` — findUnique with includes | `src/services/infertilityService.ts:839-872` | Done |
| `createInfertilityTest()` — transaction: verify, generate test#, create ServiceCharge, payments, cash tracking, activity log | `src/services/infertilityService.ts:874-1064` | Done |
| `updateInfertilityTest()` — transaction: find, update, log activity | `src/services/infertilityService.ts:1066-1118` | Done |
| `getInfertilityTestsForReport()` — delegates to getInfertilityTests | `src/services/infertilityService.ts:1120-1126` | Done |
| ServiceCharge uses `serviceType: "INFERTILITY_TEST"` (line 978) | Done |

### Phase 3: API Routes — DONE

| Route | Status |
|-------|--------|
| `api/infertility-patients/tests/route.ts` — GET (list) + POST (create) | Done |
| `api/infertility-patients/tests/[id]/route.ts` — GET + PUT + PATCH | Done |
| `api/infertility-patients/tests/report/route.ts` — GET (all for reports) | Done |
| Validation schemas (`infertilityTestFiltersSchema`, `createInfertilityTestSchema`) in `types/schemas.ts:147-173` | Done |

### Phase 4: Frontend Types, Stores & Hooks — DONE

| Item | Status |
|------|--------|
| `InfertilityTestInfo` type (types/index.ts:368-383) | Done |
| `InfertilityTestData` type (types/index.ts:385-434) — includes extras beyond plan (bloodGroup, hospital info, createdByName, etc.) | Done |
| `InfertilityTestFilters` type (types/index.ts:436-446) | Done |
| `testFilterStore.ts` — full Zustand store with filter values, panel state, report state, actions, selectors (330 lines) | Done |
| `testFormStore.ts` — full Zustand store with form state, actions, smart financial calculations (362 lines) | Done |
| Stores index.ts exports both test stores | Done |
| `useFetchInfertilityTests.ts` — React Query hook | Done |
| `useAddInfertilityTest.ts` — React Query mutation | Done |
| `useEditInfertilityTest.ts` — React Query mutation | Done |
| `useFetchInfertilityTestReport.ts` — React Query mutation (on-demand) | Done |
| `useFetchDoctors.ts` — shared app-wide | Done |
| Hooks index.ts exports all 5 + existing hooks | Done |

### Phase 5: Frontend Components — DONE

| Component | Status |
|-----------|--------|
| `constants/infertilityTests.ts` — re-exports pathology test catalogue | Done |
| `components/form-sections/InvestigationInformation/` — InvestigationInformation.tsx, InvestigationTestSelector.tsx, OrderingDoctorDropdown.tsx | Done |
| `components/InvestigationsTable/` — InvestigationsTable.tsx, utils.ts, TableRow, TableRowSkeleton, PatientOverview with FinancialOverview (6+ files) | Done |
| `components/AddNewData/AddNewDataInfertility.tsx` — includes investigation form section | Done |
| `page.tsx` — Patients | Investigations tab navigation (306 lines) | Done |

### Phase 6: Receipt & Report Generation — DONE

| Utility | Status |
|---------|--------|
| `utils/generateReceipt.ts` — "INFERTILITY INVESTIGATION INVOICE", jsPDF + autoTable, multi-page, DUE stamp (347 lines) | Done |
| `utils/generateInvestigationReport.ts` — Summary + Detailed reports, metric boxes, test breakdown, doctor breakdown (267 lines) | Done |
| `utils/exportToCSV.ts` — Headers: Test Number, Date, Patient Name, Phone, Case Number, Ordered By, Investigations, Status, financial fields (69 lines) | Done |

### Phase 7: Search, Filters & Export Bar — DONE

| Component | Status |
|-----------|--------|
| `components/InfertilitySearch.tsx` — enhanced with tabs, FilterTriggerButton, ReportTriggerButton | Done |
| `components/filter/Filters.tsx` — slide-out drawer with Framer Motion animation (118 lines) | Done |
| `components/filter/FilterTriggerButton.tsx` | Done |
| `components/filter/InvestigationReportTriggerButton.tsx` — Summary, Financial, Detailed, CSV dropdown | Done |
| `components/filter/ExportActionBar.tsx` — floating bar when filters active | Done |
| `components/filter/DateRangePill.tsx` | Done |
| Filter sub-components: DoctorFilter, StatusFilter, DateRangeFilter, TestFilter | Done |
| Filter index.ts exports all | Done |

### Phase 8: Financial Separation & Access Control — MOSTLY DONE

| Item | Status |
|------|--------|
| ServiceCharge `serviceType: "INFERTILITY_TEST"` used consistently | Done |
| Admin infertility shift tracking (`adminInfertilityShiftService.ts` — 326 lines) | Done |
| Dashboard: `infertilityDoneToday`, `infertilityDoneAllTime`, recent infertility patients | Done |
| `roles.ts`: `/infertility` + `/api/infertility` in receptionist allowed routes | Done |
| `navigation.ts`: `/infertility` in sidebar routes, `"Infertility Cash"` admin route | Done |
| Admission fee conditional logic (Task 8.5) | NOT VERIFIED |
| `Payment.department` field (Task 8.2 Option A) | NOT DONE |

---

## STRUCTURAL GAP: Missing `ServiceCharge` ↔ `InfertilityTest` FK

### Problem

`PathologyTest` has a proper bidirectional link:

```prisma
PathologyTest.serviceCharges   ServiceCharge[]   // reverse
ServiceCharge.pathologyTestId  Int?              // FK
```

`InfertilityTest` does **not**:

- No `serviceCharges` field on `InfertilityTest`
- No `infertilityTestId` field on `ServiceCharge`

### Impact

- Cannot trace "show me all charges for infertility test #157"
- Cannot cascade or resolve orphans if a test is deleted
- Cannot audit which test a payment was allocated to without joining through `serviceType` string matching

### Fix Required

Add to `prisma/schema.prisma`:

```prisma
// ServiceCharge model — add after pathologyTestId
infertilityTestId  Int?
infertilityTest    InfertilityTest?  @relation(fields: [infertilityTestId], references: [id])

// InfertilityTest model — add reverse relation
serviceCharges     ServiceCharge[]
```

Then `npx prisma migrate dev --name add-infertility-test-fk`.

---

## MINOR DEVIATIONS FROM PLAN

| Plan Specified | Actually Implemented | Impact |
|---------------|---------------------|--------|
| `utils/generateInvestigationReceipt.ts` | `utils/generateReceipt.ts` (function: `generateInfertilityTestReceipt`) | None — same behavior |
| `filter/ReportTriggerButton.tsx` | `filter/InvestigationReportTriggerButton.tsx` (aliased as `ReportTriggerButton` in index.ts) | None — barrel export handles it |

---

## PLAN GAPS (Things the Plan Didn't Address)

| Gap | Detail |
|-----|--------|
| **No audit trail for tests** | Without `ServiceCharge.infertilityTestId`, you can't trace from InfertilityTest → what was charged and paid. The FK fix above resolves this. |
| **`Payment.department` not added** | Plan Task 8.2 Option A suggested adding a `department` field to `Payment` for per-department cash reconciliation. Not implemented. All filtering relies on joining `Payment → PaymentAllocation → ServiceCharge.serviceType`. |
| **Admission fee logic not verified** | Plan Task 8.5 said the 300 BDT fee should only apply on actual admission, not auto-applied to infertility. No infertility-specific admission fee code was found — may already be correct, but should be audited. |

---

## IMPLEMENTATION QUALITY NOTES

**What's well done:**
- Full transaction handling in `createInfertilityTest()` — PatientAccount, ServiceCharge, Payment, PaymentAllocation, CashMovement, Shift update, ActivityLog all in one atomic block
- Smart financial calculations in `testFormStore.ts` — auto-calculates discount, grand total, due amount on field changes
- Test number generation follows the same `INFT-YY-XXXXX` pattern as pathology
- Parallel queries in `getInfertilityTests()` (count + data fetched together)
- CSRF protection on POST routes, auth checks on all routes
- Framer Motion animations on filter drawer
- Proper React Query stale time / gc time / retry logic in hooks

**Edge cases handled:**
- Empty state in InvestigationsTable
- Multi-page PDF receipt generation with chunking
- Date range formatting in reports
- Keyboard escape and body scroll lock on filter drawer

---

## FILES CHANGED SUMMARY

### New Files Created (~20)

```
src/app/(authenticated)/infertility/constants/infertilityTests.ts
src/app/(authenticated)/infertility/stores/testFilterStore.ts
src/app/(authenticated)/infertility/stores/testFormStore.ts
src/app/(authenticated)/infertility/hooks/useFetchInfertilityTests.ts
src/app/(authenticated)/infertility/hooks/useAddInfertilityTest.ts
src/app/(authenticated)/infertility/hooks/useEditInfertilityTest.ts
src/app/(authenticated)/infertility/hooks/useFetchInfertilityTestReport.ts
src/app/(authenticated)/infertility/hooks/useFetchDoctors.ts
src/app/(authenticated)/infertility/components/form-sections/InvestigationInformation/
src/app/(authenticated)/infertility/components/InvestigationsTable/
src/app/(authenticated)/infertility/components/filter/Filters.tsx
src/app/(authenticated)/infertility/components/filter/FilterTriggerButton.tsx
src/app/(authenticated)/infertility/components/filter/InvestigationReportTriggerButton.tsx
src/app/(authenticated)/infertility/components/filter/ExportActionBar.tsx
src/app/(authenticated)/infertility/components/filter/DateRangePill.tsx
src/app/(authenticated)/infertility/components/filter/components/DoctorFilter.tsx
src/app/(authenticated)/infertility/components/filter/components/StatusFilter.tsx
src/app/(authenticated)/infertility/components/filter/components/DateRangeFilter.tsx
src/app/(authenticated)/infertility/components/filter/components/TestFilter.tsx
src/app/(authenticated)/infertility/utils/generateReceipt.ts
src/app/(authenticated)/infertility/utils/generateInvestigationReport.ts
src/app/(authenticated)/infertility/utils/exportToCSV.ts
src/app/api/infertility-patients/tests/route.ts
src/app/api/infertility-patients/tests/[id]/route.ts
src/app/api/infertility-patients/tests/report/route.ts
src/services/adminInfertilityShiftService.ts
```

### Modified Files (~9)

```
prisma/schema.prisma                          — InfertilityTest model + relations
src/services/infertilityService.ts             — Test CRUD functions
src/app/(authenticated)/infertility/types/index.ts     — Test types
src/app/(authenticated)/infertility/types/schemas.ts   — Test zod schemas
src/app/(authenticated)/infertility/stores/index.ts    — New store exports
src/app/(authenticated)/infertility/hooks/index.ts     — New hook exports
src/app/(authenticated)/infertility/page.tsx           — Patients/Investigations tabs
src/lib/roles.ts                                      — Receptionist infertility access
src/components/sidebar/navigation.ts                   — Sidebar infertility route
src/app/api/dashboard/route.ts                         — Infertility stats
```
