import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envPath = path.resolve(process.cwd(), ".env");
  const envContents = fs.readFileSync(envPath, "utf8");
  const match = envContents.match(/^DATABASE_URL\s*=\s*"([^"]+)"/m);

  if (!match) {
    throw new Error("DATABASE_URL not found in .env");
  }

  return match[1];
}

function getFlagValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

interface MergePair {
  canonicalId: number;
  duplicateId: number;
  mode: "spouse" | "duplicate";
}

function parseMergePairs(value: string | null): MergePair[] {
  if (!value) {
    throw new Error(
      "Provide --pairs canonicalCaseId:duplicateCaseId:spouse,... or :duplicate so the merge remains explicitly scoped.",
    );
  }

  const pairs = value.split(",").map((rawPair) => {
    const [canonicalValue, duplicateValue] = rawPair.split(":");
    const modeValue = rawPair.split(":")[2];
    const mode: MergePair["mode"] | null =
      modeValue === "spouse"
        ? "spouse"
        : modeValue === "duplicate"
          ? "duplicate"
          : null;
    const canonicalId = Number.parseInt(canonicalValue ?? "", 10);
    const duplicateId = Number.parseInt(duplicateValue ?? "", 10);

    if (
      !Number.isInteger(canonicalId) ||
      canonicalId <= 0 ||
      !Number.isInteger(duplicateId) ||
      duplicateId <= 0 ||
      canonicalId === duplicateId ||
      mode === null
    ) {
      throw new Error(
        `Invalid merge pair: ${rawPair}. Use canonicalCaseId:duplicateCaseId:spouse or :duplicate.`,
      );
    }

    return { canonicalId, duplicateId, mode };
  });

  const seenDuplicateIds = new Set<number>();
  for (const pair of pairs) {
    if (seenDuplicateIds.has(pair.duplicateId)) {
      throw new Error(
        `A duplicate case may only be merged once: ${pair.duplicateId}`,
      );
    }
    seenDuplicateIds.add(pair.duplicateId);
  }

  return pairs;
}

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type CaseRecord = Prisma.InfertilityPatientGetPayload<{
  include: {
    patient: true;
  };
}>;

type TestRecord = Prisma.InfertilityTestGetPayload<{
  select: {
    id: true;
    testNumber: true;
    subjectType: true;
    subjectNameSnapshot: true;
    isMigrationSuperseded: true;
    sourcePathologyTestId: true;
  };
}>;

const caseInclude = {
  patient: true,
} satisfies Prisma.InfertilityPatientInclude;

async function getCase(
  db: DatabaseClient,
  id: number,
): Promise<CaseRecord | null> {
  return db.infertilityPatient.findUnique({
    where: { id },
    include: caseInclude,
  });
}

async function getTests(
  db: DatabaseClient,
  infertilityPatientId: number,
): Promise<TestRecord[]> {
  return db.infertilityTest.findMany({
    where: { infertilityPatientId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      testNumber: true,
      subjectType: true,
      subjectNameSnapshot: true,
      isMigrationSuperseded: true,
      sourcePathologyTestId: true,
    },
  });
}

async function getPathologyTests(
  db: DatabaseClient,
  patientId: number,
) {
  return db.pathologyTest.findMany({
    where: { patientId },
    orderBy: { id: "asc" },
  });
}

async function getAccountSnapshot(
  db: DatabaseClient,
  patientId: number,
) {
  return db.infertilityPatientAccount.findUnique({
    where: { patientId },
    include: {
      serviceCharges: {
        include: {
          paymentAllocations: true,
        },
      },
      payments: {
        include: {
          paymentAllocations: true,
          cashMovements: true,
        },
      },
    },
  });
}

function normalize(value: string | null | undefined): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(mr|mrs|ms|miss|md)\b/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

