import jsPDF, { GState } from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityTestData } from "../types";
import { PATHOLOGY_TESTS } from "../../pathology/constants/pathologyTests";
import { formatBDT } from "@/lib/timezone";

// FNH Brand Colors
const COLORS = {
  primary: "#020617", // darker navy
  accent: "#1d4ed8", // darker blue
  text: "#000000", // pure black
  lightText: "#1a202c", // darker gray
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "HSI Center",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
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

/**
 * Draw a subtle logo watermark in the bottom half of the page
 */
const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/hsi-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.04 }));
    const logoSize = 100;
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight * 0.7 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch (e) {
    // Silently fail if logo not available
  }
};

/**
 * Draw status indicator
 */
const drawStatusStamp = (doc: jsPDF, isPaid: boolean) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.5 }));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(isPaid ? "#16a34a" : "#dc2626");
  doc.text(isPaid ? "PAID" : "DUE", pageWidth - margin, pageHeight - 8, {
    align: "right",
  });

  doc.restoreGraphicsState();
};

const drawAuditFooter = (
  doc: jsPDF,
  options: {
    footerY: number;
    margin: number;
    pageWidth: number;
    leftLabel: string;
    leftValue: string;
    rightLabel?: string;
    rightValue?: string;
    timestampLabel: string;
    timestamp: string;
  },
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  doc.text(options.leftLabel, options.margin, options.footerY + 5);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.primary);
  doc.text(options.leftValue, options.margin, options.footerY + 10);

  if (options.rightLabel && options.rightValue) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    doc.text(
      options.rightLabel,
      options.pageWidth - options.margin,
      options.footerY + 5,
      { align: "right" },
    );

    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.text(
      options.rightValue,
      options.pageWidth - options.margin,
      options.footerY + 10,
      { align: "right" },
    );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.text);
  doc.text(
    `${options.timestampLabel}: ${options.timestamp}`,
    options.margin,
    options.footerY + 15,
  );
};

