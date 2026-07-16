/**
 * Detailed Medicine Inventory Report Generator
 * Professional PDF report with full medicine, purchase, and patient details
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MedicineReportInput, MedicineReportTarget } from "./types";
import { MEDICINE_REPORT_TARGET_LABELS } from "./types";
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
import { getGroupedStockRows } from "./stockReportHelpers";

/**
 * Generate Detailed Medicine Inventory Report PDF
 */
export const buildDetailedMedicineInventoryReportDocument = async (
  input: MedicineReportInput,
) => {
  const doc = new jsPDF();
  const margin = 15;

  await drawLogoWatermark(doc);

  let currentY = await drawHeader(
    doc,
    `${MEDICINE_REPORT_TARGET_LABELS[input.target].toUpperCase()} DETAILED REPORT`,
  );

  // === REPORT INFO BOX ===
  currentY = drawInfoBox(doc, currentY, input);

  const { stats } = input.report;

  if (input.target === "combined") {
    // === OVERALL SUMMARY SECTION ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text("Overall Summary", margin, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Available Medicines",
          "Low Stock Items",
          "Purchase Records",
          "Sale Records",
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
  }

  // === AVAILABLE MEDICINES DETAILED ===
  if (shouldRender(input.target, "available")) {
    currentY = checkNewPage(doc, currentY, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text(
      `Available Stock (${formatNumber(input.report.availableMedicines.length)} medicines)`,
      margin,
      currentY,
    );
    currentY += 6;

    if (input.report.availableMedicines.length > 0) {
      const groupedRows = getGroupedStockRows(
        input.report.availableMedicines,
      );
      const groupRowIndexes = new Set<number>();
      const totalRowIndex = groupedRows.length - 1;
      const medicineRows = groupedRows.map((row, index) => {
        if (row.kind === "group") {
          groupRowIndexes.add(index);
        }

        return [
          row.groupName,
          row.medicineName,
          formatNumber(row.purchaseQuantity),
          formatNumber(row.salesQuantity),
          formatNumber(row.stockInHand),
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Medicine Group",
            "Medicines",
            "Purchase",
            "Sales",
            "Stock in Hand",
          ],
        ],
        body: medicineRows,
        theme: "plain",
        headStyles: {
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: COLORS.text,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 28, halign: "center" },
          4: { cellWidth: 34, halign: "center", fontStyle: "bold" },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (cellData) => {
          if (groupRowIndexes.has(cellData.row.index)) {
            cellData.cell.styles.fontStyle = "bold";
            cellData.cell.styles.fillColor = [219, 234, 254];
          }

          if (cellData.row.index === totalRowIndex) {
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
      doc.text("No available stock found.", margin, currentY);
      currentY += 10;
    }
  }

  // === LOW STOCK MEDICINES DETAILED ===
  if (shouldRender(input.target, "lowStock")) {
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
      const groupedRows = getGroupedStockRows(
        input.report.lowStockMedicines,
        true,
      );
      const groupRowIndexes = new Set<number>();
      const totalRowIndex = groupedRows.length - 1;
      const lowStockRows = groupedRows.map((row, index) => {
        if (row.kind === "group") {
          groupRowIndexes.add(index);
        }

        return [
          row.groupName,
          row.medicineName,
          formatNumber(row.purchaseQuantity),
          formatNumber(row.salesQuantity),
          formatNumber(row.stockInHand),
          row.threshold === null ? "—" : formatNumber(row.threshold),
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[
          "Medicine Group",
          "Medicines",
          "Purchase",
          "Sales",
          "Stock in Hand",
          "Threshold",
        ]],
        body: lowStockRows,
        theme: "plain",
        headStyles: {
          fillColor: COLORS.warning,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: COLORS.text,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: "bold" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 30, halign: "center", fontStyle: "bold" },
          5: { cellWidth: 25, halign: "center" },
        },
        alternateRowStyles: {
          fillColor: [254, 252, 232],
        },
        didParseCell: (cellData) => {
          if (groupRowIndexes.has(cellData.row.index)) {
            cellData.cell.styles.fontStyle = "bold";
            cellData.cell.styles.fillColor = [254, 243, 199];
          }

          if (cellData.row.index === totalRowIndex) {
            cellData.cell.styles.fontStyle = "bold";
            cellData.cell.styles.fillColor = [254, 249, 195];
          }
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.lightText);
      doc.text("No low stock medicines.", margin, currentY);
      currentY += 10;
    }
  }

  // === MEDICINE PURCHASES DETAILED ===
  if (shouldRender(input.target, "purchases")) {
    currentY = checkNewPage(doc, currentY, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text(
      `Medicine Purchases (${formatNumber(input.report.purchases.length)} records)`,
      margin,
      currentY,
    );
    currentY += 6;

    if (input.report.purchases.length > 0) {
      const purchaseRows = input.report.purchases.map((purchase) => [
        safeText(purchase.invoiceNumber),
        safeText(purchase.company?.name || "Unknown Supplier"),
        safeText(purchase.medicine?.brandName || purchase.medicine?.genericName),
        safeText(purchase.medicine?.group?.name || "Unknown Group"),
        formatNumber(purchase.quantity),
        formatCurrency(purchase.unitPrice),
        formatCurrency(purchase.vatTax),
        formatCurrency(purchase.discountAmount),
        formatCurrency(purchase.totalAmount),
        formatDate(purchase.purchaseDate),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Invoice #",
            "Supplier",
            "Medicine",
            "Group",
            "Qty",
            "Unit Cost",
            "VAT + Tax",
            "Discount",
            "Total Cost",
            "Date",
          ],
        ],
        body: purchaseRows,
        theme: "plain",
        headStyles: {
          fillColor: COLORS.success,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: COLORS.text,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 23 },
          2: { cellWidth: 27, fontStyle: "bold" },
          3: { cellWidth: 18 },
          4: { cellWidth: 11, halign: "center" },
          5: { cellWidth: 16, halign: "right" },
          6: { cellWidth: 15, halign: "right" },
          7: { cellWidth: 17, halign: "right" },
          8: { cellWidth: 18, halign: "right", fontStyle: "bold" },
          9: { cellWidth: 15 },
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
  }

  // === MEDICINE SALES DETAILED (GROUPED BY PATIENT) ===
  if (shouldRender(input.target, "sales")) {
    currentY = checkNewPage(doc, currentY, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text(
      `Medicine Sales (${formatNumber(input.report.sales.length)} records)`,
      margin,
      currentY,
    );
    currentY += 6;

    if (input.report.sales.length > 0) {
      const patientGroups = getPatientSaleGroups(input.report.sales);

      for (const group of patientGroups) {
        currentY = checkNewPage(doc, currentY, 50);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(COLORS.primary);
        const phoneText = group.phoneNumber ? ` (${group.phoneNumber})` : "";
        doc.text(
          `${group.patientName}${phoneText} - ${formatNumber(group.sales.length)} sale line${group.sales.length !== 1 ? "s" : ""}, ${formatCurrency(group.totalAmount)}`,
          margin,
          currentY,
        );
        currentY += 6;

        const saleRows = group.sales.map((sale) => [
          safeText(sale.medicine?.brandName || sale.medicine?.genericName),
          safeText(sale.medicine?.group?.name || "Unknown Group"),
          safeText(sale.purchase?.company?.name || "Unknown Supplier"),
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
            ["Medicine", "Group", "Source Supplier", "Qty", "Sale Price", "Sale Total", "Patient Source", "Date"],
          ],
          body: saleRows,
          theme: "plain",
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7,
            cellPadding: 2,
          },
          bodyStyles: {
            fontSize: 6.8,
            cellPadding: 1.8,
            textColor: COLORS.text,
            overflow: "linebreak",
          },
          columnStyles: {
            0: { cellWidth: 32, fontStyle: "bold" },
            1: { cellWidth: 22 },
            2: { cellWidth: 25 },
            3: { cellWidth: 12, halign: "center" },
            4: { cellWidth: 20, halign: "right" },
            5: { cellWidth: 20, halign: "right", fontStyle: "bold" },
            6: { cellWidth: 25 },
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
  }

  // === FOOTER ===
  drawFooter(doc, input.generatedBy);

  return doc;
};

export const generateDetailedMedicineInventoryReport = async (
  input: MedicineReportInput,
) => {
  const doc = await buildDetailedMedicineInventoryReportDocument(input);
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
  doc.text("Report:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${MEDICINE_REPORT_TARGET_LABELS[input.target]} Detailed`,
    col2X + 22,
    infoY,
  );

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

function shouldRender(
  selectedTarget: MedicineReportTarget,
  sectionTarget: Exclude<MedicineReportTarget, "combined">,
): boolean {
  return selectedTarget === "combined" || selectedTarget === sectionTarget;
}

interface LowStockGroup {
  groupName: string;
  medicines: MedicineReportInput["report"]["lowStockMedicines"];
}

function getLowStockGroups(
  medicines: MedicineReportInput["report"]["lowStockMedicines"],
): LowStockGroup[] {
  const groups = new Map<string, LowStockGroup>();

  for (const medicine of medicines) {
    const groupName = medicine.group?.name || "Unknown Group";
    const existing = groups.get(groupName);

    if (existing) {
      existing.medicines.push(medicine);
    } else {
      groups.set(groupName, {
        groupName,
        medicines: [medicine],
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      medicines: group.medicines.sort((a, b) => {
        const genericCompare = a.genericName.localeCompare(b.genericName);
        if (genericCompare !== 0) {
          return genericCompare;
        }

        return safeText(a.brandName || a.genericName).localeCompare(
          safeText(b.brandName || b.genericName),
        );
      }),
    }))
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
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
