/**
 * HSI Center Summary Report Generator
 * Generates PDF summary reports for multiple HSI Center patients
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityPatientData } from "../types";
import { formatBDT } from "@/lib/timezone";

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  return formatBDT(dateStr, "dd MMM yyyy");
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export async function generateInfertilitySummaryReport(
  patients: InfertilityPatientData[],
  staffName: string,
  detailed: boolean = false
): Promise<void> {
  const doc = new jsPDF("landscape");

  // Colors
  const primaryBlue = [17, 24, 39]; // FNH Navy
  const accentYellow = [251, 191, 36]; // FNH Yellow
  const lightGray = [248, 250, 252];

  // Header
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, 297, 30, "F");

  // Header logo
  try {
    const logo = await loadImage("/hsi-logo.png");
    const logoW = 18;
    const logoH = 18;
    doc.addImage(logo, "PNG", 10, 6, logoW, logoH);
  } catch (e) {}

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HSI Center", 36, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
      detailed
      ? "Patients - Detailed Report"
      : "Patients - Summary Report",
    36,
    23
  );

  // Report info on right
  doc.setFontSize(10);
  doc.text(`Generated: ${formatBDT(new Date(), "d MMM yyyy")}`, 220, 15);
  doc.text(`By: ${staffName}`, 220, 22);

  // Summary stats
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Patients: ${patients.length}`, 20, 40);

  const activeCount = patients.filter((p) => p.status === "Active").length;
  const completedCount = patients.filter(
    (p) => p.status === "Completed"
  ).length;

  doc.setFont("helvetica", "normal");
  doc.text(`Active: ${activeCount}`, 80, 40);
  doc.text(`Completed: ${completedCount}`, 130, 40);

  // Table data
  const tableHeaders = detailed
    ? [
        "S/N",
        "Case #",
        "Patient Name",
        "Age",
        "Spouse",
        "Spouse Age",
        "Type",
        "Status",
        "Years Trying",
        "Phone",
        "Created",
      ]
    : [
        "S/N",
        "Case #",
        "Patient Name",
        "Age",
        "Spouse",
        "Spouse Age",
        "Type",
        "Status",
        "Phone",
      ];

  const tableData = patients.map((patient, index) => {
    const baseData = [
      (index + 1).toString(),
      patient.caseNumber || `INF-${patient.id}`,
      patient.patientFullName,
      patient.patientAge?.toString() || "N/A",
      patient.husbandName || "N/A",
      patient.husbandAge?.toString() || "N/A",
      patient.infertilityType || "N/A",
      patient.status || "Active",
      patient.mobileNumber || "N/A",
    ];

    if (detailed) {
      return [
        ...baseData.slice(0, 9),
        patient.yearsTrying?.toString() || "N/A",
        formatDate(patient.createdAt),
      ];
    }

    return baseData;
  });

  autoTable(doc, {
    startY: 50,
    head: [tableHeaders],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12 }, // S/N
      1: { cellWidth: 28 }, // Case #
      2: { cellWidth: detailed ? 40 : 50 }, // Patient Name
      3: { cellWidth: 12 }, // Age
      4: { cellWidth: detailed ? 35 : 45 }, // Spouse
      5: { cellWidth: 12 }, // Spouse Age
      6: { cellWidth: 20 }, // Type
      7: { cellWidth: 18 }, // Status
      8: { cellWidth: detailed ? 25 : 35 }, // Phone
    },
    margin: { left: 10, right: 10 },
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
    doc.text(
      "HSI Center Management System",
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Open in new tab for printing (like row-level printing)
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
