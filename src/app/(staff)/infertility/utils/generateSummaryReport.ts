/**
 * Infertility Summary Report Generator
 * Generates PDF summary reports for multiple infertility patients
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityPatientData } from "../types";

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function generateInfertilitySummaryReport(
  patients: InfertilityPatientData[],
  staffName: string,
  detailed: boolean = false
): void {
  const doc = new jsPDF("landscape");

  // Colors
  const primaryBlue = [17, 24, 39]; // FNH Navy
  const accentYellow = [251, 191, 36]; // FNH Yellow
  const lightGray = [248, 250, 252];

  // Header
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, 297, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Feroza Nursing Home", 20, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    detailed
      ? "Infertility Patients - Detailed Report"
      : "Infertility Patients - Summary Report",
    20,
    23
  );

  // Report info on right
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 220, 15);
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
      patient.infertilityType || "N/A",
      patient.status || "Active",
      patient.mobileNumber || "N/A",
    ];

    if (detailed) {
      return [
        ...baseData.slice(0, 8),
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
      5: { cellWidth: 20 }, // Type
      6: { cellWidth: 18 }, // Status
      7: { cellWidth: detailed ? 25 : 35 }, // Phone
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
      "Feroza Nursing Home - Infertility Management System",
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  const reportType = detailed ? "detailed" : "summary";
  const fileName = `infertility_${reportType}_report_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}
