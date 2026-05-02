# Infertility Data Migration Plan

> **Date**: May 01, 2026  
> **Goal**: Move existing infertility patients' pathology investigations (PathologyTest) into the new infertility system (InfertilityTest), with full financial preservation.  
> **Data type**: Production / Live data — accuracy is critical.

---

## Context

Before the infertility overhaul, infertility patients had their investigations tracked under the **PathologyTest** model with `ServiceCharge` records typed `"PATHOLOGY_TEST"`. Now that infertility has its own `InfertilityTest` model and financial tracking (`serviceType: "INFERTILITY_TEST"`), these records need to be migrated.

### Decisions Made

| Decision | Choice |
|----------|--------|
| Old PathologyTest records | **Soft delete** — add `migratedToInfertility: true` flag. Hidden from pathology UI/calcs but preserved for audit. |
| Payment records | **Create new Payment + PaymentAllocation** records with the same date as originals. Old payments remain for pathology audit trail. |
| Test numbers | Generate new `INFT-YY-XXXXX` format (incremented counter). Original `PATH-YY-XXXXX` preserved in remarks. |
| Financial data | Fully preserved — all amounts, discounts, paid/due copied exactly. |

---

## Pre-Flight: Required Schema Change

Before migration, add the bidirectional FK between `ServiceCharge` and `InfertilityTest`:

```prisma
// prisma/schema.prisma

// 1. ServiceCharge model — add after pathologyTestId (line ~324)
model ServiceCharge {
  // ... existing fields ...
  pathologyTestId    Int?
  infertilityTestId  Int?                    // NEW
  // ... existing relations ...
  pathologyTest      PathologyTest?          @relation(fields: [pathologyTestId], references: [id])
  infertilityTest    InfertilityTest?        @relation(fields: [infertilityTestId], references: [id])  // NEW
}

// 2. InfertilityTest model — add after orderedBy relation (line ~583)
model InfertilityTest {
  // ... existing fields ...
  serviceCharges     ServiceCharge[]         // NEW — reverse relation
}
```

```bash
npx prisma migrate dev --name add-infertility-test-fk
npx prisma generate
```

---

## Schema: Soft-Delete Flag

Add to `PathologyTest`:

```prisma
model PathologyTest {
  // ... existing fields ...
  migratedToInfertility Boolean @default(false)  // NEW
}
```

```bash
npx prisma migrate dev --name add-pathology-migration-flag
npx prisma generate
```

---

## Migration Script: `scripts/migrate-pathology-to-infertility.ts`

### Algorithm (Pseudocode)

