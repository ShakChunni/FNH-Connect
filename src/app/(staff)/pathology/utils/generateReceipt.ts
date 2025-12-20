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

export const generatePathologyReceipt = async (
  data: PathologyPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

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
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 5;

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
  doc.setFontSize(9);
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
  currentY += 10;

  // --- Patient Details Section ---
  // Background box for patient details
  const boxHeight = 35;
  doc.setFillColor(248, 250, 252); // Very light gray/blue
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    boxHeight,
    2,
    2,
    "F"
  );

  const pY = currentY + 6;
  const col1X = margin + 5;
  const labelXOffset = 25; // width of label
  const col2X = pageWidth / 2 + 5;

  doc.setFontSize(9);

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Patient Name:", col1X, pY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientFullName, col1X + labelXOffset, pY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Patient ID:", col2X, pY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.patientId ? data.patientId.toString() : "N/A",
    col2X + labelXOffset,
    pY
  );

  // Row 2
  const pY2 = pY + 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Age / Gender:", col1X, pY2);
  doc.setTextColor(COLORS.primary);

  // Calculate Age if missing
  let ageDisplay = "N/A";
  if (data.patientAge) {
    ageDisplay = `${data.patientAge} Y`;
  } else if (data.patientDOB || data.patientDOB) {
    // Try to calc from DOB
    const dob = data.patientDOB ? new Date(data.patientDOB) : null;
    if (dob) {
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      ageDisplay = `${Math.abs(ageDate.getUTCFullYear() - 1970)} Y`;
    }
  }

  doc.text(`${ageDisplay} / ${data.patientGender}`, col1X + labelXOffset, pY2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile No:", col2X, pY2);
  doc.setTextColor(COLORS.primary);
  doc.text(data.mobileNumber || "N/A", col2X + labelXOffset, pY2);

  // Row 3
  const pY3 = pY2 + 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Referred By:", col1X, pY3);
  doc.setTextColor(COLORS.primary);

  let refBy = data.orderedBy || "Self";
  // Wrap text if needed, simplest is to truncate for receipts or let it overlap if short enough
  // doc.text handles simple overflow by just printing
  if (refBy.length > 35) {
    doc.setFontSize(8); // Shrink slightly for long names
  }
  doc.text(refBy, col1X + labelXOffset, pY3);
  doc.setFontSize(9); // Reset

  // Address (Optional Row 4 or condensed)
  // Let's add address if available below name or just skip to save vertical space
  // User asked for "Doctors name visible fully" - we gave it full row width mostly.

  currentY += boxHeight + 10;

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
      cellPadding: 4, // Tighter header
    },
    bodyStyles: {
      textColor: COLORS.text,
      cellPadding: 2, // Tighter rows
      fontSize: 9,
      valign: "middle", // Vertical align middle
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
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

  doc.setFontSize(9);

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
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Net Payable:", tLabelX, tY, { align: "right" });
  doc.text(`${data.grandTotal.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 6;

  // Paid
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
  doc.setTextColor(COLORS.primary);
  doc.text(`${data.paidAmount.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 5;

  // Due Amount
  doc.setFont("helvetica", "bold");
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

  // --- Footer ---
  const footerY = pageHeight - 35;

  // Prepared By (No Line)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 15, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 15, footerY + 10, { align: "center" });

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
  doc.text(printTime, margin + 15, footerY + 14, { align: "center" });

  // Right Side Signature (Authorized) WITH Line
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 55, footerY, pageWidth - margin - 5, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  doc.text("Authorized Signature", pageWidth - margin - 30, footerY + 5, {
    align: "center",
  });

  // Bottom Center Branding
  doc.setTextColor(COLORS.lightText);
  doc.setFontSize(7);
  doc.text(
    "NB: This is a computer generated receipt.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );
  doc.text(
    "Thank you for choosing Feroza Nursing Home",
    pageWidth / 2,
    pageHeight - 11,
    { align: "center" }
  );

  // Save
  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
