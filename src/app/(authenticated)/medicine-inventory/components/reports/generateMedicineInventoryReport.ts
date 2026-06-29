/**
 * Medicine Inventory Summary Report Generator
 * Professional PDF report matching FNH brand standards
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MedicineReportInput } from "./types";
import type { JsPDFWithAutoTable } from "./reportHelpers";
import {
  COLORS,
  drawHeader,
  drawFooter,
  drawLogoWatermark,
  formatCurrency,
  formatNumber,
  formatDate,
  safeText,
  checkNewPage,
} from "./reportHelpers";

/**
 * Generate Medicine Inventory Summary Report PDF
 */
export const generateMedicineInventoryReport = async (
  input: MedicineReportInput,
) => {
  const doc = new jsPDF();
  const margin = 15;

  await drawLogoWatermark(doc);

  let currentY = await drawHeader(doc, "MEDICINE INVENTORY REPORT");

  // === REPORT INFO BOX ===
  currentY = drawInfoBox(doc, currentY, input);

  // === OVERALL SUMMARY SECTION ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Overall Summary", margin, currentY);
  currentY += 6;

  const { stats } = input.report;

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Total Medicines",
        "Low Stock Items",
        "Total Purchases",
        "Total Sales",
        "Stock Value",
      ],
    ],
    body: [
      [
        formatNumber(stats.totalMedicines),
        formatNumber(stats.lowStockCount),
        `${formatNumber(stats.totalPurchasesCount)} (${formatCurrency(stats.totalPurchasesAmount)})`,
        `${formatNumber(stats.totalSalesCount)} (${formatCurrency(stats.totalSalesAmount)})`,
        formatCurrency(stats.totalStockValue),
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: COLORS.lightText,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      fontStyle: "bold",
      cellPadding: 4,
      halign: "center",
      textColor: COLORS.primary,
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // === AVAILABLE MEDICINES SUMMARY BY GROUP ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Available Medicines Summary", margin, currentY);
  currentY += 6;

  const groupSummary = getGroupSummary(input.report.availableMedicines);

  if (groupSummary.length > 0) {
    const groupRows = groupSummary.map((group, index) => [
      (index + 1).toString(),
      group.groupName,
      formatNumber(group.medicineCount),
      formatNumber(group.totalStock),
      formatCurrency(group.stockValue),
    ]);

    groupRows.push([
      "",
      "TOTAL",
      formatNumber(input.report.availableMedicines.length),
      formatNumber(
        input.report.availableMedicines.reduce(
          (sum, medicine) => sum + medicine.currentStock,
          0,
        ),
      ),
      formatCurrency(stats.totalStockValue),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Group", "Medicines", "Total Stock", "Stock Value"]],
      body: groupRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: 28, halign: "center" },
        4: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (cellData) => {
        if (cellData.row.index === groupRows.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.lightText);
    doc.text("No available medicines found.", margin, currentY);
    currentY += 10;
  }

  // === LOW STOCK MEDICINES ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Low Stock Medicines (${formatNumber(stats.lowStockCount)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.lowStockMedicines.length > 0) {
    const lowStockRows = input.report.lowStockMedicines.map((medicine) => [
      safeText(medicine.brandName || medicine.genericName),
      safeText(medicine.group?.name || "Unknown Group"),
      safeText(medicine.strength || "—"),
      formatNumber(medicine.currentStock),
      formatNumber(medicine.lowStockThreshold),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Medicine", "Group", "Strength", "Current Stock", "Threshold"]],
      body: lowStockRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.warning,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: "auto", fontStyle: "bold" },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30, halign: "center", fontStyle: "bold" },
        4: { cellWidth: 30, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [254, 252, 232],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.lightText);
    doc.text("No low stock medicines.", margin, currentY);
    currentY += 10;
  }

  // === BOUGHT MEDICINES SUMMARY ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Bought Medicines (${formatNumber(stats.totalPurchasesCount)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.purchases.length > 0) {
    const purchaseSummary = getPurchaseSummary(input.report.purchases);

    const purchaseRows = purchaseSummary.map((item, index) => [
      (index + 1).toString(),
      safeText(item.companyName),
      formatNumber(item.medicineCount),
      formatNumber(item.totalQuantity),
      formatCurrency(item.totalAmount),
    ]);

    purchaseRows.push([
      "",
      "TOTAL",
      formatNumber(input.report.purchases.length),
      formatNumber(
        input.report.purchases.reduce((sum, p) => sum + p.quantity, 0),
      ),
      formatCurrency(stats.totalPurchasesAmount),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Company", "Lines", "Total Qty", "Total Amount"]],
      body: purchaseRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      didParseCell: (cellData) => {
        if (cellData.row.index === purchaseRows.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [220, 252, 231];
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.lightText);
    doc.text("No purchases found for the selected period.", margin, currentY);
    currentY += 10;
  }

  // === SOLD MEDICINES SUMMARY ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Sold Medicines (${formatNumber(stats.totalSalesCount)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.sales.length > 0) {
    const salesSummary = getSalesSummary(input.report.sales);

    const salesRows = salesSummary.map((item, index) => [
      (index + 1).toString(),
      safeText(item.patientName),
      safeText(item.phoneNumber || "—"),
      formatNumber(item.medicineCount),
      formatNumber(item.totalQuantity),
      formatCurrency(item.totalAmount),
    ]);

    salesRows.push([
      "",
      "TOTAL",
      "",
      formatNumber(input.report.sales.length),
      formatNumber(
        input.report.sales.reduce((sum, s) => sum + s.quantity, 0),
      ),
      formatCurrency(stats.totalSalesAmount),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Patient", "Phone", "Lines", "Total Qty", "Total Amount"]],
      body: salesRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.accent,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 35 },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 35, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255],
      },
      didParseCell: (cellData) => {
        if (cellData.row.index === salesRows.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [219, 234, 254];
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.lightText);
    doc.text("No sales found for the selected period.", margin, currentY);
    currentY += 10;
  }

  // === FOOTER ===
  drawFooter(doc, input.generatedBy);

  // Output
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

// === Helpers ===

function drawInfoBox(
  doc: jsPDF,
  currentY: number,
  input: MedicineReportInput,
): number {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 5;
  const rowHeight = 6;
  const boxHeight = boxPadding * 2 + rowHeight * 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "S");

  let infoY = currentY + boxPadding + 4;
  doc.setFontSize(10);

  const col2X = margin + contentWidth * 0.5;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Period:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(input.periodLabel, margin + boxPadding + 30, infoY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Generated:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(input.generatedAt, col2X + 30, infoY);

  // Row 2
  infoY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Range:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(`${input.startDate} - ${input.endDate}`, margin + boxPadding + 24, infoY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Report Type:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text("Summary", col2X + 35, infoY);

  // Row 3
  infoY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Generated By:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(input.generatedBy, margin + boxPadding + 32, infoY);

  return currentY + boxHeight + 10;
}

interface GroupSummaryItem {
  groupName: string;
  medicineCount: number;
  totalStock: number;
  stockValue: number;
}

function getGroupSummary(
  medicines: MedicineReportInput["report"]["availableMedicines"],
): GroupSummaryItem[] {
  const groups = new Map<string, GroupSummaryItem>();

  for (const medicine of medicines) {
    const groupName = medicine.group?.name || "Unknown Group";
    const existing = groups.get(groupName);

    if (existing) {
      existing.medicineCount += 1;
      existing.totalStock += medicine.currentStock;
      existing.stockValue += medicine.currentStock * medicine.defaultSalePrice;
    } else {
      groups.set(groupName, {
        groupName,
        medicineCount: 1,
        totalStock: medicine.currentStock,
        stockValue: medicine.currentStock * medicine.defaultSalePrice,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.groupName.localeCompare(b.groupName),
  );
}

interface PurchaseSummaryItem {
  companyName: string;
  medicineCount: number;
  totalQuantity: number;
  totalAmount: number;
}

function getPurchaseSummary(
  purchases: MedicineReportInput["report"]["purchases"],
): PurchaseSummaryItem[] {
  const companies = new Map<string, PurchaseSummaryItem>();

  for (const purchase of purchases) {
    const companyName = purchase.company?.name || "Unknown Company";
    const existing = companies.get(companyName);

    if (existing) {
      existing.medicineCount += 1;
      existing.totalQuantity += purchase.quantity;
      existing.totalAmount += purchase.totalAmount;
    } else {
      companies.set(companyName, {
        companyName,
        medicineCount: 1,
        totalQuantity: purchase.quantity,
        totalAmount: purchase.totalAmount,
      });
    }
  }

  return Array.from(companies.values()).sort((a, b) =>
    a.companyName.localeCompare(b.companyName),
  );
}

interface SalesSummaryItem {
  patientName: string;
  phoneNumber: string | null;
  medicineCount: number;
  totalQuantity: number;
  totalAmount: number;
}

function getSalesSummary(
  sales: MedicineReportInput["report"]["sales"],
): SalesSummaryItem[] {
  const patients = new Map<string, SalesSummaryItem>();

  for (const sale of sales) {
    const patientName = sale.patient?.fullName || "Unknown Patient";
    const phoneNumber = sale.patient?.phoneNumber || null;
    const key = `${patientName}-${phoneNumber || ""}`;
    const existing = patients.get(key);

    if (existing) {
      existing.medicineCount += 1;
      existing.totalQuantity += sale.quantity;
      existing.totalAmount += sale.totalAmount;
    } else {
      patients.set(key, {
        patientName,
        phoneNumber,
        medicineCount: 1,
        totalQuantity: sale.quantity,
        totalAmount: sale.totalAmount,
      });
    }
  }

  return Array.from(patients.values()).sort((a, b) =>
    a.patientName.localeCompare(b.patientName),
  );
}
