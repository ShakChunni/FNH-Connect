/**
 * Admission Receipt Generator
 * Uses jsPDF like pathology for consistent receipt generation
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
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Receipt Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("ADMISSION RECEIPT", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Receipt # and Date row
  doc.setFontSize(9);
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
  currentY += 10;

  // --- Patient Details Section ---
  const boxHeight = 42;
  doc.setFillColor(248, 250, 252);
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
  const labelXOffset = 30;
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
  const ageDisplay = data.patientAge ? `${data.patientAge} Y` : "N/A";
  doc.text(`${ageDisplay} / ${data.patientGender}`, col1X + labelXOffset, pY2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile No:", col2X, pY2);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientPhone || "N/A", col2X + labelXOffset, pY2);

  // Row 3
  const pY3 = pY2 + 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Department:", col1X, pY3);
  doc.setTextColor(COLORS.primary);
  doc.text(data.departmentName, col1X + labelXOffset, pY3);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Doctor:", col2X, pY3);
  doc.setTextColor(COLORS.primary);
  doc.text(data.doctorName || "N/A", col2X + labelXOffset, pY3);

  // Row 4 - Hospital
  const pY4 = pY3 + 8;
  if (data.hospitalName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.lightText);
    doc.text("Referred From:", col1X, pY4);
    doc.setTextColor(COLORS.primary);
    doc.text(data.hospitalName, col1X + labelXOffset, pY4);
  }

  currentY += boxHeight + 10;

  // --- Admission Fee Section ---
  doc.setDrawColor(COLORS.border);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text("Admission Fee:", margin, currentY);
  doc.text(
    `BDT ${data.admissionFee.toLocaleString()}`,
    pageWidth - margin,
    currentY,
    {
      align: "right",
    }
  );

  // --- Footer ---
  const footerY = pageHeight - 35;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 15, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 15, footerY + 10, { align: "center" });

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

  // Right Side Signature
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 55, footerY, pageWidth - margin - 5, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  doc.text("Authorized Signature", pageWidth - margin - 30, footerY + 5, {
    align: "center",
  });

  // Bottom branding
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

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

/**
 * Generate Full Invoice (all charges)
 */
export const generateAdmissionInvoice = async (
  data: AdmissionPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

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
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // Divider Line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text("PATIENT INVOICE", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

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

  // --- Patient Details Section ---
  const boxHeight = 35;
  doc.setFillColor(248, 250, 252);
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
  const labelXOffset = 25;
  const col2X = pageWidth / 2 + 5;

  doc.setFontSize(9);

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Patient:", col1X, pY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientFullName, col1X + labelXOffset, pY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Department:", col2X, pY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.departmentName, col2X + labelXOffset, pY);

  // Row 2
  const pY2 = pY + 8;
  doc.setTextColor(COLORS.lightText);
  doc.text("Doctor:", col1X, pY2);
  doc.setTextColor(COLORS.primary);
  doc.text(data.doctorName, col1X + labelXOffset, pY2);

  if (data.seatNumber) {
    doc.setTextColor(COLORS.lightText);
    doc.text("Room/Seat:", col2X, pY2);
    doc.setTextColor(COLORS.primary);
    doc.text(data.seatNumber, col2X + labelXOffset, pY2);
  }

  // Row 3
  const pY3 = pY2 + 8;
  doc.setTextColor(COLORS.lightText);
  doc.text("Status:", col1X, pY3);
  doc.setTextColor(COLORS.primary);
  doc.text(data.status, col1X + labelXOffset, pY3);

  currentY += boxHeight + 8;

  // --- Charges Table ---
  const charges = [
    { description: "Admission Fee", amount: data.admissionFee },
    { description: "Service Charge", amount: data.serviceCharge },
    { description: "Room / Seat Rent", amount: data.seatRent },
    { description: "OT Charge", amount: data.otCharge },
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
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: COLORS.text,
      cellPadding: 3,
      fontSize: 9,
      valign: "middle",
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
  const tValX = pageWidth - margin - 5;

  doc.setFontSize(9);

  // Sub Total
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Sub Total", tLabelX, tY, { align: "right" });
  doc.setTextColor(COLORS.primary);
  doc.text(`${data.totalAmount.toLocaleString()}`, tValX, tY, {
    align: "right",
  });
  tY += 5;

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
    tY += 5;
  }

  // Divider line
  doc.setDrawColor(COLORS.border);
  doc.line(tLabelX - 5, tY, pageWidth - margin, tY);
  tY += 5;

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Grand Total:", tLabelX, tY, { align: "right" });
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

  // --- Footer ---
  const footerY = pageHeight - 35;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 15, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 15, footerY + 10, { align: "center" });

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

  // Right Side Signature
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 55, footerY, pageWidth - margin - 5, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  doc.text("Authorized Signature", pageWidth - margin - 30, footerY + 5, {
    align: "center",
  });

  // Bottom branding
  doc.setTextColor(COLORS.lightText);
  doc.setFontSize(7);
  doc.text(
    "NB: This is a computer generated invoice.",
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

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
