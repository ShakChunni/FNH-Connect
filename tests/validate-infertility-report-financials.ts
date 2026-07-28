import { strict as assert } from "node:assert";
import {
  aggregateInfertilityPatientFinancials,
  EMPTY_INFERTILITY_FINANCIAL_SUMMARY,
} from "../src/lib/infertilityReportFinancials";

const summaries = aggregateInfertilityPatientFinancials([
  {
    infertilityPatientId: 10,
    testCharge: "1000",
    discountAmount: "100",
    grandTotal: "900",
    paidAmount: "900",
  },
  {
    infertilityPatientId: 10,
    testCharge: "500",
    discountAmount: "50",
    grandTotal: "450",
    paidAmount: "100",
  },
  {
    infertilityPatientId: 11,
    testCharge: 500,
    discountAmount: null,
    grandTotal: 500,
    paidAmount: 700,
  },
]);

assert.deepEqual(summaries.get(10), {
  investigationCount: 2,
  grossAmount: 1500,
  discountAmount: 150,
  netAmount: 1350,
  paidAmount: 1000,
  dueAmount: 350,
});
assert.deepEqual(summaries.get(11), {
  investigationCount: 1,
  grossAmount: 500,
  discountAmount: 0,
  netAmount: 500,
  paidAmount: 700,
  dueAmount: 0,
});
assert.deepEqual(
  summaries.get(999) ?? { ...EMPTY_INFERTILITY_FINANCIAL_SUMMARY },
  EMPTY_INFERTILITY_FINANCIAL_SUMMARY,
);

console.log("Infertility report financial validation passed.");
