/**
 * Admission Receipt Generator
 * Uses jsPDF for consistent receipt generation with PAID/DUE watermark
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdmissionPatientData } from "../types";

// FNH Brand Colors
const COLORS = {
  primary: "#020617", // darker navy
  accent: "#1d4ed8",
  text: "#000000", // pure black for contrast
  lightText: "#1a202c", // much darker gray
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  email: "Email: firozanursinghome@gmail.com",
  phone: "Mobile: 01712-345678",
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

/**
 * Generate Admission Receipt (Simple - just admission fee)
 * This is a single-page form with prescription area
 */
export const generateAdmissionReceipt = async (
  data: AdmissionPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const isPaid = data.dueAmount <= 0;

  // Draw subtle logo watermark in bottom half
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

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Receipt Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("ADMISSION FORM", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Receipt # and Date row
  doc.setFontSize(10);

  // Admission # (Bold & Primary)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(`#${data.admissionNumber}`, margin, currentY);

  // Date (Normal & Text Color)
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

  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  doc.text(`Date: ${admissionDate}`, pageWidth - margin, currentY, {
    align: "right",
  });
  currentY += 8;

  // --- Patient Details Section ---
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 4;
  const rowHeight = 5.5;
  const labelWidth = 26;
  const col1Width = contentWidth * 0.5;
  const col1LabelX = margin + boxPadding;
  const col1ValueX = col1LabelX + labelWidth;
  const col2LabelX = margin + col1Width + boxPadding;
  const col2ValueX = col2LabelX + labelWidth;

  const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
  const valueMaxWidth2 = contentWidth * 0.5 - labelWidth - boxPadding * 2;

  // Calculate dynamic box height based on content
  const patientAddr = data.patientAddress || "N/A";
  const complaint = data.chiefComplaint || "N/A";
  const docName = data.doctorName || "N/A";

  doc.setFontSize(10);
  // Split Doctor Name
  const splitDocName = doc.splitTextToSize(docName, valueMaxWidth1);
  // Split Address (now in col2)
  const splitAddr = doc.splitTextToSize(patientAddr, valueMaxWidth2);
  // Split Complaint
  const splitComplaint = doc.splitTextToSize(
    complaint,
    contentWidth - 38 - boxPadding * 2
  );

  // Rows:
  // 1. Patient | Mobile
  // 2. Age/Gender | Dept
  // 3. Status | Ward
  // 4. Consultant | Address (Merged)
  // 5. Chief Complaint

  const numFixedRows = 4; // Patient, Age/Gender, Status, Consultant/Address
  const dynamicBoxHeight =
    boxPadding * 2 +
    numFixedRows * rowHeight +
    Math.max(0, splitAddr.length - 1) * (rowHeight - 1.5) + // extra height for address
    Math.max(0, splitDocName.length - 1) * (rowHeight - 1.5) + // extra height for doc
    splitComplaint.length * (rowHeight - 1.5) + // for chief complaint
    (rowHeight - 1.5); // for the chief complaint row itself

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, dynamicBoxHeight, 2, 2, "F");

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

  // Row 4 - Consultant (Left) | Address (Right)
  pY += rowHeight;

  // Consultant
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Consultant:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");

  let docY = pY;
  if (splitDocName.length === 1) {
    doc.text(docName, col1ValueX, pY);
  } else {
    doc.text(splitDocName[0], col1ValueX, pY);
    if (splitDocName.length > 1) {
      docY += rowHeight - 1.5;
      doc.text(splitDocName.slice(1).join(" "), col1ValueX, docY);
    }
  }

  // Address
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col2LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");

  let addrY = pY;
  if (splitAddr.length === 1) {
    doc.text(patientAddr, col2ValueX, pY);
  } else {
    doc.text(splitAddr[0], col2ValueX, pY);
    for (let j = 1; j < splitAddr.length; j++) {
      addrY += rowHeight - 1.5;
      doc.text(splitAddr[j], col2ValueX, addrY);
    }
  }

  pY = Math.max(docY, addrY);

  // Row 5 - Chief Complaint
  pY += rowHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Chief Complaint:", col1LabelX, pY);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "normal");
  doc.text(splitComplaint, col1LabelX + 38, pY);

  currentY += dynamicBoxHeight + 6;

  // --- Prescription Area ---
  const leftColWidth = (pageWidth - margin * 2) * 0.35;
  const dividerX = margin + leftColWidth;
  const footerYStart = pageHeight - 40;

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(dividerX, currentY, dividerX, footerYStart);

  // Rx Symbol
  doc.setFont("times", "italic");
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.text("Rx", dividerX + 5, currentY + 12);

  // --- Footer ---
  const footerY = pageHeight - 38;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Form Generated By", margin, footerY + 5);

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
 * Supports multi-page with continuation
 */
export const generateAdmissionInvoice = async (
  data: AdmissionPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const isPaid = data.dueAmount <= 0;

  // Prepare all table rows
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

  const allTableRows = charges.map((charge, index) => [
    index + 1,
    charge.description,
    charge.amount.toLocaleString(),
  ]);

  // Chunk rows: first page max 8, continuation pages max 12
  // Chunk rows: increased per page
  // Chunk rows: increased per page
  const firstPageMax = 13;
  const continuationMax = 20;
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
      currentY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.lightText);
      doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 4;
      doc.text(
        `${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`,
        pageWidth / 2,
        currentY,
        {
          align: "center",
        }
      );
      currentY += 5;

      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(COLORS.primary);
      doc.text("INVOICE", pageWidth / 2, currentY, { align: "center" });
      currentY += 6;

      // Invoice # and Date
      doc.setFontSize(9);

      // Admission # (Bold & Primary)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary);
      doc.text(`#${data.admissionNumber}`, margin, currentY);

      // Date (Normal & Text Color)
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      const admissionDate = new Date(data.dateAdmitted).toLocaleDateString(
        "en-BD",
        { day: "numeric", month: "short", year: "numeric" }
      );
      doc.text(`Date: ${admissionDate}`, pageWidth - margin, currentY, {
        align: "right",
      });
      currentY += 7;

      // Patient Details Box
      const contentWidth = pageWidth - margin * 2;
      const boxPadding = 4;
      const rowHeight = 5.5;
      const labelWidth = 26;
      const col1Width = contentWidth * 0.5;
      const col1LabelX = margin + boxPadding;
      const col1ValueX = col1LabelX + labelWidth;
      const col2LabelX = margin + col1Width + boxPadding;
      const col2ValueX = col2LabelX + labelWidth;

      const valueMaxWidth1 = col1Width - labelWidth - boxPadding * 2;
      const valueMaxWidth2 = contentWidth * 0.5 - labelWidth - boxPadding * 2;

      const patientAddrInv = data.patientAddress || "N/A";
      const complaintInv = data.chiefComplaint || "N/A";
      const docNameInv = data.doctorName || "N/A";

      doc.setFontSize(10);
      // For Consultant (split if needed)
      const splitDocNameInv = doc.splitTextToSize(docNameInv, valueMaxWidth1);
      // For Address (in col2 now)
      const splitAddrInv = doc.splitTextToSize(patientAddrInv, valueMaxWidth2);
      // For Complaint
      const splitComplaintInv = doc.splitTextToSize(
        complaintInv,
        contentWidth - 38 - boxPadding * 2
      );

      // Rows:
      // 1. Patient | Mobile
      // 2. Age/Gender | Dept
      // 3. Status | Ward
      // 4. Consultant | Address (Merged row)
      // 5. Chief Complaint

      const numFixedRowsInv = 4;
      const dynamicBoxHeightInv =
        boxPadding * 2 +
        numFixedRowsInv * rowHeight +
        Math.max(0, splitAddrInv.length - 1) * (rowHeight - 1.5) + // extra height for address
        Math.max(0, splitDocNameInv.length - 1) * (rowHeight - 1.5) + // extra height for doc
        splitComplaintInv.length * (rowHeight - 1.5) +
        (rowHeight - 1.5);

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

      // Row 1
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Patient:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      const patientNameInv = data.patientFullName || "N/A";
      doc.text(
        patientNameInv.length > 28
          ? patientNameInv.substring(0, 26) + "..."
          : patientNameInv,
        col1ValueX,
        pY
      );
      doc.setTextColor(COLORS.lightText);
      doc.text("Mobile:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      doc.text(data.patientPhone || "N/A", col2ValueX, pY);

      // Row 2
      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Age/Gender:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      const ageDisplayInv = data.patientAge ? `${data.patientAge} Y` : "N/A";
      doc.text(`${ageDisplayInv} / ${data.patientGender}`, col1ValueX, pY);
      doc.setTextColor(COLORS.lightText);
      doc.text("Department:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.text(data.departmentName || "N/A", col2ValueX, pY);

      // Row 3
      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Status:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      let statusDisplay = data.status || "Admitted";
      if (data.status === "Discharged" && data.dateDischarged) {
        statusDisplay += ` (${new Date(data.dateDischarged).toLocaleDateString(
          "en-BD",
          { day: "numeric", month: "short", year: "numeric" }
        )})`;
      }
      doc.text(statusDisplay, col1ValueX, pY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Ward:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      let wardDisplayInv = data.ward || "N/A";
      if (data.seatNumber) wardDisplayInv += ` (Seat: ${data.seatNumber})`;
      doc.text(wardDisplayInv, col2ValueX, pY);

      // Row 4: Consultant (Left) | Address (Right)
      pY += rowHeight;
      const rowStartY = pY;

      // Consultant
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Consultant:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");

      let docY = pY;
      if (splitDocNameInv.length === 1) {
        doc.text(docNameInv, col1ValueX, pY);
      } else {
        doc.text(splitDocNameInv[0], col1ValueX, pY);
        // Multiline support for doctor name
        if (splitDocNameInv.length > 1) {
          docY += rowHeight - 1.5;
          doc.text(splitDocNameInv.slice(1).join(" "), col1ValueX, docY);
        }
      }

      // Address
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Address:", col2LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");

      let addrY = pY;
      if (splitAddrInv.length === 1) {
        doc.text(patientAddrInv, col2ValueX, pY);
      } else {
        doc.text(splitAddrInv[0], col2ValueX, pY);
        // Multiline address
        for (let j = 1; j < splitAddrInv.length; j++) {
          addrY += rowHeight - 1.5;
          doc.text(splitAddrInv[j], col2ValueX, addrY);
        }
      }

      // Adjust pY to the greater of the two heights for next row
      pY = Math.max(docY, addrY);

      // Row 5: Reference / Chief Complaint
      pY += rowHeight;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text("Chief Complaint:", col1LabelX, pY);
      doc.setTextColor(COLORS.primary);
      doc.setFont("helvetica", "normal");
      doc.text(splitComplaintInv, col1LabelX + 38, pY);

      currentY += dynamicBoxHeightInv + 6;
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
        `Invoice #: ${data.admissionNumber} - Page ${
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
      head: [[isFirstPage ? "SN" : "#", "Description", "Amount (BDT)"]],
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
        cellPadding: 3, // tighter
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
      doc.text(`${data.totalAmount.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 6;

      if (data.discountAmount && data.discountAmount > 0) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.lightText);
        doc.text(
          `Discount${
            data.discountType === "percentage"
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
        tY += 6;
      }

      doc.setDrawColor(COLORS.border);
      doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(COLORS.primary);
      doc.text("Grand Total:", tLabelX, tY, { align: "right" });
      doc.text(`${data.grandTotal.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(COLORS.lightText);
      doc.text("Paid Amount:", tLabelX, tY, { align: "right" });
      doc.setTextColor(22, 163, 74);
      doc.text(`${data.paidAmount.toLocaleString()}`, tValX, tY, {
        align: "right",
      });
      tY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLORS.lightText);
      doc.text("Due Amount:", tLabelX, tY, { align: "right" });

      if (data.dueAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`${data.dueAmount.toLocaleString()}`, tValX, tY, {
          align: "right",
        });
      } else {
        doc.setTextColor(22, 163, 74);
        doc.text("FULLY PAID", tValX, tY, { align: "right" });
      }

      // Remarks
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
    }

    // === FOOTER (All Pages) ===
    const footerY = pageHeight - 38;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    doc.text("Invoice Created By", margin, footerY + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text(printedBy, margin, footerY + 10);

    const printTimeInv = new Date().toLocaleString("en-BD", {
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
    doc.text(`Generated on: ${printTimeInv}`, margin, footerY + 14);

    // Bottom Center Branding
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

    // Status Stamp (Circle)
    drawStatusStamp(doc, isPaid);
  }

  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
