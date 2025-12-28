/**
 * Migration Script: Update Registration Numbers to New Format
 *
 * This script migrates existing registration numbers from the old format:
 * - Admission: ADM-YYYYMMDD-XXXX → DEPT-YY-XXXXX (e.g., GYNE-25-00001)
 * - Pathology: PATH-YYMMDD-XXXX → PATH-YY-XXXXX (e.g., PATH-25-00001)
 * - Infertility: INF-YYMMDD-XXXX → INF-YY-XXXXX (e.g., INF-25-00001)
 *
 * Run with: npx tsx scripts/migrate-registration-numbers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Department name to code mapping
const DEPARTMENT_CODES: Record<string, string> = {
  Gynecology: "GYNE",
  Surgery: "SURG",
  Medicine: "MED",
  Pediatrics: "PED",
  Cardiology: "CARD",
  ENT: "ENT",
  Orthopedics: "ORTH",
  Radiology: "RAD",
  Psychology: "PSY",
  Eye: "EYE",
  Pathology: "PATH",
  Anesthesia: "ANES",
  General: "GEN",
};

function getDepartmentCode(departmentName: string): string {
  return DEPARTMENT_CODES[departmentName] || "GEN";
}

function formatRegistrationNumber(
  departmentCode: string,
  year: string,
  sequence: number
): string {
  return `${departmentCode}-${year}-${String(sequence).padStart(5, "0")}`;
}

function getYearFromDate(date: Date): string {
  return date.getFullYear().toString().slice(-2);
}

interface MigrationReport {
  admissions: { old: string; new: string; department: string }[];
  pathology: { old: string; new: string }[];
  infertility: { old: string; new: string }[];
  errors: string[];
}

async function migrateRegistrationNumbers() {
  console.log("🔄 Starting Registration Number Migration...\n");
  console.log("═".repeat(60) + "\n");

  const report: MigrationReport = {
    admissions: [],
    pathology: [],
    infertility: [],
    errors: [],
  };

  // ════════════════════════════════════════════════════════════════
  // 1. MIGRATE ADMISSIONS
  // ════════════════════════════════════════════════════════════════
  console.log("📋 Migrating Admission Numbers...\n");

  try {
    // Get all admissions grouped by department and year
    const admissions = await prisma.admission.findMany({
      include: {
        department: true,
      },
      orderBy: {
        dateAdmitted: "asc",
      },
    });

    // Group by department and year
    const admissionGroups = new Map<
      string,
      { id: number; oldNumber: string; date: Date; deptName: string }[]
    >();

    for (const admission of admissions) {
      const year = getYearFromDate(new Date(admission.dateAdmitted));
      const deptCode = getDepartmentCode(admission.department.name);
      const key = `${deptCode}-${year}`;

      if (!admissionGroups.has(key)) {
        admissionGroups.set(key, []);
      }
      admissionGroups.get(key)!.push({
        id: admission.id,
        oldNumber: admission.admissionNumber,
        date: admission.dateAdmitted,
        deptName: admission.department.name,
      });
    }

    // Assign new sequential numbers
    for (const [key, records] of admissionGroups) {
      const [deptCode, year] = key.split("-");

      // Sort by date to maintain chronological order
      records.sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 0; i < records.length; i++) {
        const newNumber = formatRegistrationNumber(deptCode, year, i + 1);

        await prisma.admission.update({
          where: { id: records[i].id },
          data: { admissionNumber: newNumber },
        });

        report.admissions.push({
          old: records[i].oldNumber,
          new: newNumber,
          department: records[i].deptName,
        });

        console.log(
          `  ✅ ${records[i].oldNumber} → ${newNumber} (${records[i].deptName})`
        );
      }
    }

    console.log(
      `\n✨ Migrated ${report.admissions.length} admission records\n`
    );
  } catch (error) {
    const errorMsg = `Admission migration error: ${
      error instanceof Error ? error.message : "Unknown"
    }`;
    report.errors.push(errorMsg);
    console.error(`  ❌ ${errorMsg}`);
  }

  // ════════════════════════════════════════════════════════════════
  // 2. MIGRATE PATHOLOGY TESTS
  // ════════════════════════════════════════════════════════════════
  console.log("═".repeat(60));
  console.log("\n🧪 Migrating Pathology Test Numbers...\n");

  try {
    // Get all pathology tests
    const pathologyTests = await prisma.pathologyTest.findMany({
      orderBy: {
        testDate: "asc",
      },
    });

    // Group by year
    const pathologyGroups = new Map<
      string,
      { id: number; oldNumber: string; date: Date }[]
    >();

    for (const test of pathologyTests) {
      const year = getYearFromDate(new Date(test.testDate));

      if (!pathologyGroups.has(year)) {
        pathologyGroups.set(year, []);
      }
      pathologyGroups.get(year)!.push({
        id: test.id,
        oldNumber: test.testNumber,
        date: test.testDate,
      });
    }

    // Assign new sequential numbers
    for (const [year, records] of pathologyGroups) {
      // Sort by date
      records.sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 0; i < records.length; i++) {
        const newNumber = formatRegistrationNumber("PATH", year, i + 1);

        await prisma.pathologyTest.update({
          where: { id: records[i].id },
          data: { testNumber: newNumber },
        });

        report.pathology.push({
          old: records[i].oldNumber,
          new: newNumber,
        });

        console.log(`  ✅ ${records[i].oldNumber} → ${newNumber}`);
      }
    }

    console.log(`\n✨ Migrated ${report.pathology.length} pathology records\n`);
  } catch (error) {
    const errorMsg = `Pathology migration error: ${
      error instanceof Error ? error.message : "Unknown"
    }`;
    report.errors.push(errorMsg);
    console.error(`  ❌ ${errorMsg}`);
  }

  // ════════════════════════════════════════════════════════════════
  // 3. MIGRATE INFERTILITY CASES
  // ════════════════════════════════════════════════════════════════
  console.log("═".repeat(60));
  console.log("\n🍼 Migrating Infertility Case Numbers...\n");

  try {
    // Get all infertility cases
    const infertilityCases = await prisma.infertilityPatient.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by year
    const infertilityGroups = new Map<
      string,
      { id: number; oldNumber: string; date: Date }[]
    >();

    for (const record of infertilityCases) {
      const year = getYearFromDate(new Date(record.createdAt));

      if (!infertilityGroups.has(year)) {
        infertilityGroups.set(year, []);
      }
      infertilityGroups.get(year)!.push({
        id: record.id,
        oldNumber: record.caseNumber,
        date: record.createdAt,
      });
    }

    // Assign new sequential numbers
    for (const [year, records] of infertilityGroups) {
      // Sort by date
      records.sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 0; i < records.length; i++) {
        const newNumber = formatRegistrationNumber("INF", year, i + 1);

        await prisma.infertilityPatient.update({
          where: { id: records[i].id },
          data: { caseNumber: newNumber },
        });

        report.infertility.push({
          old: records[i].oldNumber,
          new: newNumber,
        });

        console.log(`  ✅ ${records[i].oldNumber} → ${newNumber}`);
      }
    }

    console.log(
      `\n✨ Migrated ${report.infertility.length} infertility records\n`
    );
  } catch (error) {
    const errorMsg = `Infertility migration error: ${
      error instanceof Error ? error.message : "Unknown"
    }`;
    report.errors.push(errorMsg);
    console.error(`  ❌ ${errorMsg}`);
  }

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log("═".repeat(60));
  console.log("\n📊 MIGRATION SUMMARY:\n");

  console.log(`   📋 Admissions migrated:   ${report.admissions.length}`);
  console.log(`   🧪 Pathology migrated:    ${report.pathology.length}`);
  console.log(`   🍼 Infertility migrated:  ${report.infertility.length}`);

  if (report.errors.length > 0) {
    console.log(`\n   ❌ Errors: ${report.errors.length}`);
    for (const error of report.errors) {
      console.log(`      - ${error}`);
    }
  } else {
    console.log(`\n   ✅ No errors encountered!`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n🎉 Migration completed!\n");

  return report;
}

// Run the migration
migrateRegistrationNumbers()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