```
// ═══════════════════════════════════════════════════════
// STEP 1: Collect all infertility patients
// ═══════════════════════════════════════════════════════
const infertilityPatients = await prisma.infertilityPatient.findMany({
  include: { patient: true },
});

// ═══════════════════════════════════════════════════════
// STEP 2: For each patient, find their pathology tests
// ═══════════════════════════════════════════════════════
for (const infPatient of infertilityPatients) {
  const pathologyTests = await prisma.pathologyTest.findMany({
    where: {
      patientId: infPatient.patientId,
      migratedToInfertility: false,
    },
    include: {
      serviceCharges: {
        include: {
          paymentAllocations: {
            include: {
              payment: {
                include: { cashMovements: true },
              },
            },
          },
        },
      },
    },
  });

  if (pathologyTests.length === 0) {
    console.log(`  └─ [SKIP] Patient #${infPatient.patientId} has no pathology tests`);
    continue;
  }

  console.log(`\nPatient #${infPatient.patientId} (${infPatient.patient.fullName}) — ${pathologyTests.length} tests`);

  // ═══════════════════════════════════════════════════════
  // STEP 3: Process each pathology test in a transaction
  // ═══════════════════════════════════════════════════════
  for (const pt of pathologyTests) {
    await prisma.$transaction(async (tx) => {
      
      // 3a: Generate new test number
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const lastTest = await tx.infertilityTest.findFirst({
        where: { testNumber: { startsWith: `INFT-${currentYear}-` } },
        orderBy: { testNumber: 'desc' },
      });
      const nextSerial = lastTest
        ? parseInt(lastTest.testNumber.split('-')[2]) + 1
        : 1;
      const newTestNumber = `INFT-${currentYear}-${String(nextSerial).padStart(5, '0')}`;

      // 3b: Create InfertilityTest record
      const newTest = await tx.infertilityTest.create({
        data: {
          infertilityPatientId: infPatient.id,
          patientId: pt.patientId,
          testNumber: newTestNumber,
          admissionId: pt.admissionId,
          orderedById: pt.orderedById,
          doneById: pt.doneById,
          testDate: pt.testDate,          // PRESERVE original date
          reportDate: pt.reportDate,
          testCategory: pt.testCategory,
          testResults: pt.testResults,
          remarks: pt.remarks
            ? `${pt.remarks} [Migrated from Pathology #${pt.testNumber}]`
            : `[Migrated from Pathology #${pt.testNumber}]`,
          isCompleted: pt.isCompleted,
          testCharge: pt.testCharge,
          discountType: pt.discountType,
          discountValue: pt.discountValue,
          discountAmount: pt.discountAmount,
          grandTotal: pt.grandTotal,
          paidAmount: pt.paidAmount,
          dueAmount: pt.dueAmount,
          createdBy: pt.createdBy,
          lastModifiedBy: pt.lastModifiedBy,
          createdAt: pt.createdAt,        // PRESERVE original timestamp
          updatedAt: pt.updatedAt,
        },
      });

      // 3c: Ensure PatientAccount exists
      let account = await tx.patientAccount.findUnique({
        where: { patientId: infPatient.patientId },
      });
      if (!account) {
        account = await tx.patientAccount.create({
          data: {
            patientId: infPatient.patientId,
            totalCharges: 0,
            totalPaid: 0,
            totalDue: 0,
          },
        });
      }

      // 3d: Find the infertility department ID
      // (Assumes a "Infertility" department record exists in Department table)
      const infertilityDept = await tx.department.findFirst({
        where: { name: { contains: 'Infertility', mode: 'insensitive' } },
      });
      if (!infertilityDept) {
        throw new Error('No infertility department found — create one first');
      }

      // 3e: Create NEW ServiceCharge for infertility
      const testNames = pt.testResults
        ? (pt.testResults as any).tests || (pt.testResults as any).testNames || ['Test']
        : ['Test'];

      const newServiceCharge = await tx.serviceCharge.create({
        data: {
          patientAccountId: account.id,
          serviceType: 'INFERTILITY_TEST',
          infertilityTestId: newTest.id,
          serviceName: Array.isArray(testNames) ? testNames.join(', ') : testNames,
          departmentId: infertilityDept.id,
          originalAmount: pt.testCharge,
          discountAmount: pt.discountAmount || 0,
          finalAmount: pt.grandTotal,
          serviceDate: pt.testDate,       // PRESERVE original date
          description: `Migrated from Pathology Test #${pt.testNumber}`,
          createdBy: pt.createdBy,
        },
      });

      // 3f: Migrate payments and allocations
      for (const sc of pt.serviceCharges) {
        for (const allocation of sc.paymentAllocations) {
          const oldPayment = allocation.payment;

          // Find or reuse shift context
          const shift = oldPayment.shiftId
            ? await tx.shift.findUnique({ where: { id: oldPayment.shiftId } })
            : null;

          // Create NEW Payment record (same date as original)
          const newPayment = await tx.payment.create({
            data: {
              patientAccountId: account.id,
              amount: allocation.allocatedAmount,
              paymentMethod: oldPayment.paymentMethod || 'Cash',
              paymentDate: oldPayment.paymentDate,   // PRESERVE original date
              collectedById: oldPayment.collectedById,
              shiftId: oldPayment.shiftId,
              receiptNumber: `MIG-${oldPayment.receiptNumber || oldPayment.id}`,
              notes: `[Migrated from Pathology payment #${oldPayment.receiptNumber || oldPayment.id}]`,
              createdAt: oldPayment.createdAt,
            },
          });

          // Create NEW PaymentAllocation
          await tx.paymentAllocation.create({
            data: {
              paymentId: newPayment.id,
              serviceChargeId: newServiceCharge.id,
              allocatedAmount: allocation.allocatedAmount,
            },
          });

          // Create NEW CashMovement (if original had one)
          for (const cm of oldPayment.cashMovements) {
            await tx.cashMovement.create({
              data: {
                shiftId: cm.shiftId || oldPayment.shiftId,
                amount: cm.amount,
                movementType: 'PAYMENT_RECEIVED',
                description: `[Migrated] ${cm.description || ''} (Orig: Pathology)`,
                paymentId: newPayment.id,
                timestamp: cm.timestamp,    // PRESERVE original timestamp
              },
            });
          }
        }
      }

      // 3g: Soft-delete the original pathology test
      await tx.pathologyTest.update({
        where: { id: pt.id },
        data: {
          migratedToInfertility: true,
          isCompleted: true, // Prevent further edits
        },
      });

      console.log(`  ✓ PATH-${pt.testNumber} → ${newTestNumber} | BDT ${pt.grandTotal}`);
    });
  }
}

console.log('\n═══════════════════════════════════════════');
console.log('Migration complete.');
```

---

## Post-Migration: Update Pathology Queries

These queries must exclude migrated records:

| File | Change |
|------|--------|
| `src/services/pathologyService.ts` — `getPathologyTests()` | Add `migratedToInfertility: false` to where clause |
| `src/services/pathologyService.ts` — report query | Add `migratedToInfertility: false` |
| `src/app/api/dashboard/route.ts` — pathology stats | Add `migratedToInfertility: false` |
| Any pathology aggregation query | Add the flag filter |

---

## Post-Migration: Validation Queries

Run these after the migration to verify correctness:

```sql
-- ═══════════════════════════════════════════════
-- 1. Record count sanity check
-- ═══════════════════════════════════════════════
SELECT
  'Migrated Pathology' as source,
  COUNT(*) as test_count
