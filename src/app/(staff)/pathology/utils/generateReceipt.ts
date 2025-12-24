import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PathologyPatientData } from "../types";
import { PATHOLOGY_TESTS } from "../constants/pathologyTests";

// FNH Brand Colors
const COLORS = {
  primary: "#1e293b", // fnh-navy (header)
  accent: "#3b82f6", // fnh-blue
  text: "#334155", // slate-700
  lightText: "#64748b",
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "01712-345678",
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
    const logo = await loadImage("/fnh-logo.png");
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
 * Draw a subtle status indicator
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

export const generatePathologyReceipt = async (
  data: PathologyPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const isPaid = data.dueAmount <= 0;

  // Prepare all table rows
  const testCodes = data.testResults?.tests || [];
  const allTableRows = testCodes.map((codeOrName: string, index: number) => {
    const test =
      PATHOLOGY_TESTS.find((t) => t.code === codeOrName) ||
      PATHOLOGY_TESTS.find((t) => t.name === codeOrName);
    return [
      index + 1,
      test ? test.name : codeOrName,
      test ? `${test.price.toLocaleString()}` : "-",
    ];
  });

  // Chunk rows: first page max 8, continuation pages max 12
  const firstPageMax = 8;
  const continuationMax = 12;
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

    // Watermark on all pages
    await drawLogoWatermark(doc);

    let currentY = 10;

    if (isFirstPage) {
      // === FIRST PAGE: Full Header + Patient Info ===
      try {
        const logo = await loadImage("/fnh-logo.png");
        const logoW = 20;
        const logoH = 20;
        const logoX = pageWidth / 2 - logoW / 2;
        doc.addImage(logo, "PNG", logoX, currentY, logoW, logoH);
      } catch (e) {}

      currentY = 35;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(COLORS.primary);
      doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
      currentY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.lightText);
      doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 8;

      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.primary);
      doc.text("OFFICIAL RECEIPT", pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 8;

      // Receipt # and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      const requestDate = new Date(data.testDate).toLocaleDateString("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Receipt #: ${data.testNumber}`, margin, currentY);
      doc.text(`Date: ${requestDate}`, pageWidth - margin, currentY, {
        align: "right",
      });
      currentY += 12;

      // Patient Details Box
      const contentWidth = pageWidth - margin * 2;
      const boxPadding = 6;
      const rowHeight = 7;
      const labelWidth = 28;
      const col1Width = contentWidth * 0.5;
      const col1LabelX = margin + boxPadding;
      const col1ValueX = col1LabelX + labelWidth;
      const col2LabelX = margin + col1Width + boxPadding;
      const col2ValueX = col2LabelX + labelWidth;
      const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
      const valueMaxWidth2 = contentWidth * 0.5 - labelWidth - boxPadding * 2;

      const patientAddr = data.address || "N/A";
      let refBy = "Self";
      if (
        data.orderedBy &&
        data.orderedBy.trim() !== "" &&
        data.orderedBy.toLowerCase() !== "self"
      ) {
        refBy = data.orderedBy;
      }

      doc.setFontSize(10);
      const splitAddr = doc.splitTextToSize(patientAddr, valueMaxWidth2);
      const splitRefBy = doc.splitTextToSize(refBy, valueMaxWidth1);

      let ageDisplay = "N/A";
      if (data.patientAge) {
        ageDisplay = `${data.patientAge} Y`;
      } else if (data.patientDOB) {
        const dob = new Date(data.patientDOB);
        if (!isNaN(dob.getTime())) {
          const diff = Date.now() - dob.getTime();
          const ageDate = new Date(diff);
          ageDisplay = `${Math.abs(ageDate.getUTCFullYear() - 1970)} Y`;
        }
      }

      const numPairedRows = 3;
      const extraLines =
        Math.max(0, splitAddr.length - 1) + Math.max(0, splitRefBy.length - 1);
      const dynamicBoxHeight =
        boxPadding * 2 + numPairedRows * rowHeight + extraLines * 4 + 4;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(
        margin,
        currentY,
        contentWidth,
        dynamicBoxHeight,
        2,
        2,
        "F"
      );
      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(
        margin,
        currentY,
        contentWidth,
        dynamicBoxHeight,
        2,
        2,
        "S"
      );

      let pY = currentY + boxPadding + 4;

      // Row 1
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Patient:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      const patientName = data.patientFullName || "N/A";
      doc.text(
        patientName.length > 28
          ? patientName.substring(0, 26) + "..."
          : patientName,
        col1ValueX,
        pY
      );
      doc.setTextColor(COLORS.lightText);
      doc.text("Mobile:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      doc.text(data.mobileNumber || "N/A", col2ValueX, pY);

      // Row 2
      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Age/Gender:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      doc.text(`${ageDisplay} / ${data.patientGender}`, col1ValueX, pY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Guardian:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      const guardianName = data.guardianName || "N/A";
      doc.text(
        guardianName.length > 25
          ? guardianName.substring(0, 23) + "..."
          : guardianName,
        col2ValueX,
        pY
      );

      // Row 3
      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Referring Dr:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      if (splitRefBy.length === 1) {
        doc.text(refBy, col1ValueX, pY);
      } else {
        doc.text(splitRefBy[0], col1ValueX, pY);
        if (splitRefBy.length > 1) {
          pY += 4;
          doc.text(splitRefBy.slice(1).join(" "), col1ValueX, pY);
        }
      }

      const addressStartY = currentY + boxPadding + 4 + rowHeight * 2;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Address:", col2LabelX, addressStartY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      if (splitAddr.length === 1) {
        doc.text(patientAddr, col2ValueX, addressStartY);
      } else {
        doc.text(splitAddr[0], col2ValueX, addressStartY);
        for (let j = 1; j < splitAddr.length; j++) {
          doc.text(splitAddr[j], col2ValueX, addressStartY + j * 4);
        }
      }

      currentY += dynamicBoxHeight + 8;
    } else {
      // === CONTINUATION PAGE: Simple header ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary);
      doc.text(COMPANY_INFO.name, pageWidth / 2, currentY + 5, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.lightText);
      doc.text(
        `Receipt #: ${data.testNumber} - Page ${
          pageIndex + 1
        } of ${totalPages}`,
        pageWidth / 2,
        currentY + 12,
        { align: "center" }
      );
      currentY += 20;
    }

    // === TABLE ===
    autoTable(doc, {
      startY: currentY,
      head: [[isFirstPage ? "SN" : "#", "Test Description", "Amount (BDT)"]],
      body: currentChunk,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "left",
        cellPadding: 5,
      },
      bodyStyles: {
        textColor: COLORS.text,
        cellPadding: 4,
        fontSize: 10,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold", fontSize: 12 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
    });

    // === TOTALS (Last Page Only) ===
    if (isLastPage) {
      const finalY = (doc as any).lastAutoTable.finalY + 5;
      let tY = finalY;
      const tLabelX = pageWidth - margin - 50;
      const tValX = pageWidth - margin - 5;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Sub Total", tLabelX, tY, { align: "right" });
      doc.setTextColor(COLORS.primary);
      doc.text(`${data.testCharge.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 5;

      if (data.discountAmount && data.discountAmount > 0) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.lightText);
        doc.text("Discount", tLabelX, tY, { align: "right" });
        doc.setTextColor(COLORS.primary);
        doc.text(`- ${data.discountAmount.toLocaleString()}`, tValX, tY, {
          align: "right",
        });
        tY += 5;
      }

      doc.setDrawColor(COLORS.border);
      doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
      tY += 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(COLORS.primary);
      doc.text("Net Payable:", tLabelX, tY, { align: "right" });
      doc.text(`${data.grandTotal.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(COLORS.lightText);
      doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
      doc.setTextColor(COLORS.primary);
      doc.text(`${data.paidAmount.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Due Amount:", tLabelX, tY, { align: "right" });

      if (data.dueAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`${data.dueAmount.toLocaleString()}`, tValX, tY, {
          align: "right",
        });
      } else {
        doc.setTextColor(22, 163, 74);
        doc.text("PAID", tValX, tY, { align: "right" });
      }

      // Remarks
      if (data.remarks) {
        const remarkY = finalY + 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.primary);
        doc.text("Remarks / Clinical Notes:", margin, remarkY);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.lightText);
        const splitRemarks = doc.splitTextToSize(data.remarks, 90);
        doc.text(splitRemarks, margin, remarkY + 5);
      }
    }

    // === FOOTER (All Pages) ===
    const footerY = pageHeight - 38;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    doc.text("Report Created By", margin, footerY + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text(printedBy, margin, footerY + 10);

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
    doc.text(`Generated on: ${printTime}`, margin, footerY + 14);

    // Bottom Center Branding
    doc.setTextColor(COLORS.lightText);
    doc.setFontSize(7);
    doc.text(
      "NB: This is a computer generated receipt.",
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

    // Status Stamp (Circle)
    drawStatusStamp(doc, isPaid);
  }

  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
