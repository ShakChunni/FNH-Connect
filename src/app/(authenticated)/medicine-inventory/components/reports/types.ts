import type {
  MedicineInventoryReport,
  ReportMedicine,
  MedicinePurchase,
  MedicineSale,
} from "../../types";

export type { MedicineInventoryReport, ReportMedicine, MedicinePurchase, MedicineSale };

export type MedicineReportTarget =
  | "available"
  | "lowStock"
  | "purchases"
  | "sales"
  | "combined";

export type MedicineReportMode = "summary" | "detailed";

export const MEDICINE_REPORT_TARGET_LABELS: Record<
  MedicineReportTarget,
  string
> = {
  available: "Available Stock",
  lowStock: "Low Stock Medicines",
  purchases: "Medicine Purchases",
  sales: "Medicine Sales",
  combined: "Combined Inventory",
};

export interface MedicineReportInput {
  report: MedicineInventoryReport;
  target: MedicineReportTarget;
  generatedAt: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
}
