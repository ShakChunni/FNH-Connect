import { mkdir, writeFile } from "node:fs/promises";
import type { InfertilityPatientData } from "../src/app/(authenticated)/infertility/types";

const generatedBlobs: Blob[] = [];

class MissingImage {
  onload: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onerror?.(new Error("Image omitted in PDF QA")));
  }
}

Object.assign(globalThis, {
  Image: MissingImage,
  window: {
    atob: globalThis.atob,
    btoa: globalThis.btoa,
    open: () => null,
    setTimeout: () => 0,
  },
});
Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: (blob: Blob) => {
    generatedBlobs.push(blob);
    return `blob:qa-${generatedBlobs.length}`;
  },
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: () => undefined,
});

async function main(): Promise<void> {
  const { generateInfertilitySummaryReport } = await import(
    "../src/app/(authenticated)/infertility/utils/generateSummaryReport"
  );

  const patients = Array.from({ length: 18 }, (_, index) => {
  const grossAmount = 1200 + index * 175;
  const discountAmount = index % 3 === 0 ? 150 : 50;
  const netAmount = grossAmount - discountAmount;
  const paidAmount = index % 4 === 0 ? netAmount : Math.round(netAmount * 0.65);

  return {
    id: index + 1,
    caseNumber: `INF-26-${String(index + 1).padStart(5, "0")}`,
    patientId: index + 100,
    hospitalId: 1,
    hospitalName: "Feroza Nursing Home",
    hospitalAddress: null,
    hospitalPhone: null,
    hospitalEmail: null,
    hospitalWebsite: null,
    hospitalType: null,
    patientFirstName: `Patient ${index + 1}`,
    patientLastName: null,
    patientFullName: `Patient Example ${index + 1}`,
    patientGender: "Female",
    patientAge: 24 + (index % 12),
    patientDOB: null,
    husbandName: `Spouse Example ${index + 1}`,
    husbandAge: 29 + (index % 12),
    husbandDOB: null,
    husbandPhone: null,
    husbandEmail: null,
    husbandAddress: null,
    spouseGender: "Male",
    mobileNumber: `0171000${String(index).padStart(4, "0")}`,
    email: null,
    address: null,
    bloodGroup: null,
    patientOccupation: null,
    husbandOccupation: null,
    yearsMarried: 3,
    yearsTrying: 2 + (index % 4),
    para: null,
    gravida: null,
    weight: null,
    height: null,
    bmi: null,
    bloodPressure: null,
    infertilityType: index % 2 === 0 ? "Primary" : "Secondary",
    medicalHistory: null,
    surgicalHistory: null,
    menstrualHistory: null,
    contraceptiveHistory: null,
    referralSource: null,
    chiefComplaint: null,
    treatmentPlan: null,
    medications: null,
    nextAppointment: null,
    status: index % 5 === 0 ? "Completed" : "Active",
    notes: null,
    testCount: 1 + (index % 4),
    financialSummary: {
      investigationCount: 1 + (index % 4),
      grossAmount,
      discountAmount,
      netAmount,
      paidAmount,
      dueAmount: Math.max(0, netAmount - paidAmount),
    },
    createdAt: new Date(2026, 6, 1 + (index % 20)).toISOString(),
    updatedAt: new Date(2026, 6, 20).toISOString(),
  } as InfertilityPatientData;
  });

  await generateInfertilitySummaryReport(patients, "PDF QA", false, {
    startDate: new Date(2026, 6, 1),
    endDate: new Date(2026, 6, 20),
  });
  await generateInfertilitySummaryReport(patients, "PDF QA", true, {
    startDate: new Date(2026, 6, 1),
    endDate: new Date(2026, 6, 20),
  });

  await mkdir("tmp/pdfs", { recursive: true });
  await Promise.all(
    generatedBlobs.map(async (blob, index) => {
      const name =
        index === 0
          ? "infertility-patient-financial-summary.pdf"
          : "infertility-patient-financial-detailed.pdf";
      await writeFile(`tmp/pdfs/${name}`, Buffer.from(await blob.arrayBuffer()));
    }),
  );

  console.log(`Rendered ${generatedBlobs.length} infertility patient PDF files.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
