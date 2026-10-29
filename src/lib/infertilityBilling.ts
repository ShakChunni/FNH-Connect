import { PublicError } from "@/lib/publicError";
import catalogue from "../../public/tests.json";

export class InfertilityBillingError extends PublicError {}
interface BillingInput {
  selectedTests?: string[];
  discountType?: string | null;
  discountValue?: number | null;
  paidAmount?: number;
}
interface ExistingBill {
  selectedTests: string[];
  testCharge: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
}
const prices = new Map<string, number>();
// Match the UI's first catalogue entry for any duplicate name.
for (const test of catalogue) {
  if (!prices.has(test["Test Name (Investigation)"])) prices.set(test["Test Name (Investigation)"], test.Price);
}
const amount = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) throw new InfertilityBillingError(`Invalid ${label}`);
  return value;
};
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Ignore client-derived amounts. Preserve a historical bill until its tests or discount change. */
export function calculateInfertilityBill(input: BillingInput, existing?: ExistingBill) {
  const names = input.selectedTests ?? existing?.selectedTests ?? [];
  if (!names.length || names.length > 200 || new Set(names).size !== names.length || names.some((name) => !name || name.length > 200)) throw new InfertilityBillingError("Invalid selected tests");
  const sameTests = !!existing && names.length === existing.selectedTests.length && names.every((name) => existing.selectedTests.includes(name));
  const discountType = input.discountType === undefined ? existing?.discountType ?? null : input.discountType;
  const discountValue = input.discountValue === undefined ? existing?.discountValue ?? null : input.discountValue;
  const sameDiscount = !!existing && discountType === existing.discountType && (discountValue ?? 0) === (existing.discountValue ?? 0);
  let testCharge: number;
  if (sameTests) {
    testCharge = amount(existing!.testCharge, "test charge");
  } else {
    testCharge = names.reduce((total, name) => {
      const price = prices.get(name);
      if (price === undefined) throw new InfertilityBillingError(`Unknown investigation: ${name}`);
      return total + price;
    }, 0);
  }
  let discountAmount: number;
  let grandTotal: number;
  if (sameTests && sameDiscount) {
    discountAmount = amount(existing!.discountAmount, "discount amount");
    grandTotal = amount(existing!.grandTotal, "grand total");
  } else {
    const value = amount(discountValue ?? 0, "discount value");
    if (discountType !== null && discountType !== "percentage" && discountType !== "value") throw new InfertilityBillingError("Invalid discount type");
    if ((!discountType && value > 0) || (discountType === "percentage" && value > 100) || (discountType === "value" && value > testCharge)) throw new InfertilityBillingError("Discount exceeds the test charge");
    discountAmount = round(discountType === "percentage" ? testCharge * value / 100 : discountType === "value" ? value : 0);
    grandTotal = round(testCharge - discountAmount);
  }
  const paidAmount = amount(input.paidAmount ?? existing?.paidAmount ?? 0, "paid amount");
  // Existing overpayments must not be silently refunded by an unrelated metadata edit.
  if (paidAmount > grandTotal && !(sameTests && sameDiscount && paidAmount === existing?.paidAmount)) throw new InfertilityBillingError("Paid amount exceeds the grand total");
  return { testCharge, discountType, discountValue, discountAmount, grandTotal, paidAmount, dueAmount: round(Math.max(0, grandTotal - paidAmount)) };
}
