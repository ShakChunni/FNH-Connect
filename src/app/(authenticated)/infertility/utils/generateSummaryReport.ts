import jsPDF from "jspdf";
import autoTable, { type Table } from "jspdf-autotable";
import { format } from "date-fns";
import { InfertilityPatientData } from "../types";
import { formatBDT } from "@/lib/timezone";

interface InfertilityPatientReportPeriod {
  dateRange?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

type AutoTableDocument = jsPDF & { lastAutoTable?: Table };

const COLORS = {
  primary: "#020617",
  accent: "#1d4ed8",
  success: "#059669",
  warning: "#d97706",
  danger: "#e11d48",
  text: "#000000",
  lightText: "#1a202c",
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "HSI Center",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
};

const formatMoney = (value: number): string =>
  `BDT ${Math.round(value).toLocaleString("en-US")}`;

const formatDate = (value: string | null): string =>
  value ? formatBDT(value, "dd MMM yyyy") : "N/A";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

const getLastTableFinalY = (doc: AutoTableDocument): number =>
  doc.lastAutoTable?.finalY ?? 0;

const drawHeader = async (
  doc: jsPDF,
  title: string,
  periodLabel: string,
  staffName: string,
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let currentY = 10;

  try {
    const logo = await loadImage("/hsi-logo.png");
    doc.addImage(logo, "PNG", pageWidth / 2 - 10, currentY, 20, 20);
  } catch {
    // The report remains printable if the optional logo is unavailable.
  }

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
  currentY += 8;

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text(`Report Period: ${periodLabel}`, pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  doc.text(
    `Generated: ${formatBDT(new Date(), "PPpp")}  |  By: ${staffName}`,
    pageWidth / 2,
    currentY,
    { align: "center" },
  );

  return currentY + 8;
};

const drawMetricBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  valueColor: string = COLORS.primary,
) => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, height, 3, 3, "F");
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(x, y, width, height, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text(label, x + 5, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(valueColor);
  doc.text(value, x + 5, y + 18);
};

const getPeriodLabel = (period?: InfertilityPatientReportPeriod): string => {
  if (period?.startDate && period.endDate) {
    const start = format(period.startDate, "MMMM dd, yyyy");
    const end = format(period.endDate, "MMMM dd, yyyy");
    return start === end
      ? start
      : `${format(period.startDate, "MMM dd, yyyy")} - ${format(
          period.endDate,
          "MMM dd, yyyy",
        )}`;
  }
  return "All Time";
};

export async function generateInfertilitySummaryReport(
  patients: InfertilityPatientData[],
  staffName: string,
  detailed = false,
  period?: InfertilityPatientReportPeriod,
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const title = detailed
    ? "Detailed HSI Patient Report"
    : "HSI Patient Summary Report";
  let currentY = await drawHeader(
    doc,
    title,
    getPeriodLabel(period),
    staffName,
  );

  const financials = patients.map(
    (patient) =>
      patient.financialSummary ?? {
        investigationCount: patient.testCount ?? 0,
        grossAmount: 0,
        discountAmount: 0,
        netAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      },
  );
  const totals = financials.reduce(
    (sum, value) => ({
      investigationCount:
        sum.investigationCount + value.investigationCount,
      grossAmount: sum.grossAmount + value.grossAmount,
      discountAmount: sum.discountAmount + value.discountAmount,
      netAmount: sum.netAmount + value.netAmount,
      paidAmount: sum.paidAmount + value.paidAmount,
      dueAmount: sum.dueAmount + value.dueAmount,
    }),
    {
      investigationCount: 0,
      grossAmount: 0,
      discountAmount: 0,
      netAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
    },
  );
  const activeCount = patients.filter((patient) => patient.status === "Active")
    .length;
  const completedCount = patients.filter(
    (patient) => patient.status === "Completed",
  ).length;
  const collectionRate =
    totals.netAmount > 0
      ? Math.min(100, (totals.paidAmount / totals.netAmount) * 100).toFixed(1)
      : "0";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Key Performance Metrics", margin, currentY);
  currentY += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, margin + 45, currentY);
  currentY += 6;

  const boxGap = 4;
  const boxHeight = 26;
  const boxWidth = (pageWidth - margin * 2 - boxGap * 3) / 4;
  const boxX = (index: number) => margin + (boxWidth + boxGap) * index;

  drawMetricBox(doc, boxX(0), currentY, boxWidth, boxHeight, "Total Patients", String(patients.length));
  drawMetricBox(doc, boxX(1), currentY, boxWidth, boxHeight, "Active", String(activeCount), COLORS.success);
  drawMetricBox(doc, boxX(2), currentY, boxWidth, boxHeight, "Completed", String(completedCount), COLORS.accent);
  drawMetricBox(doc, boxX(3), currentY, boxWidth, boxHeight, "Investigations", String(totals.investigationCount), COLORS.primary);
  currentY += boxHeight + 4;

  drawMetricBox(doc, boxX(0), currentY, boxWidth, boxHeight, "Gross Charges", formatMoney(totals.grossAmount));
  drawMetricBox(doc, boxX(1), currentY, boxWidth, boxHeight, "Discount", `- ${formatMoney(totals.discountAmount)}`, COLORS.danger);
  drawMetricBox(doc, boxX(2), currentY, boxWidth, boxHeight, "Net Revenue", formatMoney(totals.netAmount), COLORS.success);
  drawMetricBox(doc, boxX(3), currentY, boxWidth, boxHeight, "Collection Rate", `${collectionRate}%`, COLORS.accent);
  currentY += boxHeight + 4;

  const wideBoxWidth = (pageWidth - margin * 2 - boxGap) / 2;
  drawMetricBox(doc, margin, currentY, wideBoxWidth, boxHeight, "Amount Collected", formatMoney(totals.paidAmount), COLORS.success);
  drawMetricBox(
    doc,
    margin + wideBoxWidth + boxGap,
    currentY,
    wideBoxWidth,
    boxHeight,
    "Amount Due",
    formatMoney(totals.dueAmount),
    totals.dueAmount > 0 ? COLORS.danger : COLORS.success,
  );
  currentY += boxHeight + 10;

  const statusCounts = patients.reduce<Record<string, number>>(
    (counts, patient) => {
      const status = patient.status || "Active";
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    },
    {},
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Status Breakdown", margin, currentY);
  currentY += 5;
  autoTable(doc, {
    startY: currentY,
    head: [["Status", "Patients", "Percentage"]],
    body: Object.entries(statusCounts).map(([status, count]) => [
      status,
      String(count),
      `${patients.length > 0 ? ((count / patients.length) * 100).toFixed(1) : "0"}%`,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#fbbf24",
      lineColor: COLORS.primary,
      lineWidth: 0.2,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: { fontSize: 9, textColor: COLORS.text },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth / 2 - margin,
  });

  currentY = getLastTableFinalY(doc as AutoTableDocument) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Patient Financial Records", margin, currentY);
  currentY += 5;
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "#",
        "Case #",
        "Patient",
        "Tests",
        "Gross",
        "Discount",
        "Net",
        "Paid",
        "Due",
        "Status",
      ],
    ],
    body: patients.map((patient, index) => {
      const finance = financials[index];
      return [
        String(index + 1),
        patient.caseNumber || `INF-${patient.id}`,
        patient.patientFullName || "N/A",
        String(finance.investigationCount),
        Math.round(finance.grossAmount).toLocaleString(),
        Math.round(finance.discountAmount).toLocaleString(),
        Math.round(finance.netAmount).toLocaleString(),
        Math.round(finance.paidAmount).toLocaleString(),
        Math.round(finance.dueAmount).toLocaleString(),
        patient.status || "Active",
      ];
    }),
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#fbbf24",
      lineColor: COLORS.primary,
      lineWidth: 0.2,
      fontStyle: "bold",
      fontSize: 6.5,
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: COLORS.text,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 21 },
      2: { cellWidth: 28 },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 18, halign: "right" },
      9: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  if (detailed) {
    doc.addPage();
    currentY = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.text("Detailed Patient Records", margin, currentY);
    currentY += 8;
    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "#",
          "Case #",
          "Patient",
          "Age",
          "Spouse",
          "Sp. Age",
          "Type",
          "Years",
          "Phone",
          "Created",
        ],
      ],
      body: patients.map((patient, index) => [
        String(index + 1),
        patient.caseNumber || `INF-${patient.id}`,
        patient.patientFullName || "N/A",
        patient.patientAge?.toString() || "N/A",
        patient.husbandName || "N/A",
        patient.husbandAge?.toString() || "N/A",
        patient.infertilityType || "N/A",
        patient.yearsTrying?.toString() || "N/A",
        patient.mobileNumber || "N/A",
        formatDate(patient.createdAt),
      ]),
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: "#fbbf24",
        lineColor: COLORS.primary,
        lineWidth: 0.2,
        fontStyle: "bold",
        fontSize: 6.5,
        cellPadding: 1.5,
      },
      bodyStyles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        textColor: COLORS.text,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 21 },
        2: { cellWidth: 27 },
        3: { cellWidth: 10 },
        4: { cellWidth: 26 },
        5: { cellWidth: 13 },
        6: { cellWidth: 19 },
        7: { cellWidth: 12 },
        8: { cellWidth: 27 },
        9: { cellWidth: 18 },
      },
      margin: { left: margin, right: margin, bottom: 16 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" },
    );
    doc.text(
      "HSI Center Management System",
      margin,
      doc.internal.pageSize.height - 8,
    );
  }

  doc.autoPrint();
  const pdfUrl = URL.createObjectURL(doc.output("blob"));
  window.open(pdfUrl, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
}