async function validatePair(
  db: DatabaseClient,
  pair: MergePair,
): Promise<{ canonical: CaseRecord; duplicate: CaseRecord; tests: TestRecord[] }> {
  const [canonical, duplicate] = await Promise.all([
    getCase(db, pair.canonicalId),
    getCase(db, pair.duplicateId),
  ]);

  if (!canonical) {
    throw new Error(`Canonical infertility case ${pair.canonicalId} was not found.`);
  }

  if (!duplicate) {
    throw new Error(`Duplicate infertility case ${pair.duplicateId} was not found.`);
  }

  if (canonical.mergedIntoId !== null) {
    throw new Error(
      `Canonical case ${canonical.caseNumber} is already merged into case ${canonical.mergedIntoId}.`,
    );
  }

  if (duplicate.mergedIntoId !== null) {
    throw new Error(
      `Duplicate case ${duplicate.caseNumber} is already merged into case ${duplicate.mergedIntoId}.`,
    );
  }

  if (canonical.hospitalId !== duplicate.hospitalId) {
    throw new Error(
      `Cases ${canonical.caseNumber} and ${duplicate.caseNumber} belong to different hospitals.`,
    );
  }

  if (canonical.patientId === duplicate.patientId) {
    throw new Error(
      `Cases ${canonical.caseNumber} and ${duplicate.caseNumber} already point to the same central patient.`,
    );
  }

  const tests = await getTests(db, duplicate.id);

  return { canonical, duplicate, tests };
}

function buildSpouseUpdate(
  canonical: CaseRecord,
  duplicate: CaseRecord,
): Prisma.PatientUncheckedUpdateInput {
  const spouse = duplicate.patient;
  const update: Prisma.PatientUncheckedUpdateInput = {};
  const spouseName = nonEmpty(spouse.fullName);
  const spousePhone = nonEmpty(spouse.phoneNumber);
  const spouseEmail = nonEmpty(spouse.email);
  const spouseAddress = nonEmpty(spouse.address);
  const spouseOccupation = nonEmpty(spouse.occupation);

  if (spouseName && normalize(canonical.patient.guardianName) !== normalize(spouseName)) {
    update.guardianName = spouseName;
  }

  if (spouse.dateOfBirth && !canonical.patient.guardianDOB) {
    update.guardianDOB = spouse.dateOfBirth;
  }

  if (normalize(spouse.gender) === "male" && normalize(canonical.patient.guardianGender) !== "male") {
    update.guardianGender = spouse.gender;
  }

  if (spousePhone && normalize(canonical.patient.guardianPhone) !== normalize(spousePhone)) {
    update.guardianPhone = spousePhone;
  }

  if (spouseEmail && normalize(canonical.patient.guardianEmail) !== normalize(spouseEmail)) {
    update.guardianEmail = spouseEmail;
  }

  if (spouseAddress && normalize(canonical.patient.guardianAddress) !== normalize(spouseAddress)) {
    update.guardianAddress = spouseAddress;
  }

  if (
    spouseOccupation &&
    normalize(canonical.patient.guardianOccupation) !== normalize(spouseOccupation)
  ) {
    update.guardianOccupation = spouseOccupation;
  }

  return update;
}

function buildDuplicatePatientUpdate(
  canonical: CaseRecord,
  duplicate: CaseRecord,
): Prisma.PatientUncheckedUpdateInput {
  const source = duplicate.patient;
  const current = canonical.patient;
  const update: Prisma.PatientUncheckedUpdateInput = {};

  if (!nonEmpty(current.email) && nonEmpty(source.email)) {
    update.email = source.email;
  }
  if (!nonEmpty(current.occupation) && nonEmpty(source.occupation)) {
    update.occupation = source.occupation;
  }
  if (!nonEmpty(current.bloodGroup) && nonEmpty(source.bloodGroup)) {
    update.bloodGroup = source.bloodGroup;
  }
  if (!nonEmpty(current.address) && nonEmpty(source.address)) {
    update.address = source.address;
  }
  if (!nonEmpty(current.guardianName) && nonEmpty(source.guardianName)) {
    update.guardianName = source.guardianName;
  }
  if (!current.guardianDOB && source.guardianDOB) {
    update.guardianDOB = source.guardianDOB;
  }
  if (!nonEmpty(current.guardianGender) && nonEmpty(source.guardianGender)) {
    update.guardianGender = source.guardianGender;
  }
  if (!nonEmpty(current.guardianOccupation) && nonEmpty(source.guardianOccupation)) {
    update.guardianOccupation = source.guardianOccupation;
  }
  if (!nonEmpty(current.guardianPhone) && nonEmpty(source.guardianPhone)) {
    update.guardianPhone = source.guardianPhone;
  }
  if (!nonEmpty(current.guardianEmail) && nonEmpty(source.guardianEmail)) {
    update.guardianEmail = source.guardianEmail;
  }
  if (!nonEmpty(current.guardianAddress) && nonEmpty(source.guardianAddress)) {
    update.guardianAddress = source.guardianAddress;
  }

  return update;
}

