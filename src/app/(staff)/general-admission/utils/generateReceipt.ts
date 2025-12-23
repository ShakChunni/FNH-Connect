/**
 * Admission Receipt Generator
 * Uses jsPDF for consistent receipt generation with PAID/DUE watermark
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdmissionPatientData } from "../types";

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

/**
 * Generate Admission Receipt (Simple - just admission fee)
 */
export const generateAdmissionReceipt = async (
  data: AdmissionPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Draw logo watermark in middle bottom half
  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    const logoSize = 100;
    const logoX = pageWidth / 2 - logoSize / 2;
    // Position in lower half: e.g. 75% down
    const logoY = pageHeight * 0.75 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch (e) {
    // Fail silently
  }

  // --- Header Section ---
  try {
    const logo = await loadImage("/fnh-logo.png");
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
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Receipt Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("ADMISSION FORM", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Receipt # and Date row
  doc.setFontSize(10); // Increased from 9
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);

  const admissionDate = new Date(data.dateAdmitted).toLocaleDateString(
    "en-BD",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  doc.text(`Admission #: ${data.admissionNumber}`, margin, currentY);
  doc.text(`Date: ${admissionDate}`, pageWidth - margin, currentY, {
    align: "right",
  });
  currentY += 12; // Increased from 10

  // --- Patient Details Section (Professional Table Layout) ---
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 6;
  const rowHeight = 6;
  const labelWidth = 28; // Fixed label column width
  const col1Width = contentWidth * 0.5; // Left column takes 50%
  const col2Width = contentWidth * 0.5; // Right column takes 50%
  const col1LabelX = margin + boxPadding;
  const col1ValueX = col1LabelX + labelWidth;
  const col2LabelX = margin + col1Width + boxPadding;
  const col2ValueX = col2LabelX + labelWidth;
  const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
  const valueMaxWidth2 = col2Width - labelWidth - boxPadding * 2;

  // Calculate dynamic box height based on content
  const patientAddr = data.patientAddress || "N/A";
  const complaint = data.chiefComplaint || "N/A";
  const docName = data.doctorName || "N/A";

  doc.setFontSize(10);
  const splitAddr = doc.splitTextToSize(
    patientAddr,
    contentWidth - labelWidth - boxPadding * 2
  );
  const splitComplaint = doc.splitTextToSize(
    complaint,
    contentWidth - 38 - boxPadding * 2
  );
  const splitDocName = doc.splitTextToSize(docName, valueMaxWidth1);

  // Calculate number of rows (5 paired rows + address row + complaint row)
  const numPairedRows = 4; // Patient/Mobile, Age/Dept, Status/Ward, Doctor row
  const addressLines = splitAddr.length;
  const complaintLines = splitComplaint.length;
  const dynamicBoxHeight =
    boxPadding * 2 +
    numPairedRows * rowHeight +
    addressLines * 4 +
    complaintLines * 4 +
    4;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, dynamicBoxHeight, 2, 2, "F");

  // Add subtle border for professional look
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, dynamicBoxHeight, 2, 2, "S");

  let pY = currentY + boxPadding + 3;
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
  doc.text(data.patientPhone || "N/A", col2ValueX, pY);

  // Row 2 - Age/Gender & Department
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Age/Gender:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  const ageDisplay = data.patientAge ? `${data.patientAge} Y` : "N/A";
  doc.text(`${ageDisplay} / ${data.patientGender}`, col1ValueX, pY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Department:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.departmentName || "N/A", col2ValueX, pY);

  // Row 3 - Status & Ward
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Status:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.status || "Admitted", col1ValueX, pY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Ward:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  let wardDisplay = data.ward || "N/A";
  if (data.seatNumber) {
    wardDisplay += ` (Seat: ${data.seatNumber})`;
  }
  doc.text(wardDisplay, col2ValueX, pY);

  // Row 4 - Consultant Doctor (full width for long names)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Consultant:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  // Allow doctor name to span more space - use full row width if needed
  if (splitDocName.length === 1) {
    doc.text(docName, col1ValueX, pY);
  } else {
    // For very long names, wrap to next line
    doc.text(splitDocName[0], col1ValueX, pY);
    if (splitDocName.length > 1) {
      pY += 4;
      doc.text(splitDocName.slice(1).join(" "), col1ValueX, pY);
    }
  }

  // Row 5 - Address (full width)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(splitAddr, col1ValueX, pY);
  pY += (addressLines - 1) * 4;

  // Row 6 - Chief Complaint (full width)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Chief Complaint:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(splitComplaint, col1LabelX + 38, pY);

  currentY += dynamicBoxHeight + 8;

  // --- Prescription Area (Standard Format) ---
  // Vertical Line splitting the page (roughly 30% left / 70% right)
  const leftColWidth = (pageWidth - margin * 2) * 0.35;
  const dividerX = margin + leftColWidth;
  const footerYStart = pageHeight - 40; // Where footer area starts

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(dividerX, currentY, dividerX, footerYStart);

  // Left Column (Blank as requested)

  // Right Column (Rx)
  // Standard Rx Symbol (Smaller)
  doc.setFont("times", "italic");
  doc.setFontSize(20); // Smaller size
  doc.setTextColor(COLORS.primary);
  doc.text("Rx", dividerX + 5, currentY + 12);

  // Rest is blank space for doctor to write

  // --- Footer --- (positioned with enough margin from bottom)
  const footerY = pageHeight - 38;

  // Left side - Prepared By with date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 20, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 20, footerY + 10, { align: "center" });

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

  // Bottom branding
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

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

/**
 * Generate Full Invoice (all charges) with PAID/DUE watermark
 */
export const generateAdmissionInvoice = async (
  data: AdmissionPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Draw subtle logo watermark in center
  await drawLogoWatermark(doc);

  // --- Header Section ---
  try {
    const logo = await loadImage("/fnh-logo.png");
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
  currentY += 7;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10); // Increased from 9
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 9; // Increased from 8

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10; // Increased from 8

  // Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16); // Increased from 14
  doc.setTextColor(COLORS.primary);
  doc.text("PATIENT INVOICE", pageWidth / 2, currentY, { align: "center" });
  currentY += 10; // Increased from 8

  // Invoice # and Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);

  const admissionDate = new Date(data.dateAdmitted).toLocaleDateString(
    "en-BD",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  doc.text(`Admission #: ${data.admissionNumber}`, margin, currentY);
  doc.text(`Date: ${admissionDate}`, pageWidth - margin, currentY, {
    align: "right",
  });
  currentY += 10;

  // --- Patient Details Section (Professional Table Layout) ---
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 6;
  const rowHeight = 6;
  const labelWidth = 28; // Fixed label column width
  const col1Width = contentWidth * 0.5; // Left column takes 50%
  const col2Width = contentWidth * 0.5; // Right column takes 50%
  const col1LabelX = margin + boxPadding;
  const col1ValueX = col1LabelX + labelWidth;
  const col2LabelX = margin + col1Width + boxPadding;
  const col2ValueX = col2LabelX + labelWidth;
  const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
  const valueMaxWidth2 = col2Width - labelWidth - boxPadding * 2;

  // Calculate dynamic box height based on content
  const patientAddrInv = data.patientAddress || "N/A";
  const complaintInv = data.chiefComplaint || "N/A";
  const docNameInv = data.doctorName || "N/A";

  doc.setFontSize(10);
  const splitAddrInv = doc.splitTextToSize(
    patientAddrInv,
    contentWidth - labelWidth - boxPadding * 2
  );
  const splitComplaintInv = doc.splitTextToSize(
    complaintInv,
    contentWidth - 38 - boxPadding * 2
  );
  const splitDocNameInv = doc.splitTextToSize(docNameInv, valueMaxWidth1);

  // Calculate number of rows
  const numPairedRowsInv = 4; // Patient/Mobile, Age/Dept, Status/Ward, Doctor row
  const addressLinesInv = splitAddrInv.length;
  const complaintLinesInv = splitComplaintInv.length;
  const dynamicBoxHeightInv =
    boxPadding * 2 +
    numPairedRowsInv * rowHeight +
    addressLinesInv * 4 +
    complaintLinesInv * 4 +
    4;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(
    margin,
    currentY,
    contentWidth,
    dynamicBoxHeightInv,
    2,
    2,
    "F"
  );

  // Add subtle border for professional look
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(
    margin,
    currentY,
    contentWidth,
    dynamicBoxHeightInv,
    2,
    2,
    "S"
  );

  let pY = currentY + boxPadding + 3;
  doc.setFontSize(10);

  // Row 1 - Patient Name & Mobile Number
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Patient:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  const patientNameInv = data.patientFullName || "N/A";
  doc.text(
    patientNameInv.length > 28
      ? patientNameInv.substring(0, 26) + "..."
      : patientNameInv,
    col1ValueX,
    pY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientPhone || "N/A", col2ValueX, pY);

  // Row 2 - Age/Gender & Department
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Age/Gender:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  const ageDisplayInv = data.patientAge ? `${data.patientAge} Y` : "N/A";
  doc.text(`${ageDisplayInv} / ${data.patientGender}`, col1ValueX, pY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Department:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(data.departmentName || "N/A", col2ValueX, pY);

  // Row 3 - Status & Ward
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Status:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");

  let statusDisplay = data.status || "Admitted";
  if (data.status === "Discharged" && data.dateDischarged) {
    const dischargeDate = new Date(data.dateDischarged).toLocaleDateString(
      "en-BD",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
    statusDisplay += ` (${dischargeDate})`;
  }
  doc.text(statusDisplay, col1ValueX, pY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Ward:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  let wardDisplayInv = data.ward || "N/A";
  if (data.seatNumber) {
    wardDisplayInv += ` (Seat: ${data.seatNumber})`;
  }
  doc.text(wardDisplayInv, col2ValueX, pY);

  // Row 4 - Consultant Doctor (full width for long names)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Consultant:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  // Allow doctor name to span more space - use full row width if needed
  if (splitDocNameInv.length === 1) {
    doc.text(docNameInv, col1ValueX, pY);
  } else {
    // For very long names, wrap to next line
    doc.text(splitDocNameInv[0], col1ValueX, pY);
    if (splitDocNameInv.length > 1) {
      pY += 4;
      doc.text(splitDocNameInv.slice(1).join(" "), col1ValueX, pY);
    }
  }

  // Row 5 - Address (full width)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(splitAddrInv, col1ValueX, pY);
  pY += (addressLinesInv - 1) * 4;

  // Row 6 - Chief Complaint (full width)
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Chief Complaint:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(splitComplaintInv, col1LabelX + 38, pY);

  currentY += dynamicBoxHeightInv + 8;

  // --- Charges Table ---
  const charges = [
    { description: "Admission Fee", amount: data.admissionFee },
    { description: "Service Charge", amount: data.serviceCharge },
    { description: "Room / Seat Rent", amount: data.seatRent },
    { description: "OT Charge", amount: data.otCharge },
    { description: "Doctor Charge", amount: data.doctorCharge || 0 },
    { description: "Surgeon Charge", amount: data.surgeonCharge || 0 },
    { description: "Anesthesia Fee", amount: data.anesthesiaFee || 0 },
    {
      description: "Assistant Doctor Fee",
      amount: data.assistantDoctorFee || 0,
    },
    { description: "Medicine Charge", amount: data.medicineCharge },
    { description: "Other Charges", amount: data.otherCharges },
  ].filter((c) => c.amount > 0);

  const tableRows = charges.map((charge, index) => [
    index + 1,
    charge.description,
    charge.amount.toLocaleString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["SN", "Description", "Amount (BDT)"]],
    body: tableRows,
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
      fontSize: 10, // Increased
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center", fontStyle: "bold", fontSize: 12 }, // Larger SN
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
  const tValX = pageWidth - margin - 5;

  doc.setFontSize(11); // Increased from 9

  // Sub Total
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Sub Total", tLabelX, tY, { align: "right" });
  doc.setTextColor(COLORS.primary);
  doc.text(`${data.totalAmount.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 6; // Adjusted spacing

  // Discount
  if (data.discountAmount && data.discountAmount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.lightText);
    doc.text(
      `Discount${
        data.discountType === "percentage" && data.discountValue
          ? ` (${data.discountValue}%)`
          : ""
      }`,
      tLabelX,
      tY,
      { align: "right" }
    );
    doc.setTextColor(COLORS.primary);
    doc.text(`- ${data.discountAmount.toLocaleString()}`, tValX, tY, {
      align: "right",
    });
    tY += 6; // Adjusted spacing
  }

  // Divider line
  doc.setDrawColor(COLORS.border);
  doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
  tY += 6; // Adjusted spacing

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13); // Increased from 11
  doc.setTextColor(COLORS.primary);
  doc.text("Grand Total:", tLabelX, tY, { align: "right" });
  doc.text(`${data.grandTotal.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 7; // Adjusted spacing

  // Paid
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11); // Increased from 9
  doc.setTextColor(COLORS.lightText);
  doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`${data.paidAmount.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 6; // Adjusted spacing

  // Due Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11); // Increased from 9
  doc.setTextColor(COLORS.lightText);
  doc.text("Due Amount:", tLabelX, tY, { align: "right" });

  if (data.dueAmount > 0) {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`${data.dueAmount.toLocaleString()}`, tValX, tY, {
      align: "right",
    });
  } else {
    doc.setTextColor(22, 163, 74); // Green
    doc.text("FULLY PAID", tValX, tY, { align: "right" });
  }

  // --- Remarks Section ---
  if (data.remarks) {
    const remarkY = finalY + 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text("Remarks:", margin, remarkY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    const splitRemarks = doc.splitTextToSize(data.remarks, 90);
    doc.text(splitRemarks, margin, remarkY + 5);
  }

  // --- Footer --- (positioned with enough margin from bottom)
  const footerY = pageHeight - 38;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 20, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 20, footerY + 10, { align: "center" });

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
  const isInvoicePaid = data.dueAmount <= 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Payment Status", pageWidth - margin - 25, footerY + 5, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(isInvoicePaid ? "#16a34a" : "#dc2626");
  doc.text(
    isInvoicePaid ? "PAID" : "DUE",
    pageWidth - margin - 25,
    footerY + 10,
    {
      align: "center",
    }
  );

  // Bottom branding
  doc.setTextColor(COLORS.lightText);
  doc.setFontSize(7);
  doc.text(
    "NB: This is a computer generated invoice.",
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

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
