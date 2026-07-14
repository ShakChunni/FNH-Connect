import type { ReportMedicine } from "../../types";

export interface MedicineStockGroup {
  groupName: string;
  medicines: ReportMedicine[];
  purchaseQuantity: number;
  salesQuantity: number;
  stockInHand: number;
  lowestThreshold: number;
}

export interface GroupedStockRow {
  kind: "group" | "medicine" | "total";
  groupName: string;
  medicineName: string;
  purchaseQuantity: number;
  salesQuantity: number;
  stockInHand: number;
  threshold: number | null;
}

const displayMedicineName = (medicine: ReportMedicine): string => {
  const name = medicine.brandName?.trim() || medicine.genericName.trim();
  return name.length > 0 ? name : "Unknown Medicine";
};

const getGroupKey = (medicine: ReportMedicine): string =>
  `${medicine.group.id}:${medicine.group.name.trim().toLowerCase()}`;

export const getMedicineStockGroups = (
  medicines: ReportMedicine[],
): MedicineStockGroup[] => {
  const groups = new Map<string, MedicineStockGroup>();

  medicines.forEach((medicine) => {
    const groupName = medicine.group.name.trim() || "Unknown Group";
    const key = getGroupKey(medicine);
    const existing = groups.get(key);

    if (existing) {
      existing.medicines.push(medicine);
      existing.purchaseQuantity += medicine.purchaseQuantity;
      existing.salesQuantity += medicine.salesQuantity;
      existing.stockInHand += medicine.currentStock;
      existing.lowestThreshold = Math.min(
        existing.lowestThreshold,
        medicine.lowStockThreshold,
      );
      return;
    }

    groups.set(key, {
      groupName,
      medicines: [medicine],
      purchaseQuantity: medicine.purchaseQuantity,
      salesQuantity: medicine.salesQuantity,
      stockInHand: medicine.currentStock,
      lowestThreshold: medicine.lowStockThreshold,
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      medicines: [...group.medicines].sort((left, right) =>
        displayMedicineName(left).localeCompare(displayMedicineName(right)),
      ),
    }))
    .sort((left, right) => left.groupName.localeCompare(right.groupName));
};

export const getGroupedStockRows = (
  medicines: ReportMedicine[],
  includeThreshold = false,
): GroupedStockRow[] => {
  const groups = getMedicineStockGroups(medicines);
  const rows: GroupedStockRow[] = [];

  groups.forEach((group) => {
    rows.push({
      kind: "group",
      groupName: group.groupName,
      medicineName: "",
      purchaseQuantity: group.purchaseQuantity,
      salesQuantity: group.salesQuantity,
      stockInHand: group.stockInHand,
      threshold: includeThreshold ? group.lowestThreshold : null,
    });

    group.medicines.forEach((medicine) => {
      rows.push({
        kind: "medicine",
        groupName: "",
        medicineName: displayMedicineName(medicine),
        purchaseQuantity: medicine.purchaseQuantity,
        salesQuantity: medicine.salesQuantity,
        stockInHand: medicine.currentStock,
        threshold: includeThreshold ? medicine.lowStockThreshold : null,
      });
    });
  });

  const totals = medicines.reduce<{
    purchaseQuantity: number;
    salesQuantity: number;
    stockInHand: number;
    threshold: number | null;
  }>(
    (summary, medicine) => ({
      purchaseQuantity: summary.purchaseQuantity + medicine.purchaseQuantity,
      salesQuantity: summary.salesQuantity + medicine.salesQuantity,
      stockInHand: summary.stockInHand + medicine.currentStock,
      threshold: includeThreshold
        ? Math.min(
            summary.threshold ?? Number.POSITIVE_INFINITY,
            medicine.lowStockThreshold,
          )
        : null,
    }),
    {
      purchaseQuantity: 0,
      salesQuantity: 0,
      stockInHand: 0,
      threshold: includeThreshold ? Number.POSITIVE_INFINITY : null,
    },
  );

  rows.push({
    kind: "total",
    groupName: "TOTAL",
    medicineName: "",
    purchaseQuantity: totals.purchaseQuantity,
    salesQuantity: totals.salesQuantity,
    stockInHand: totals.stockInHand,
    threshold:
      includeThreshold && Number.isFinite(totals.threshold)
        ? totals.threshold
        : null,
  });

  return rows;
};