export const generateInfertilityTestReceipt = async (
  data: InfertilityTestData,
  printedBy: string = "Staff",
  targetWindow?: Window | null,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  // Derive the printed balance from the authoritative total and paid values.
  // The denormalized dueAmount field may be stale on older records.
  const calculatedDueAmount = Math.max(
    0,
    Number(data.grandTotal) - Number(data.paidAmount),
  );
  const isPaid = calculatedDueAmount <= 0;

  // Prepare table rows
  const tests = data.selectedTests;
  const allTableRows = tests.map((testName: string, index: number) => {
    const testInfo = PATHOLOGY_TESTS.find((t) => t.name === testName || t.code === testName);
    return [
      index + 1,
      testInfo ? testInfo.name : testName,
      testInfo ? `${testInfo.price.toLocaleString()}` : "-",
    ];
  });

  // Chunking logic for multi-page
  const firstPageMax = 13;
  const continuationMax = 16;
  const chunks: (string | number)[][][] = [];

  if (allTableRows.length <= firstPageMax) {
    chunks.push(allTableRows);
  } else {
    chunks.push(allTableRows.slice(0, firstPageMax));
    let remaining = allTableRows.slice(firstPageMax);
    while (remaining.length > 0) {
      chunks.push(remaining.slice(0, continuationMax));
      remaining = remaining.slice(continuationMax);
    }
  }

  const totalPages = chunks.length;

  for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
    if (pageIndex > 0) doc.addPage();
    const currentChunk = chunks[pageIndex];
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === chunks.length - 1;

    // Draw subtle logo watermark on every page
    await drawLogoWatermark(doc);

    let currentY = 10;

    if (isFirstPage) {
      // Header logo
      try {
        const logo = await loadImage("/hsi-logo.png");
        const logoW = 20;
        const logoH = 20;
        const logoX = pageWidth / 2 - logoW / 2;
        doc.addImage(logo, "PNG", logoX, 10, logoW, logoH);
      } catch (e) {}

      currentY = 35;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary);
      doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
      currentY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.lightText);
      doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
      currentY += 5;
      doc.text(COMPANY_INFO.phone, pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.accent);
      currentY += 6;

      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.primary);
      doc.text("Investigation Invoice", pageWidth / 2, currentY, { align: "center" });
      currentY += 6;

      // Receipt # and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary);
      doc.text(`#${data.testNumber}`, margin, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      const testDate = formatBDT(data.testDate, "d MMM yyyy, hh:mm a");
      doc.text(`Date: ${testDate}`, pageWidth - margin, currentY, { align: "right" });
      currentY += 7;

      // Patient Details Box
      const contentWidth = pageWidth - margin * 2;
      const boxPadding = 4;
      const rowHeight = 5.5;
      const labelWidth = 26;
      const col1X = margin + boxPadding;
      const col1ValX = col1X + labelWidth;
      const col2X = margin + contentWidth * 0.5 + boxPadding;
      const col2ValX = col2X + labelWidth;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, contentWidth, 31, 2, 2, "F");
      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, 31, 2, 2, "S");

      let pY = currentY + boxPadding + 3;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Subject:", col1X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      doc.text(
        data.subjectName
          ? `${data.subjectName} (${data.subjectLabel})`
          : data.subjectLabel || "N/A",
        col1ValX,
        pY,
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Case #:", col2X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      doc.text(data.caseNumber || "N/A", col2ValX, pY);

      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Patient:", col1X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      doc.text(data.patientFullName || "N/A", col1ValX, pY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Mobile:", col2X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      doc.text(data.mobileNumber || "N/A", col2ValX, pY);

      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Patient Age:", col1X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      const patientAge = data.patientAge != null ? `${data.patientAge}Y` : "N/A";
      doc.text(`${patientAge} / ${data.patientGender || "N/A"}`, col1ValX, pY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Subject Age:", col2X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      const subjectAge =
        data.subjectType === "PATIENT" ? data.patientAge : data.guardianAge;
      const subjectGender =
        data.subjectType === "PATIENT" ? data.patientGender : data.guardianGender;
      doc.text(
        `${subjectAge != null ? `${subjectAge}Y` : "N/A"} / ${subjectGender || "N/A"}`,
        col2ValX,
        pY,
      );

      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text("Ordered By:", col1X, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFontSize(11);
      doc.text(data.orderedBy || "Self", col1ValX, pY);

      currentY += 37;
    } else {
      // Continuation Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary);
      doc.text(COMPANY_INFO.name, pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Investigation Invoice: ${data.testNumber} — Page ${pageIndex + 1} of ${totalPages}`, pageWidth / 2, currentY + 12, { align: "center" });
      currentY += 20;
    }

    // Table
    autoTable(doc, {
      startY: currentY,
      head: [["SN", "Investigation", "Amount (BDT)"]],
      body: currentChunk,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.faint,
        textColor: COLORS.primary,
        lineColor: COLORS.primary,
        lineWidth: 0.2,
        fontStyle: "bold",
        halign: "left",
        cellPadding: 5,
      },
      bodyStyles: {
        textColor: COLORS.text,
        cellPadding: 3,
        fontSize: 10,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold", fontSize: 12 },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
    });

    if (isLastPage) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      let tY = finalY;
      const tLabelX = pageWidth - margin - 50;
      const tValX = pageWidth - margin - 5;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Sub Total", tLabelX, tY, { align: "right" });
      doc.setTextColor(COLORS.primary);
      doc.text(`${Number(data.testCharge).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 6;

      if (data.discountAmount && Number(data.discountAmount) > 0) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.lightText);
        doc.text("Discount", tLabelX, tY, { align: "right" });
        doc.setTextColor(COLORS.primary);
        doc.text(`- ${Number(data.discountAmount).toLocaleString()}`, tValX, tY, { align: "right" });
        tY += 6;
      }

      doc.setDrawColor(COLORS.border);
      doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(COLORS.primary);
      doc.text("Net Total:", tLabelX, tY, { align: "right" });
      doc.text(`${Number(data.grandTotal).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLORS.lightText);
      doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
      doc.setTextColor(22, 128, 61);
      doc.text(`${Number(data.paidAmount).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      if (calculatedDueAmount > 0) {
        // === LEFT-SIDE DUE STAMP/SEAL (Double-ring) ===
        const stampRadius = 18;
        const stampCenterX = margin + stampRadius + 8;
        const stampCenterY = finalY + stampRadius + 2;

        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.85 }));

        // Outer circle border
        doc.setDrawColor(200, 30, 30);
        doc.setLineWidth(1.8);
        doc.circle(stampCenterX, stampCenterY, stampRadius, "S");

        // Inner circle border (double-ring seal effect)
        doc.setLineWidth(0.6);
        doc.circle(stampCenterX, stampCenterY, stampRadius - 3, "S");

        // "DUE" text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(200, 30, 30);
        doc.text("DUE", stampCenterX, stampCenterY + 3, { align: "center" });

        // Decorative lines above and below
        const lineHalfW = 10;
        doc.setLineWidth(0.5);
        doc.line(stampCenterX - lineHalfW, stampCenterY - 7, stampCenterX + lineHalfW, stampCenterY - 7);
        doc.line(stampCenterX - lineHalfW, stampCenterY + 7, stampCenterX + lineHalfW, stampCenterY + 7);

        doc.restoreGraphicsState();

        // Right-side due label + value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(COLORS.lightText);
        doc.text("Due Amount:", tLabelX, tY, { align: "right" });
        doc.setTextColor(220, 38, 38);
        doc.text(`${calculatedDueAmount.toLocaleString()}`, tValX, tY, { align: "right" });
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(22, 128, 61);
        doc.text("PAID", tValX, tY, { align: "right" });
      }

      if (data.remarks) {
        const remarkY = finalY + 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.primary);
        doc.text("Remarks:", margin, remarkY);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.lightText);
        doc.text(doc.splitTextToSize(data.remarks, 90), margin, remarkY + 5);
      }
    }

    // Footer
    const footerY = pageHeight - 30;
    const printTime = formatBDT(new Date(), "d MMM yyyy, h:mm a");
    drawAuditFooter(doc, {
      footerY,
      margin,
      pageWidth,
      leftLabel: "Collected By",
      leftValue: data.createdByName?.trim() || "Unknown",
      timestampLabel: "Printed on",
      timestamp: printTime,
    });

    doc.setTextColor(COLORS.lightText);
    doc.setFontSize(7);
    doc.text(
      "NB: This is a computer generated invoice.",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );
    doc.text(
      "Thank you for choosing HSI Center",
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" },
    );

    drawStatusStamp(doc, isPaid);
  }

  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = pdfUrl;
  } else {
    window.open(pdfUrl, "_blank");
  }
};
