/**
 * Detailed Cash Collection Report Generator
 * Professional PDF report with full payment breakdown including patient names
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { DetailedCashReportData, PaymentDetail } from "./types";

// FNH Brand Colors
const COLORS = {
  primary: "#020617",
  accent: "#1d4ed8",
  text: "#000000",
  lightText: "#1a202c",
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

const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "MMM dd, hh:mm a");
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
 * Generate Detailed Cash Collection Report PDF
 */
export const generateDetailedCashReport = async (
  data: DetailedCashReportData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Draw watermark on first page
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
  doc.text("DETAILED CASH COLLECTION REPORT", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 8;

  // === REPORT INFO BOX ===
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

  // Info rows
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

  // === OVERALL SUMMARY ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Overall Summary", margin, currentY);
  currentY += 6;

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

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // === DETAILED SHIFT & PAYMENT BREAKDOWN ===
  if (data.shifts && data.shifts.length > 0) {
    for (let shiftIndex = 0; shiftIndex < data.shifts.length; shiftIndex++) {
      const shift = data.shifts[shiftIndex];

      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        await drawLogoWatermark(doc);
        currentY = 20;
      }

      // Shift header with date - clean format
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.primary);

      const shiftLabel = data.shifts.length > 1 ? `#${shiftIndex + 1}` : "";
      const timeRange = shift.endTime
        ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
        : `${formatTime(shift.startTime)} - now`;
      const statusBadge = shift.isActive ? " [Active]" : " [Closed]";

      doc.text(
        `Shift ${shiftLabel} - ${shift.shiftDate} | ${timeRange}${statusBadge}`,
        margin,
        currentY
      );
      currentY += 6; // More spacing before table

      // Payment details table (skip the crowded summary line)
      if (shift.payments && shift.payments.length > 0) {
        const paymentRows = shift.payments.map((payment: PaymentDetail) => [
          payment.registrationId,
          formatDateTime(payment.paymentDate),
          payment.patientName.length > 22
            ? payment.patientName.substring(0, 20) + "..."
            : payment.patientName,
          payment.serviceName.length > 18
            ? payment.serviceName.substring(0, 16) + "..."
            : payment.serviceName,
          payment.departmentName,
          formatCurrency(payment.amount),
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [
            ["Reg ID", "Date/Time", "Patient", "Service", "Dept", "Amount"],
          ],
          body: paymentRows,
          theme: "plain",
          headStyles: {
            fillColor: [30, 41, 59], // Slate 800
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7,
            cellPadding: 3,
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 3,
            textColor: COLORS.text,
          },
          columnStyles: {
            0: { cellWidth: 24 }, // Reg ID
            1: { cellWidth: 32 }, // Date/Time
            2: { cellWidth: 40 }, // Patient - wider
            3: { cellWidth: 32 }, // Service
            4: { cellWidth: 26 }, // Dept
            5: { cellWidth: 26, halign: "right", fontStyle: "bold" }, // Amount
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          margin: { left: margin, right: margin },
          didDrawPage: () => {
            // Redraw watermark on each new page
            drawLogoWatermark(doc);
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(COLORS.lightText);
        doc.text("No payments recorded for this shift.", margin, currentY);
        currentY += 10;
      }
    }
  }

  // === DEPARTMENT SUMMARY ===
  if (currentY > pageHeight - 60) {
    doc.addPage();
    await drawLogoWatermark(doc);
    currentY = 20;
  }

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
        if (cellData.row.index === tableData.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // === FOOTER (on last page) ===
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(COLORS.lightText);

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, {
      align: "right",
    });

    doc.text(
      "NB: This is a computer generated detailed report.",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
  }

  // Output
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
