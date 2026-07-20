export interface NormalizedFinancialTotals {
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

/** Keep grand total, paid amount, and due amount mathematically consistent. */
export function normalizeFinancialTotals(
  grandTotalInput: number | null | undefined,
  paidAmountInput: number | null | undefined,
): NormalizedFinancialTotals {
  const rawGrandTotal = Number(grandTotalInput);
  const rawPaidAmount = Number(paidAmountInput);
  const grandTotal = Number.isFinite(rawGrandTotal)
    ? Math.max(0, rawGrandTotal)
    : 0;
  const paidAmount = Number.isFinite(rawPaidAmount)
    ? Math.max(0, Math.min(rawPaidAmount, grandTotal))
    : 0;

  return {
    grandTotal,
    paidAmount,
    dueAmount: Math.max(0, grandTotal - paidAmount),
  };
}
