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
 * Draw a subtle logo watermark in the center of the page
 * Professional appearance - visible but not distracting
 */
const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 })); // Subtle but visible
    const logoSize = 80; // Larger size for better presence
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight / 2 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch (e) {
    // Silently fail if logo not available
  }
};

export const generatePathologyReceipt = async (
  data: PathologyPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Draw subtle logo watermark in center
  await drawLogoWatermark(doc);

  // --- Header Section ---
  // Centered Header Design

  // Load Logo
  try {
    const logo = await loadImage("/fnh-logo.png");
    // Logo Centered above text
    const logoW = 20;
    const logoH = 20;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, 10, logoW, logoH);
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  let currentY = 35;

  // Hospital Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24); // Increased from 22
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 7; // Increased from 6

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10); // Increased from 9
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 6; // Increased from 5

  // Phone (optional, if you have one)
  // doc.text(`Phone: ${COMPANY_INFO.phone}`, pageWidth / 2, currentY, { align: 'center' });
  // currentY += 8;
  currentY += 2; // spacer

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Receipt Title & Meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("OFFICIAL RECEIPT", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Receipt # and Date row
  doc.setFontSize(10); // Increased from 9
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
  currentY += 12; // Increased from 10

  // --- Patient Details Section (Professional Table Layout) ---
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 6;
  const rowHeight = 7;
  const labelWidth = 28; // Fixed label column width
  const col1Width = contentWidth * 0.5; // Left column takes 50%
  const col2Width = contentWidth * 0.5; // Right column takes 50%
  const col1LabelX = margin + boxPadding;
  const col1ValueX = col1LabelX + labelWidth;
  const col2LabelX = margin + col1Width + boxPadding;
  const col2ValueX = col2LabelX + labelWidth;
  const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
  const valueMaxWidth2 = col2Width - labelWidth - boxPadding * 2;

  // Prepare content
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

  // Calculate Age if missing
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

  // Calculate dynamic box height (3 paired rows + potential wrapping)
  const numPairedRows = 3;
  const addressLines = splitAddr.length;
  const refByLines = splitRefBy.length;
  const extraLines =
    Math.max(0, addressLines - 1) + Math.max(0, refByLines - 1);
  const dynamicBoxHeight =
    boxPadding * 2 + numPairedRows * rowHeight + extraLines * 4 + 4;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, dynamicBoxHeight, 2, 2, "F");

  // Add subtle border for professional look
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, dynamicBoxHeight, 2, 2, "S");

  let pY = currentY + boxPadding + 4;
  doc.setFontSize(10);

  // Row 1 - Patient Name & Mobile Number
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Patient:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  const patientName = data.patientFullName || "N/A";
  doc.text(
    patientName.length > 28
      ? patientName.substring(0, 26) + "..."
      : patientName,
    col1ValueX,
    pY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.mobileNumber || "N/A", col2ValueX, pY);

  // Row 2 - Age/Gender & Guardian
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

  // Row 3 - Referring Doctor & Address
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Referring Dr:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  // Allow referring doctor to wrap if needed
  if (splitRefBy.length === 1) {
    doc.text(refBy, col1ValueX, pY);
  } else {
    doc.text(splitRefBy[0], col1ValueX, pY);
    if (splitRefBy.length > 1) {
      pY += 4;
      doc.text(splitRefBy.slice(1).join(" "), col1ValueX, pY);
    }
  }

  // Reset pY for address on the right side (same row start as Referring Dr)
  const addressStartY = currentY + boxPadding + 4 + rowHeight * 2;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col2LabelX, addressStartY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  // Allow address to wrap if needed
  if (splitAddr.length === 1) {
    doc.text(patientAddr, col2ValueX, addressStartY);
  } else {
    doc.text(splitAddr[0], col2ValueX, addressStartY);
    for (let i = 1; i < splitAddr.length; i++) {
      doc.text(splitAddr[i], col2ValueX, addressStartY + i * 4);
    }
  }

  currentY += dynamicBoxHeight + 12;

  // --- Tests Table ---
  const testCodes = data.testResults?.tests || [];

  const tableRows = testCodes.map((codeOrName: string, index: number) => {
    // Attempt lookup (case insensitive logic if needed, but usually code matches)
    const test =
      PATHOLOGY_TESTS.find((t) => t.code === codeOrName) ||
      PATHOLOGY_TESTS.find((t) => t.name === codeOrName);

    return [
      index + 1,
      test ? test.name : codeOrName, // Full description
      test ? `${test.price.toLocaleString()}` : "-",
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["SN", "Test Description", "Amount (BDT)"]],
    body: tableRows,
    theme: "plain", // We'll style it manually for a "modern" look (like the image provided)
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
      fontSize: 10, // Increased
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

  // --- Totals Section ---
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  let tY = finalY;
  const tLabelX = pageWidth - margin - 50;
  const tValX = pageWidth - margin - 5; // Right aligned margin

  doc.setFontSize(11); // Increased from 9

  // Sub Total
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Sub Total", tLabelX, tY, { align: "right" });
  doc.setTextColor(COLORS.primary);
  doc.text(`${data.testCharge.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 5; // Combact spacing

  // Discount
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

  // Divider line for total
  doc.setDrawColor(COLORS.border);
  doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
  tY += 5;

  // Net Payable
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13); // Increased from 11
  doc.setTextColor(COLORS.primary);
  doc.text("Net Payable:", tLabelX, tY, { align: "right" });
  doc.text(`${data.grandTotal.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 7; // Adjusted spacing

  // Paid
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11); // Increased from 9
  doc.setTextColor(COLORS.lightText);
  doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
  doc.setTextColor(COLORS.primary);
  doc.text(`${data.paidAmount.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 6; // Adjusted spacing

  // Due Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11); // Increased from 9
  doc.text("Due Amount:", tLabelX, tY, { align: "right" });

  if (data.dueAmount > 0) {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`${data.dueAmount.toLocaleString()}`, tValX, tY, {
      align: "right",
    });
  } else {
    doc.setTextColor(22, 163, 74); // Green
    doc.text("PAID", tValX, tY, { align: "right" });
  }

  tY += 10;

  // --- Remarks Section ---
  if (data.remarks) {
    const remarkY = finalY + 5;
    // Or below totals if space permits. Let's put it on the left side of totals.

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text("Remarks / Clinical Notes:", margin, remarkY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    const splitRemarks = doc.splitTextToSize(data.remarks, 90); // 100 width limit to not hit totals
    doc.text(splitRemarks, margin, remarkY + 5);
  }

  // --- Footer --- (positioned with enough margin from bottom)
  const footerY = pageHeight - 38;

  // Prepared By (No Line)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 20, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 20, footerY + 10, { align: "center" });

  // Print Time
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
  doc.text(printTime, margin + 20, footerY + 14, { align: "center" });

  // Right Side - Payment Status (Subtle)
  const isPaid = data.dueAmount <= 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Payment Status", pageWidth - margin - 25, footerY + 5, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(isPaid ? "#16a34a" : "#dc2626");
  doc.text(isPaid ? "PAID" : "DUE", pageWidth - margin - 25, footerY + 10, {
    align: "center",
  });

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

  // Save
  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
