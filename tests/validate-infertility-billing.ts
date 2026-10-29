import assert from "node:assert/strict";
import { calculateInfertilityBill, InfertilityBillingError } from "../src/lib/infertilityBilling";
const tests = ["HB%", "Prothombin Time"];
const bill = calculateInfertilityBill({ selectedTests: tests, discountType: "percentage", discountValue: 10, paidAmount: 100 });
assert.deepEqual(bill, { testCharge: 1200, discountType: "percentage", discountValue: 10, discountAmount: 120, grandTotal: 1080, paidAmount: 100, dueAmount: 980 });
for (const patch of [{ discountValue: 101 }, { discountValue: -1 }, { paidAmount: Infinity }, { paidAmount: 1201 }, { selectedTests: ["unknown"] }, { selectedTests: ["HB%", "HB%"] }]) {
  assert.throws(() => calculateInfertilityBill({ selectedTests: tests, discountType: "percentage", ...patch }), InfertilityBillingError);
}
assert.throws(() => calculateInfertilityBill({ selectedTests: tests, discountType: "value", discountValue: 1201 }), InfertilityBillingError);
const historical = { selectedTests: ["Retired test"], testCharge: 500, discountType: null, discountValue: null, discountAmount: 100, grandTotal: 400, paidAmount: 150 };
assert.equal(calculateInfertilityBill({ paidAmount: 200 }, historical).grandTotal, 400);
assert.equal(calculateInfertilityBill({ paidAmount: 200 }, historical).dueAmount, 200);
assert.equal(calculateInfertilityBill({ discountType: "value", discountValue: 50 }, historical).grandTotal, 450);
assert.equal(calculateInfertilityBill({ selectedTests: ["HB%"], paidAmount: 0 }, historical).testCharge, 200);
assert.equal(calculateInfertilityBill({}, { ...historical, paidAmount: 450 }).paidAmount, 450);
// Client-derived total properties cannot influence server calculations.
assert.equal(calculateInfertilityBill({ selectedTests: tests, testCharge: 1, grandTotal: 1 } as Parameters<typeof calculateInfertilityBill>[0]).grandTotal, 1200);
console.log("Infertility billing validation passed");