async function getAccountForPatient(
  db: DatabaseClient,
  patientId: number,
) {
  return db.infertilityPatientAccount.findUnique({
    where: { patientId },
    select: {
      id: true,
      patientId: true,
      totalCharges: true,
      totalPaid: true,
      totalDue: true,
      advanceBalance: true,
    },
  });
}

async function getAccountCounts(db: DatabaseClient, accountId: number) {
  const [serviceChargeCount, paymentCount] = await Promise.all([
    db.infertilityServiceCharge.count({ where: { patientAccountId: accountId } }),
    db.infertilityPayment.count({ where: { patientAccountId: accountId } }),
  ]);

  return { serviceChargeCount, paymentCount };
}

async function assertPaymentsAreNotShared(
  tx: Prisma.TransactionClient,
  sourceAccountId: number,
): Promise<void> {
  const sourceCharges = await tx.infertilityServiceCharge.findMany({
    where: { patientAccountId: sourceAccountId },
    select: { id: true },
  });
  const sourceChargeIds = new Set(sourceCharges.map((charge) => charge.id));

  const sourcePayments = await tx.infertilityPayment.findMany({
    where: { patientAccountId: sourceAccountId },
    select: {
      id: true,
      receiptNumber: true,
      paymentAllocations: {
        select: { serviceChargeId: true },
      },
    },
  });

  for (const payment of sourcePayments) {
    const sharedAllocation = payment.paymentAllocations.find(
      (allocation) => !sourceChargeIds.has(allocation.serviceChargeId),
    );

    if (sharedAllocation) {
      throw new Error(
        `Payment ${payment.receiptNumber} is allocated outside source account ${sourceAccountId}; refusing to merge it automatically.`,
      );
    }
  }
}

async function recalculateAccount(
  tx: Prisma.TransactionClient,
  accountId: number,
): Promise<void> {
  const [chargeAggregate, allocationAggregate] = await Promise.all([
    tx.infertilityServiceCharge.aggregate({
      where: {
        patientAccountId: accountId,
        isMigrationSuperseded: false,
      },
      _sum: { finalAmount: true },
    }),
    tx.infertilityPaymentAllocation.aggregate({
      where: {
        isMigrationSuperseded: false,
        serviceCharge: {
          patientAccountId: accountId,
          isMigrationSuperseded: false,
        },
      },
      _sum: { allocatedAmount: true },
    }),
  ]);

  const totalCharges = chargeAggregate._sum.finalAmount ?? new Prisma.Decimal(0);
  const totalPaid =
    allocationAggregate._sum.allocatedAmount ?? new Prisma.Decimal(0);
  const totalDue = Math.max(0, totalCharges.toNumber() - totalPaid.toNumber());

  await tx.infertilityPatientAccount.update({
    where: { id: accountId },
    data: {
      totalCharges,
      totalPaid,
      totalDue,
    },
  });
}

