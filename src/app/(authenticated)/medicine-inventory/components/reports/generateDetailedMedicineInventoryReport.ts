/**
 * Detailed Medicine Inventory Report Generator
 * Professional PDF report with full medicine, purchase, and patient details
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
 * Generate Detailed Medicine Inventory Report PDF
 */
export const generateDetailedMedicineInventoryReport = async (
  input: MedicineReportInput,
) => {
  const doc = new jsPDF();
  const margin = 15;

  await drawLogoWatermark(doc);

  let currentY = await drawHeader(doc, "DETAILED MEDICINE INVENTORY REPORT");

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

  // === AVAILABLE MEDICINES DETAILED ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Available Medicines (${formatNumber(input.report.availableMedicines.length)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.availableMedicines.length > 0) {
    const medicineRows = input.report.availableMedicines.map((medicine, index) => [
      (index + 1).toString(),
      safeText(medicine.brandName || medicine.genericName),
      safeText(medicine.genericName),
      safeText(medicine.group?.name || "Unknown Group"),
      safeText(medicine.strength || "—"),
      safeText(medicine.dosageForm || "—"),
      formatNumber(medicine.currentStock),
      formatCurrency(medicine.defaultSalePrice),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        ["#", "Medicine", "Generic", "Group", "Strength", "Form", "Stock", "Price"],
      ],
      body: medicineRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 42, fontStyle: "bold" },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
        6: { cellWidth: 18, halign: "center", fontStyle: "bold" },
        7: { cellWidth: 28, halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
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

  // === LOW STOCK MEDICINES DETAILED ===
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
      safeText(medicine.genericName),
      safeText(medicine.group?.name || "Unknown Group"),
      safeText(medicine.strength || "—"),
      formatNumber(medicine.currentStock),
      formatNumber(medicine.lowStockThreshold),
      formatCurrency(medicine.defaultSalePrice),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        ["Medicine", "Generic", "Group", "Strength", "Current Stock", "Threshold", "Price"],
      ],
      body: lowStockRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.warning,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 35 },
        2: { cellWidth: 32 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, halign: "center", fontStyle: "bold" },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 25, halign: "right" },
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

  // === BOUGHT MEDICINES DETAILED ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Bought Medicines (${formatNumber(input.report.purchases.length)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.purchases.length > 0) {
    const purchaseRows = input.report.purchases.map((purchase) => [
      safeText(purchase.invoiceNumber),
      safeText(purchase.company?.name || "Unknown Company"),
      safeText(purchase.medicine?.brandName || purchase.medicine?.genericName),
      safeText(purchase.medicine?.group?.name || "Unknown Group"),
      formatNumber(purchase.quantity),
      formatCurrency(purchase.unitPrice),
      formatCurrency(purchase.totalAmount),
      formatDate(purchase.purchaseDate),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        ["Invoice #", "Company", "Medicine", "Group", "Qty", "Unit Price", "Total", "Date"],
      ],
      body: purchaseRows,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 35 },
        2: { cellWidth: 38, fontStyle: "bold" },
        3: { cellWidth: 28 },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        7: { cellWidth: 25 },
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
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

  // === SOLD MEDICINES DETAILED (GROUPED BY PATIENT) ===
  currentY = checkNewPage(doc, currentY, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(
    `Sold Medicines (${formatNumber(input.report.sales.length)})`,
    margin,
    currentY,
  );
  currentY += 6;

  if (input.report.sales.length > 0) {
    const patientGroups = getPatientSaleGroups(input.report.sales);

    for (const group of patientGroups) {
      currentY = checkNewPage(doc, currentY, 50);

      // Patient header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.primary);
      const phoneText = group.phoneNumber ? ` (${group.phoneNumber})` : "";
      doc.text(
        `${group.patientName}${phoneText} — ${formatNumber(group.sales.length)} line${group.sales.length !== 1 ? "s" : ""}, ${formatCurrency(group.totalAmount)}`,
        margin,
        currentY,
      );
      currentY += 6;

      const saleRows = group.sales.map((sale) => [
        safeText(sale.medicine?.brandName || sale.medicine?.genericName),
        safeText(sale.medicine?.group?.name || "Unknown Group"),
        safeText(sale.purchase?.company?.name || "Unknown Company"),
        formatNumber(sale.quantity),
        formatCurrency(sale.unitPrice),
        formatCurrency(sale.totalAmount),
        sale.admission?.admissionNumber
          ? `Adm: ${sale.admission.admissionNumber}`
          : "Walk-in",
        formatDate(sale.saleDate),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          ["Medicine", "Group", "Company", "Qty", "Price", "Total", "Source", "Date"],
        ],
        body: saleRows,
        theme: "plain",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: COLORS.text,
        },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: "bold" },
          1: { cellWidth: 26 },
          2: { cellWidth: 30 },
          3: { cellWidth: 12, halign: "center" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 28 },
          7: { cellWidth: 24 },
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;
    }
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
  doc.text("Detailed", col2X + 35, infoY);

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

interface PatientSaleGroup {
  patientName: string;
  phoneNumber: string | null;
  sales: MedicineReportInput["report"]["sales"];
  totalAmount: number;
}

function getPatientSaleGroups(
  sales: MedicineReportInput["report"]["sales"],
): PatientSaleGroup[] {
  const groups = new Map<string, PatientSaleGroup>();

  for (const sale of sales) {
    const patientName = sale.patient?.fullName || "Unknown Patient";
    const phoneNumber = sale.patient?.phoneNumber || null;
    const key = `${patientName}-${phoneNumber || ""}`;
    const existing = groups.get(key);

    if (existing) {
      existing.sales.push(sale);
      existing.totalAmount += sale.totalAmount;
    } else {
      groups.set(key, {
        patientName,
        phoneNumber,
        sales: [sale],
        totalAmount: sale.totalAmount,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.patientName.localeCompare(b.patientName),
  );
}