FROM "PathologyTest"
WHERE migrated_to_infertility = true

UNION ALL

SELECT
  'New Infertility' as source,
  COUNT(*) as test_count
FROM "InfertilityTest";

-- These should be EQUAL.

-- ═══════════════════════════════════════════════
-- 2. Financial totals sanity check
-- ═══════════════════════════════════════════════
SELECT
  'Migrated (Pathology)' as source,
  SUM("grandTotal") as total_grand,
  SUM("paidAmount") as total_paid,
  SUM("dueAmount") as total_due
FROM "PathologyTest"
WHERE migrated_to_infertility = true

UNION ALL

SELECT
  'New (Infertility)' as source,
  SUM("grandTotal") as total_grand,
  SUM("paidAmount") as total_paid,
  SUM("dueAmount") as total_due
FROM "InfertilityTest";

-- Grand total, paid, and due should MATCH exactly.

-- ═══════════════════════════════════════════════
-- 3. No orphaned records
-- ═══════════════════════════════════════════════
SELECT COUNT(*) as orphan_tests
FROM "InfertilityTest" it
WHERE NOT EXISTS (
  SELECT 1 FROM "ServiceCharge" sc
  WHERE sc."infertilityTestId" = it.id
);

-- Should be 0.

-- ═══════════════════════════════════════════════
-- 4. Verify soft-delete flag
-- ═══════════════════════════════════════════════
SELECT
  'Not migrated' as group,
  COUNT(*) as count
FROM "PathologyTest"
WHERE migrated_to_infertility = false

UNION ALL

SELECT
  'Migrated' as group,
  COUNT(*) as count
FROM "PathologyTest"
WHERE migrated_to_infertility = true;
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Double counting money** — old + new payments both show in totals | Financial reports inflated | Old pathology payments are linked to soft-deleted tests; update queries to exclude `migratedToInfertility = true` from pathology calculations |
| **testNumber collision** | Constraint violation, migration fails | Query `MAX(serial)` for the current year prefix before each insert |
| **Missing infertility department** in Department table | Migration fails | Create "Infertility" department record if it doesn't exist before running migration |
| **Patient has no PatientAccount** | ServiceCharge creation fails | Script auto-creates PatientAccount if missing (Step 3c) |
| **Shift already closed** — creating new CashMovement for a closed shift | Shift totals temporarily off | The migration preserves original timestamps and doesn't update Shift totals. New records are informational copies — the original shift already counted this cash |
| **Receipt number collision** — new `MIG-` prefix receipt conflicts | Constraint violation | Prefix ensures uniqueness; if a `MIG-` record already exists, append a counter |
| **Script crashes mid-migration** | Partial migration, inconsistent state | Run inside `$transaction()` per test — if one test fails, it rolls back individually without affecting others. Re-run the script to process remaining tests |
| **Test with zero ServiceCharge records** (edge case) | No payments to migrate | Still create the InfertilityTest + ServiceCharge; skip payment loop |

---

## Rollback Plan (If Needed)

If migration needs to be undone:

```sql
-- 1. Delete migrated infertility tests
DELETE FROM "InfertilityTest"
WHERE remarks LIKE '%Migrated from Pathology%';

-- 2. Delete migrated ServiceCharges
DELETE FROM "ServiceCharge"
WHERE description LIKE '%Migrated from Pathology%';

-- 3. Delete migrated Payments (MIG- prefix receipts)
DELETE FROM "Payment"
WHERE notes LIKE '%Migrated from Pathology%';

-- 4. Un-flag pathology tests
UPDATE "PathologyTest"
SET migrated_to_infertility = false, is_completed = false
WHERE migrated_to_infertility = true;
```

Then re-run the migration script after fixing the issue.

---

## Execution Order

```
1. ☐  Run pre-flight schema migration (FK gap fix)
2. ☐  Run soft-delete flag migration
3. ☐  Verify "Infertility" department exists in Department table
4. ☐  BACKUP THE DATABASE
5. ☐  Run migration script in dry-run mode (log what would happen, no writes)
6. ☐  Run migration script for real
7. ☐  Run validation queries — verify counts and totals match
8. ☐  Update pathology service queries to exclude migrated records
9. ☐  Deploy with `npx prisma generate`
10. ☐ Verify pathology UI no longer shows infertile patients' tests
11. ☐ Verify infertility Investigations tab shows the migrated tests
12. ☐ Verify infertility financial reports include migrated amounts
```
