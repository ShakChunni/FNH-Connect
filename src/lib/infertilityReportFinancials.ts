import type { InfertilityFinancialSummary } from "@/app/(authenticated)/infertility/types";

type NumericValue = number | string | { toString(): string };

export interface InfertilityInvestigationFinancialRow {
  infertilityPatientId: number;
  testCharge: NumericValue;
  discountAmount: NumericValue | null;
  grandTotal: NumericValue;
  paidAmount: NumericValue;
}

export const EMPTY_INFERTILITY_FINANCIAL_SUMMARY: InfertilityFinancialSummary =
  {
    investigationCount: 0,
    grossAmount: 0,
    discountAmount: 0,
    netAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
  };

export function aggregateInfertilityPatientFinancials(
  investigations: InfertilityInvestigationFinancialRow[],
): Map<number, InfertilityFinancialSummary> {
  const summaries = new Map<number, InfertilityFinancialSummary>();

  for (const investigation of investigations) {
    const current = summaries.get(investigation.infertilityPatientId) ?? {
      ...EMPTY_INFERTILITY_FINANCIAL_SUMMARY,
    };
    const netAmount = Number(investigation.grandTotal);
    const paidAmount = Math.max(0, Number(investigation.paidAmount));

    current.investigationCount += 1;
    current.grossAmount += Number(investigation.testCharge);
    current.discountAmount += Number(investigation.discountAmount ?? 0);
    current.netAmount += netAmount;
    current.paidAmount += paidAmount;
    current.dueAmount += Math.max(0, netAmount - paidAmount);
    summaries.set(investigation.infertilityPatientId, current);
  }

  return summaries;
}