async function transferAccount(
  tx: Prisma.TransactionClient,
  canonicalPatientId: number,
  duplicatePatientId: number,
): Promise<{
  canonicalAccountId: number | null;
  duplicateAccountId: number | null;
  serviceChargeCount: number;
  paymentCount: number;
}> {
  const [canonicalAccount, duplicateAccount] = await Promise.all([
    getAccountForPatient(tx, canonicalPatientId),
    getAccountForPatient(tx, duplicatePatientId),
  ]);

  if (!duplicateAccount) {
    return {
      canonicalAccountId: canonicalAccount?.id ?? null,
      duplicateAccountId: null,
      serviceChargeCount: 0,
      paymentCount: 0,
    };
  }

  await assertPaymentsAreNotShared(tx, duplicateAccount.id);

  const counts = await getAccountCounts(tx, duplicateAccount.id);
  const targetAccount =
    canonicalAccount ??
    (await tx.infertilityPatientAccount.create({
      data: {
        patientId: canonicalPatientId,
        advanceBalance: duplicateAccount.advanceBalance,
      },
      select: {
        id: true,
        patientId: true,
        totalCharges: true,
        totalPaid: true,
        totalDue: true,
        advanceBalance: true,
      },
    }));

  if (canonicalAccount) {
    await tx.infertilityPatientAccount.update({
      where: { id: canonicalAccount.id },
      data: {
        advanceBalance: { increment: duplicateAccount.advanceBalance },
      },
    });
  }

  await tx.infertilityServiceCharge.updateMany({
    where: { patientAccountId: duplicateAccount.id },
    data: { patientAccountId: targetAccount.id },
  });

  await tx.infertilityPayment.updateMany({
    where: { patientAccountId: duplicateAccount.id },
    data: { patientAccountId: targetAccount.id },
  });

  await tx.infertilityPatientAccount.update({
    where: { id: duplicateAccount.id },
    data: {
      totalCharges: 0,
      totalPaid: 0,
      totalDue: 0,
      advanceBalance: 0,
    },
  });

  await recalculateAccount(tx, targetAccount.id);

  return {
    canonicalAccountId: targetAccount.id,
    duplicateAccountId: duplicateAccount.id,
    serviceChargeCount: counts.serviceChargeCount,
    paymentCount: counts.paymentCount,
  };
}

async function mergePair(
  tx: Prisma.TransactionClient,
  pair: MergePair,
): Promise<Record<string, unknown>> {
  const { canonical, duplicate, tests } = await validatePair(tx, pair);
  const [fullSourceTests, sourcePathologyTests, sourceAccountSnapshot] =
    await Promise.all([
      tx.infertilityTest.findMany({
        where: { infertilityPatientId: duplicate.id },
      }),
      getPathologyTests(tx, duplicate.patientId),
      getAccountSnapshot(tx, duplicate.patientId),
    ]);
  const patientUpdate =
    pair.mode === "spouse"
      ? buildSpouseUpdate(canonical, duplicate)
      : buildDuplicatePatientUpdate(canonical, duplicate);

  if (Object.keys(patientUpdate).length > 0) {
    await tx.patient.update({
      where: { id: canonical.patientId },
      data: patientUpdate,
    });
  }

  const accountTransfer = await transferAccount(
    tx,
    canonical.patientId,
    duplicate.patientId,
  );

  if (tests.length > 0) {
    await tx.infertilityTest.updateMany({
      where: { infertilityPatientId: duplicate.id },
      data: {
        infertilityPatientId: canonical.id,
        ...(pair.mode === "spouse"
          ? {
              subjectType: "SPOUSE" as const,
              subjectNameSnapshot: duplicate.patient.fullName,
            }
          : {}),
      },
    });
  }

  const mergedAt = new Date();
  const reason = `Merged ${pair.mode} case ${duplicate.caseNumber} (${duplicate.patient.fullName}) into ${canonical.caseNumber}; moved ${tests.length} test(s), ${accountTransfer.serviceChargeCount} service charge(s), and ${accountTransfer.paymentCount} payment(s).`;

  await tx.infertilityCaseMergeArchive.create({
    data: {
      sourceCaseId: duplicate.id,
      sourceCaseNumber: duplicate.caseNumber,
      canonicalCaseId: canonical.id,
      canonicalCaseNumber: canonical.caseNumber,
      sourcePatientId: duplicate.patientId,
      sourceCaseSnapshot: JSON.stringify(duplicate),
      sourcePatientSnapshot: JSON.stringify(duplicate.patient),
      sourceTestsSnapshot: JSON.stringify(fullSourceTests),
      sourcePathologyTestsSnapshot: JSON.stringify(sourcePathologyTests),
      sourceAccountSnapshot: sourceAccountSnapshot
        ? JSON.stringify(sourceAccountSnapshot)
        : null,
      mergedAt,
      reason,
    },
  });

  await tx.infertilityPatient.delete({
    where: { id: duplicate.id },
  });

  return {
    canonicalCaseId: canonical.id,
    canonicalCaseNumber: canonical.caseNumber,
    canonicalPatient: canonical.patient.fullName,
    duplicateCaseId: duplicate.id,
    duplicateCaseNumber: duplicate.caseNumber,
    duplicatePatient: duplicate.patient.fullName,
    mergeMode: pair.mode,
    testNumbers: tests.map((test) => test.testNumber),
    testsMoved: tests.length,
    serviceChargesMoved: accountTransfer.serviceChargeCount,
    paymentsMoved: accountTransfer.paymentCount,
    canonicalAccountId: accountTransfer.canonicalAccountId,
    duplicateAccountId: accountTransfer.duplicateAccountId,
    patientFieldsUpdated: Object.keys(patientUpdate),
    sourcePathologyTestsRetained: sourcePathologyTests.length,
    sourceCaseRowDeleted: true,
  };
}

