import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityTestData } from "../types";
import { PATHOLOGY_TESTS } from "../../pathology/constants/pathologyTests";

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
  email: "Email: firozanursinghome@gmail.com",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
  department: "HSI Center",
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
 * Draw a subtle logo watermark
 */
const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/hsi-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
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

export const generateInfertilityTestReceipt = async (
  data: InfertilityTestData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const isPaid = Number(data.dueAmount) <= 0;

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

    await drawLogoWatermark(doc);

    let currentY = 10;

    if (isFirstPage) {
      // Header
      try {
        const logo = await loadImage("/hsi-logo.png");
        const logoW = 20;
        const logoH = 20;
        const logoX = pageWidth / 2 - logoW / 2;
        doc.addImage(logo, "PNG", logoX, currentY, logoW, logoH);
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
      doc.text(`${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`, pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.accent);
      doc.text(COMPANY_INFO.department, pageWidth / 2, currentY, { align: "center" });
      currentY += 6;

      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.primary);
      doc.text("HSI CENTER INVESTIGATION INVOICE", pageWidth / 2, currentY, { align: "center" });
      currentY += 6;

      // Receipt # and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary);
      doc.text(`#${data.testNumber}`, margin, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      const testDate = new Date(data.testDate).toLocaleDateString("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, "F");
      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, "S");

      let pY = currentY + boxPadding + 3;

      doc.setFont("helvetica", "bold");
      doc.text("Patient:", col1X, pY);
      doc.setFont("helvetica", "normal");
      doc.text(data.patientFullName || "N/A", col1ValX, pY);

      doc.setFont("helvetica", "bold");
      doc.text("Case #:", col2X, pY);
      doc.setFont("helvetica", "normal");
      doc.text(data.caseNumber || "N/A", col2ValX, pY);

      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.text("Subject:", col1X, pY);
      doc.setFont("helvetica", "normal");
      doc.text(
        data.subjectName
          ? `${data.subjectLabel} - ${data.subjectName}`
          : data.subjectLabel,
        col1ValX,
        pY,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Mobile:", col2X, pY);
      doc.setFont("helvetica", "normal");
      doc.text(data.mobileNumber || "N/A", col2ValX, pY);

      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.text("Age/Gender:", col1X, pY);
      doc.setFont("helvetica", "normal");
      const age = data.patientAge ? `${data.patientAge}Y` : "N/A";
      doc.text(`${age} / ${data.patientGender || "N/A"}`, col1ValX, pY);

      doc.setFont("helvetica", "bold");
      doc.text("Ordered By:", col2X, pY);
      doc.setFont("helvetica", "normal");
      doc.text(data.orderedBy || "Self", col2ValX, pY);

      currentY += 31;
    } else {
      // Continuation Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary);
      doc.text(COMPANY_INFO.name, pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Investigation Invoice: ${data.testNumber} - Page ${pageIndex + 1} of ${totalPages}`, pageWidth / 2, currentY + 12, { align: "center" });
      currentY += 20;
    }

    // Table
    autoTable(doc, {
      startY: currentY,
      head: [["#", "Investigation", "Amount (BDT)"]],
      body: currentChunk,
      theme: "plain",
      headStyles: { fillColor: COLORS.primary, textColor: 255, fontStyle: "bold" },
      bodyStyles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });

    if (isLastPage) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      let tY = finalY;
      const tLabelX = pageWidth - margin - 50;
      const tValX = pageWidth - margin - 5;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Sub Total", tLabelX, tY, { align: "right" });
      doc.text(`${Number(data.testCharge).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 6;

      if (data.discountAmount && Number(data.discountAmount) > 0) {
        doc.setFont("helvetica", "normal");
        doc.text("Discount", tLabelX, tY, { align: "right" });
        doc.text(`- ${Number(data.discountAmount).toLocaleString()}`, tValX, tY, { align: "right" });
        tY += 6;
      }

      doc.setDrawColor(COLORS.border);
      doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Net Total:", tLabelX, tY, { align: "right" });
      doc.text(`${Number(data.grandTotal).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 7;

      doc.setFontSize(11);
      doc.text("Paid:", tLabelX, tY, { align: "right" });
      doc.setTextColor(22, 128, 61);
      doc.text(`${Number(data.paidAmount).toLocaleString()}`, tValX, tY, { align: "right" });
      tY += 6;

      if (Number(data.dueAmount) > 0) {
        // DUE STAMP
        const stampRadius = 18;
        const stampX = margin + stampRadius + 8;
        const stampY = finalY + stampRadius + 2;
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.85 }));
        doc.setDrawColor(200, 30, 30);
        doc.setLineWidth(1.8);
        doc.circle(stampX, stampY, stampRadius, "S");
        doc.setFontSize(24);
        doc.setTextColor(200, 30, 30);
        doc.text("DUE", stampX, stampY + 3, { align: "center" });
        doc.restoreGraphicsState();

        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("Due Amount:", tLabelX, tY, { align: "right" });
        doc.text(`${Number(data.dueAmount).toLocaleString()}`, tValX, tY, { align: "right" });
      } else {
        doc.setTextColor(22, 128, 61);
        doc.text("PAID", tValX, tY, { align: "right" });
      }

      if (data.remarks) {
        const remarkY = finalY + 5;
        doc.setFontSize(9);
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
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    doc.text("Processed By", margin, footerY);
    doc.setFont("helvetica", "bold");
    doc.text(printedBy, margin, footerY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString("en-BD")}`, margin, footerY + 10);

    doc.text("NB: Computer generated invoice.", pageWidth / 2, pageHeight - 10, { align: "center" });
    drawStatusStamp(doc, isPaid);
  }

  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  window.open(URL.createObjectURL(pdfBlob), "_blank");
};
