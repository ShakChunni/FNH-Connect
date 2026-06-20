/**
 * Patient Address Audit & Remediation
 *
 * Classifies every `Patient.address` row and (with `--apply`) safely
 * rewrites the small subset that ends in a recognized legacy district
 * alias (e.g. `Barisal` → `Barishal`, `Chittagong` → `Chattogram`).
 *
 * The audit only touches the `Patient.address` column. It never writes
 * to `Patient.guardianAddress`; the active Infertility create/edit
 * flow keeps mirroring `patient.address` into `guardianAddress` on
 * subsequent writes.
 *
 * Usage:
 *   Dry run (default): npm run db:audit-patient-addresses
 *   Apply changes:     npx tsx scripts/standardize-patient-addresses.ts --apply
 *
 * No Prisma migrations are required and the schema is unchanged.
 */

import { PrismaClient } from "@prisma/client";
import {
  parseBangladeshAddress,
  formatBangladeshAddress,
  type BangladeshDistrict,
} from "../src/lib/bangladeshAddress";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

type Classification =
  | "empty"
  | "canonical"
  | "alias"
  | "unresolved"
  | "ambiguous";

interface PlannedUpdate {
  id: number;
  fullName: string;
  before: string;
  after: string;
  district: BangladeshDistrict;
}

interface UnresolvedRow {
  id: number;
  fullName: string;
  address: string;
  reason: string;
}

function classify(address: string | null): {
  classification: Classification;
  parsedDistrict: BangladeshDistrict | "";
} {
  if (address === null || address === undefined || address.trim() === "") {
    return { classification: "empty", parsedDistrict: "" };
  }

  const parsed = parseBangladeshAddress(address);

  if (parsed.district === "") {
    return { classification: "unresolved", parsedDistrict: "" };
  }

  if (parsed.isLegacy) {
    return {
      classification: "alias",
      parsedDistrict: parsed.district,
    };
  }

  return {
    classification: "canonical",
    parsedDistrict: parsed.district,
  };
}

function countDistrictShapedSegments(address: string): number {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return segments.reduce((count, segment) => {
    const parsedSegment = parseBangladeshAddress(segment);
    const isDistrictOnly =
      parsedSegment.district !== "" && parsedSegment.addressDetails === "";
    return count + (isDistrictOnly ? 1 : 0);
  }, 0);
}

async function run(): Promise<void> {
  console.log(
    APPLY
      ? "APPLY MODE — alias rows will be rewritten to canonical districts."
      : "DRY RUN — no changes will be written. Re-run with --apply to commit alias rewrites.",
  );

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      fullName: true,
      address: true,
    },
  });

  const counts: Record<Classification, number> = {
    empty: 0,
    canonical: 0,
    alias: 0,
    unresolved: 0,
    ambiguous: 0,
  };

  const plannedUpdates: PlannedUpdate[] = [];
  const unresolvedRows: UnresolvedRow[] = [];

  for (const patient of patients) {
    if (
      patient.address &&
      countDistrictShapedSegments(patient.address) > 1
    ) {
      counts.ambiguous += 1;
      unresolvedRows.push({
        id: patient.id,
        fullName: patient.fullName,
        address: patient.address,
        reason: "Multiple district-shaped segments; needs manual review.",
      });
      continue;
    }

    const { classification, parsedDistrict } = classify(patient.address);
    counts[classification] += 1;

    if (classification === "alias" && parsedDistrict !== "") {
      const safeAfter = formatBangladeshAddress(
        parseBangladeshAddress(patient.address).addressDetails,
        parsedDistrict,
      );

      if (safeAfter !== (patient.address ?? "")) {
        plannedUpdates.push({
          id: patient.id,
          fullName: patient.fullName,
          before: patient.address ?? "",
          after: safeAfter,
          district: parsedDistrict,
        });
      }
    } else if (classification === "unresolved") {
      unresolvedRows.push({
        id: patient.id,
        fullName: patient.fullName,
        address: patient.address ?? "",
        reason: "Final segment is not a recognized Bangladesh district.",
      });
    }
  }

  console.log("\n--- Classification counts ---");
  for (const [key, value] of Object.entries(counts)) {
    console.log(`${key.padEnd(12)}: ${value}`);
  }

  console.log(`\n--- Planned safe alias rewrites: ${plannedUpdates.length} ---`);
  for (const update of plannedUpdates) {
    console.log(
      `  [${update.id}] ${update.fullName}: "${update.before}" -> "${update.after}"`,
    );
  }

  console.log(`\n--- Unresolved rows (${unresolvedRows.length}) ---`);
  for (const row of unresolvedRows.slice(0, 20)) {
    console.log(`  [${row.id}] ${row.fullName} | ${row.address} | ${row.reason}`);
  }
  if (unresolvedRows.length > 20) {
    console.log(`  ... and ${unresolvedRows.length - 20} more`);
  }

  if (!APPLY) {
    console.log("\nDRY RUN complete. No database changes were made.");
    if (plannedUpdates.length > 0) {
      console.log(
        `Run with --apply to rewrite ${plannedUpdates.length} alias row(s).`,
      );
    }
    return;
  }

  if (plannedUpdates.length === 0) {
    console.log("\nNo alias rows to update. Nothing to apply.");
    return;
  }

  let updated = 0;
  await prisma.$transaction(async (tx) => {
    for (const update of plannedUpdates) {
      await tx.patient.update({
        where: { id: update.id },
        data: { address: update.after },
      });
      updated += 1;
    }
  });

  console.log(
    `\nAPPLY complete. Updated ${updated} row(s). Skipped ${unresolvedRows.length} row(s) that need manual review.`,
  );
}

run()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Audit script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