async function inspectPair(
  db: DatabaseClient,
  pair: MergePair,
): Promise<Record<string, unknown>> {
  const { canonical, duplicate, tests } = await validatePair(db, pair);
  const [canonicalAccount, duplicateAccount, sourcePathologyTests] = await Promise.all([
    getAccountForPatient(db, canonical.patientId),
    getAccountForPatient(db, duplicate.patientId),
    getPathologyTests(db, duplicate.patientId),
  ]);
  const [canonicalCounts, duplicateCounts] = await Promise.all([
    canonicalAccount
      ? getAccountCounts(db, canonicalAccount.id)
      : Promise.resolve({ serviceChargeCount: 0, paymentCount: 0 }),
    duplicateAccount
      ? getAccountCounts(db, duplicateAccount.id)
      : Promise.resolve({ serviceChargeCount: 0, paymentCount: 0 }),
  ]);

  return {
    canonicalCaseId: canonical.id,
    canonicalCaseNumber: canonical.caseNumber,
    canonicalPatient: canonical.patient.fullName,
    duplicateCaseId: duplicate.id,
    duplicateCaseNumber: duplicate.caseNumber,
    duplicatePatient: duplicate.patient.fullName,
    mergeMode: pair.mode,
    sameHospital: canonical.hospitalId === duplicate.hospitalId,
    canonicalGuardianName: canonical.patient.guardianName,
    duplicatePatientGender: duplicate.patient.gender,
    duplicatePatientPhone: duplicate.patient.phoneNumber,
    testNumbersToMove: tests.map((test) => test.testNumber),
    testsToMove: tests.length,
    sourcePathologyTestsToRetain: sourcePathologyTests.length,
    canonicalAccount: canonicalAccount
      ? { id: canonicalAccount.id, ...canonicalCounts }
      : null,
    duplicateAccount: duplicateAccount
      ? { id: duplicateAccount.id, ...duplicateCounts }
      : null,
  };
}

async function main(): Promise<void> {
  process.env.DATABASE_URL = loadDatabaseUrl();

  const pairs = parseMergePairs(getFlagValue("--pairs"));
  const apply = process.argv.includes("--apply");
  const prisma = new PrismaClient();

  try {
    if (!apply) {
      const report = [];
      for (const pair of pairs) {
        report.push(await inspectPair(prisma, pair));
      }
      console.log(JSON.stringify({ mode: "dry-run", pairs: report }, null, 2));
      return;
    }

    const results = await prisma.$transaction(
      async (tx) => {
        const mergedResults = [];
        for (const pair of pairs) {
          mergedResults.push(await mergePair(tx, pair));
        }
        return mergedResults;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 20_000,
        timeout: 120_000,
      },
    );

    console.log(JSON.stringify({ mode: "applied", pairs: results }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Infertility case merge failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
