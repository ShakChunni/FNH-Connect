import type {
  MedicineInventoryReport,
  ReportMedicine,
  MedicinePurchase,
  MedicineSale,
} from "../../types";

export type { MedicineInventoryReport, ReportMedicine, MedicinePurchase, MedicineSale };

export interface MedicineReportInput {
  report: MedicineInventoryReport;
  generatedAt: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
}
