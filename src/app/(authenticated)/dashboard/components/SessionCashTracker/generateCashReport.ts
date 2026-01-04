/**
 * Cash Collection Report Generator
 * Professional PDF report matching FNH brand standards
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { SessionCashReportData } from "./types";

// FNH Brand Colors - matching pathology receipt
const COLORS = {
  primary: "#020617", // darker navy
  accent: "#1d4ed8", // darker blue
  text: "#000000", // pure black
  lightText: "#1a202c", // darker gray
  border: "#cbd5e1",
  faint: "#f1f5f9",
  success: "#16a34a",
  danger: "#dc2626",
};

const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  email: "Email: firozanursinghome@gmail.com",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const formatCurrency = (amount: number): string => {
  return `BDT ${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "h:mm a");
};

/**
 * Draw a subtle logo watermark
 */
const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    const logoSize = 100;
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight * 0.65 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch (e) {
    // Silently fail if logo not available
  }
};

/**
 * Generate Cash Collection Report PDF
 */
export const generateSessionCashReport = async (
  data: SessionCashReportData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Draw watermark
  await drawLogoWatermark(doc);

  let currentY = 10;

  // === HEADER ===
  try {
    const logo = await loadImage("/fnh-logo.png");
    const logoW = 20;
    const logoH = 20;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, currentY, logoW, logoH);
  } catch (e) {}

  currentY = 35;

  // Hospital Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // Address & Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text(
    `${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );
  currentY += 6;

  // Divider
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("CASH COLLECTION REPORT", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 8;

  // === REPORT INFO BOX ===
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 5;
  const rowHeight = 6;
  const boxHeight = boxPadding * 2 + rowHeight * 3;

  // Draw box background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "S");

  let infoY = currentY + boxPadding + 4;
  doc.setFontSize(10);

  // Row 1: Staff | Department
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Staff:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.staffName, margin + boxPadding + 15, infoY);

  const col2X = margin + contentWidth * 0.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Dept:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.departmentFilter, col2X + 14, infoY);

  // Row 2: Period | Transactions
  infoY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Period:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.periodLabel, margin + boxPadding + 18, infoY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Transactions:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.transactionCount.toString(), col2X + 30, infoY);

  // Row 3: Date Range | Generated
  infoY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Range:", margin + boxPadding, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.startDate} - ${data.endDate}`,
    margin + boxPadding + 17,
    infoY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Generated:", col2X, infoY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.generatedAt, col2X + 25, infoY);

  currentY += boxHeight + 10;

  // === OVERALL SUMMARY SECTION ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Overall Summary", margin, currentY);
  currentY += 6;

  // Summary table - compact single row
  autoTable(doc, {
    startY: currentY,
    head: [["Total Collected", "Total Refunded", "Net Cash"]],
    body: [
      [
        formatCurrency(data.totalCollected),
        formatCurrency(data.totalRefunded),
        formatCurrency(data.netCash),
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: COLORS.lightText,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 11,
      fontStyle: "bold",
      cellPadding: 4,
      halign: "center",
      textColor: COLORS.primary,
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 3 },
      1: { cellWidth: contentWidth / 3 },
      2: { cellWidth: contentWidth / 3 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // === SHIFT-WISE BREAKDOWN (Compact Table Format) ===
  if (data.shifts && data.shifts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text(`Shift Breakdown`, margin, currentY);
    currentY += 6;

    // Build shift table data - one row per shift with all info
    const shiftTableData = data.shifts.map((shift, index) => {
      const shiftNum = data.shifts!.length > 1 ? `#${index + 1}` : "Shift";
      const status = shift.isActive ? "Active" : "Closed";
      const timeRange = shift.endTime
        ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
        : `${formatTime(shift.startTime)} - now`;
      const netCash = shift.totalCollected - shift.totalRefunded;

      return [
        shiftNum,
        status,
        timeRange,
        shift.transactionCount.toString(),
        formatCurrency(shift.totalCollected),
        formatCurrency(shift.totalRefunded),
        formatCurrency(netCash),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        ["Shift", "Status", "Time", "Txns", "Collected", "Refunded", "Net"],
      ],
      body: shiftTableData,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text,
        fontStyle: "normal",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 40 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (cellData) => {
        // Style Active status green, Closed gray
        if (cellData.column.index === 1 && cellData.section === "body") {
          if (cellData.cell.raw === "Active") {
            cellData.cell.styles.textColor = COLORS.success;
            cellData.cell.styles.fontStyle = "bold";
          } else {
            cellData.cell.styles.textColor = [120, 120, 120];
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // === OVERALL DEPARTMENT BREAKDOWN TABLE ===
  if (data.departmentBreakdown.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text("Department Summary", margin, currentY);
    currentY += 6;

    const tableData = data.departmentBreakdown.map((dept, index) => [
      (index + 1).toString(),
      dept.departmentName,
      dept.transactionCount.toString(),
      formatCurrency(dept.totalCollected),
    ]);

    // Add total row
    tableData.push([
      "",
      "TOTAL",
      data.transactionCount.toString(),
      formatCurrency(data.totalCollected),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Department", "Txns", "Amount"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
        cellPadding: 3,
        fontSize: 9,
      },
      bodyStyles: {
        textColor: COLORS.text,
        cellPadding: 3,
        fontSize: 9,
        valign: "middle",
        fontStyle: "normal",
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 45, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (cellData) => {
        // Style the last row (total) differently
        if (cellData.row.index === tableData.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // === FOOTER ===
  const footerY = pageHeight - 25;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Report Generated By", margin, footerY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(data.staffName, margin, footerY + 5);

  const printTime = new Date().toLocaleString("en-BD", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text(`Generated on: ${printTime}`, margin, footerY + 10);

  // Page Number
  doc.setFontSize(8);
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY + 5, { align: "right" });

  // Bottom branding
  doc.setTextColor(COLORS.lightText);
  doc.setFontSize(7);
  doc.text(
    "NB: This is a computer generated report.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
  doc.text(
    "Thank you for choosing Feroza Nursing Home",
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  // Output
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
