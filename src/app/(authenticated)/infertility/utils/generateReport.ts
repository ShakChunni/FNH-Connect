import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatBDT } from "@/lib/timezone";
import { InfertilityPatientData } from "../types";

// FNH Brand Colors
const COLORS = {
  primary: "#064e3b", // emerald-900 (header)
  accent: "#059669", // emerald-600
  indigo: "#4f46e5", // indigo-600
  text: "#334155", // slate-700
  lightText: "#64748b",
  border: "#cbd5e1",
  faint: "#f8fafc",
  success: "#16a34a",
  rose: "#e11d48",
};

const COMPANY_INFO = {
  name: "HSI Center",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
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
 * Format date in a clean readable format with time
 */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  return formatBDT(dateStr, "d MMM yyyy, hh:mm a");
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob: string | null | undefined): string => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} Years`;
};

const formatMoney = (value: number): string =>
  `BDT ${Math.round(value).toLocaleString("en-US")}`;

/**
 * Draw a section box with title
 */

const drawSectionBox = (
  doc: jsPDF,
  title: string,
  startY: number,
  height: number,
  margin: number,
  pageWidth: number,
  fillColor: [number, number, number] = [248, 250, 252],
  titleColor: string = COLORS.indigo
): number => {
  // Draw background box
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.roundedRect(margin, startY, pageWidth - margin * 2, height, 3, 3, "F");

  // Draw title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(titleColor);
  doc.text(title, margin + 5, startY + 6);

  return startY + 10; // Return Y position after title
};

/**
 * Generate a comprehensive infertility patient report
 */
export const generateInfertilityReport = async (
  data: InfertilityPatientData,
  printedBy: string = "Staff"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;

  // === HEADER SECTION ===

  // Header logo
  try {
    const logo = await loadImage("/hsi-logo.png");
    const logoW = 20;
    const logoH = 20;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, 10, logoW, logoH);
  } catch (e) {}

  let currentY = 35;

  // Hospital Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text(COMPANY_INFO.phone, pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Divider
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text("Case Report", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Case ID and Date Row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.text(`#${data.caseNumber || `INF-${data.id}`}`, margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  doc.text(
    `Report Date: ${formatDate(new Date().toISOString())}`,
    pageWidth - margin,
    currentY,
    {
      align: "right",
    }
  );
  currentY += 10;

  /**
   * Proactive page break check
   */
  const ensureSpace = (neededHeight: number) => {
    const footerBuffer = 45; // Space for the footer and margins
    if (currentY + neededHeight > pageHeight - footerBuffer) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  // === 1. PATIENT INFORMATION BOX ===
  const patientBoxHeight = 38;
  ensureSpace(patientBoxHeight);
  const patientContentY = drawSectionBox(
    doc,
    "PATIENT INFORMATION",
    currentY,
    patientBoxHeight,
    margin,
    pageWidth
  );

  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;
  const labelWidth = 28;

  doc.setFontSize(10);
  let detailY = patientContentY + 2;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Name:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.patientFullName || "N/A", col1X + labelWidth, detailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Gender:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.patientGender || "N/A", col2X + labelWidth, detailY);

  // Row 2
  detailY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Age:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(
    data.patientAge
      ? `${data.patientAge} Years`
      : calculateAge(data.patientDOB),
    col1X + labelWidth,
    detailY
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Blood Group:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.bloodGroup || "N/A", col2X + labelWidth, detailY);

  // Row 3
  detailY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.mobileNumber || "N/A", col1X + labelWidth, detailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Occupation:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.patientOccupation || "N/A", col2X + labelWidth, detailY);

  // Row 4 - Address (wrapped)
  detailY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  const addressText = data.address || "N/A";
  const addressLines = doc.splitTextToSize(addressText, pageWidth - margin * 2 - labelWidth - 10);
  doc.text(addressLines.slice(0, 2), col1X + labelWidth, detailY);

  currentY += patientBoxHeight + 6;

  // === 2. SPOUSE/PARTNER INFORMATION BOX ===
  const spouseBoxHeight = 22;
  ensureSpace(spouseBoxHeight);
  const spouseContentY = drawSectionBox(
    doc,
    "SPOUSE / PARTNER INFORMATION",
    currentY,
    spouseBoxHeight,
    margin,
    pageWidth,
    [255, 241, 242],
    COLORS.rose
  );

  let sDetailY = spouseContentY + 2;
  doc.setFontSize(10);

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Name:", col1X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.husbandName || "N/A", col1X + labelWidth, sDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Age:", col2X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(
    data.husbandAge
      ? `${data.husbandAge} Years`
      : calculateAge(data.husbandDOB),
    col2X + labelWidth,
    sDetailY
  );

  // Row 2
  sDetailY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Occupation:", col1X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.husbandOccupation || "N/A", col1X + labelWidth, sDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Contact:", col2X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.husbandPhone || "N/A", col2X + labelWidth, sDetailY);

  currentY += spouseBoxHeight + 6;

  // === 3. FERTILITY ASSESSMENT BOX ===
  const fertilityBoxHeight = 28;
  ensureSpace(fertilityBoxHeight);
  const fertilityContentY = drawSectionBox(
    doc,
    "FERTILITY ASSESSMENT",
    currentY,
    fertilityBoxHeight,
    margin,
    pageWidth,
    [239, 246, 255],
    "#2563eb"
  );

  let fDetailY = fertilityContentY + 2;
  doc.setFontSize(10);

  const col3X = pageWidth / 3 + 5;
  const col4X = (2 * pageWidth) / 3 + 5;
  const labelWidth2 = 30;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Years Married:", col1X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(
    data.yearsMarried ? `${data.yearsMarried} Year(s)` : "N/A",
    col1X + labelWidth2,
    fDetailY
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Years Trying:", col3X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(
    data.yearsTrying ? `${data.yearsTrying} Year(s)` : "N/A",
    col3X + labelWidth2,
    fDetailY
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Type:", col4X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.infertilityType || "N/A", col4X + 12, fDetailY);

  // Row 2
  fDetailY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Gravida (G):", col1X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.gravida || "N/A", col1X + labelWidth2, fDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Para (P):", col3X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.para || "N/A", col3X + labelWidth2, fDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Referral:", col4X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  const referralText = data.referralSource || "Self";
  const referralLines = doc.splitTextToSize(referralText, pageWidth - col4X - 20);
  doc.text(referralLines[0], col4X + 15, fDetailY);

  currentY += fertilityBoxHeight + 6;

  // === 4. PHYSICAL ASSESSMENT BOX ===
  const physicalBoxHeight = 18;
  ensureSpace(physicalBoxHeight);
  const physicalContentY = drawSectionBox(
    doc,
    "PHYSICAL ASSESSMENT",
    currentY,
    physicalBoxHeight,
    margin,
    pageWidth,
    [240, 253, 244],
    "#16a34a"
  );

  const pDetailY = physicalContentY + 2;
  doc.setFontSize(10);

  // Single Row - all measurements
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Weight:", col1X, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.weight ? `${data.weight} kg` : "N/A", col1X + 18, pDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Height:", col1X + 46, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.height ? `${data.height} cm` : "N/A", col1X + 62, pDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("BMI:", col2X, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.bmi ? data.bmi.toFixed(1) : "N/A", col2X + 14, pDetailY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Blood Pressure:", col2X + 36, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.bloodPressure || "N/A", col2X + 68, pDetailY);

  currentY += physicalBoxHeight + 6;

  // === 5. INVESTIGATION FINANCIAL SUMMARY ===
  if (data.financialSummary) {
    const financeBoxHeight = 30;
    ensureSpace(financeBoxHeight);
    const financeContentY = drawSectionBox(
      doc,
      "INVESTIGATION FINANCIAL SUMMARY",
      currentY,
      financeBoxHeight,
      margin,
      pageWidth,
      [255, 251, 235],
      "#92400e",
    );
    const finance = data.financialSummary;
    const financeColumns = [
      {
        label: "Investigations",
        value: String(finance.investigationCount),
      },
      { label: "Gross", value: formatMoney(finance.grossAmount) },
      { label: "Discount", value: formatMoney(finance.discountAmount) },
      { label: "Net", value: formatMoney(finance.netAmount) },
      { label: "Collected", value: formatMoney(finance.paidAmount) },
      { label: "Due", value: formatMoney(finance.dueAmount) },
    ];
    const financeColumnWidth = (pageWidth - margin * 2 - 10) / 3;

    financeColumns.forEach((item, index) => {
      const row = Math.floor(index / 3);
      const column = index % 3;
      const x = col1X + column * financeColumnWidth;
      const y = financeContentY + 2 + row * 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(COLORS.lightText);
      doc.text(`${item.label}:`, x, y);
      doc.setTextColor(COLORS.primary);
      doc.text(item.value, x + 24, y);
    });

    currentY += financeBoxHeight + 6;
  }

  // === 6. CHIEF COMPLAINT BOX ===
  if (data.chiefComplaint) {
    const complaintBoxHeight = 22;
    ensureSpace(complaintBoxHeight);
    const complaintContentY = drawSectionBox(
      doc,
      "CHIEF COMPLAINT",
      currentY,
      complaintBoxHeight,
      margin,
      pageWidth,
      [254, 252, 232],
      "#ca8a04"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    const complaintText = doc.splitTextToSize(
      data.chiefComplaint,
      pageWidth - margin * 2 - 12
    );
    doc.text(complaintText.slice(0, 3), col1X, complaintContentY + 2);

    currentY += complaintBoxHeight + 6;
  }

  // === 7. MEDICAL HISTORY BOX ===
  const historyItems: [string, string][] = [];
  if (data.medicalHistory)
    historyItems.push(["Medical History", data.medicalHistory]);
  if (data.surgicalHistory)
    historyItems.push(["Surgical History", data.surgicalHistory]);
  if (data.menstrualHistory)
    historyItems.push(["Menstrual History", data.menstrualHistory]);
  if (data.contraceptiveHistory)
    historyItems.push(["Contraceptive History", data.contraceptiveHistory]);

  if (historyItems.length > 0) {
    // Calculate dynamic height based on content
    const historyBoxHeight = 12 + historyItems.length * 18;
    ensureSpace(historyBoxHeight);

    // Draw background box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(
      margin,
      currentY,
      pageWidth - margin * 2,
      historyBoxHeight,
      3,
      3,
      "F"
    );

    // Draw title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569"); // slate-600
    doc.text("MEDICAL HISTORY", margin + 5, currentY + 6);

    // Draw history items inside the box
    let histY = currentY + 12;
    doc.setFontSize(9);

    historyItems.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text(label + ":", col1X, histY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      const lines = doc.splitTextToSize(
        value,
        pageWidth - margin * 2 - 45
      );
      doc.text(lines.slice(0, 3), col1X + 38, histY);

      histY += lines.length > 2 ? 16 : lines.length > 1 ? 12 : 8;
    });

    currentY += historyBoxHeight + 6;
  }

  // === 8. TREATMENT PLAN BOX ===
  const treatmentBoxHeight = 48;
  ensureSpace(treatmentBoxHeight);
  const treatmentContentY = drawSectionBox(
    doc,
    "TREATMENT PLAN & MEDICATIONS",
    currentY,
    treatmentBoxHeight,
    margin,
    pageWidth,
    [245, 243, 255],
    "#7c3aed"
  );

  let tDetailY = treatmentContentY + 2;
  doc.setFontSize(10);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Treatment Plan:", col1X, tDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  const planText = data.treatmentPlan || "Initial assessment phase";
  const planLines = doc.splitTextToSize(planText, pageWidth - margin * 2 - 38);
  doc.text(planLines.slice(0, 3), col1X + 32, tDetailY);

  tDetailY += planLines.length > 2 ? 16 : planLines.length > 1 ? 12 : 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Medications:", col1X, tDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  const medsText = data.medications || "No medications prescribed";
  const medsLines = doc.splitTextToSize(medsText, pageWidth - margin * 2 - 34);
  doc.text(medsLines.slice(0, 3), col1X + 28, tDetailY);

  tDetailY += medsLines.length > 2 ? 16 : medsLines.length > 1 ? 12 : 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Next Appointment:", col1X, tDetailY);
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(11);
  doc.text(
    data.nextAppointment ? formatDate(data.nextAppointment) : "To be scheduled",
    col1X + 36,
    tDetailY
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightText);
  doc.text("Status:", col2X, tDetailY);
  doc.setTextColor(data.status === "Active" ? COLORS.success : COLORS.primary);
  doc.setFontSize(11);
  doc.text(data.status || "Active", col2X + 18, tDetailY);

  currentY += treatmentBoxHeight + 6;

  // === 9. CLINICAL NOTES BOX (if exists) ===
  if (data.notes) {
    const notesBoxHeight = 36;
    ensureSpace(notesBoxHeight);
    const notesContentY = drawSectionBox(
      doc,
      "CLINICAL NOTES",
      currentY,
      notesBoxHeight,
      margin,
      pageWidth,
      [254, 249, 195],
      "#b45309"
    );

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    const notesText = doc.splitTextToSize(
      data.notes,
      pageWidth - margin * 2 - 12
    );
    doc.text(notesText.slice(0, 4), col1X, notesContentY + 2);

    currentY += notesBoxHeight + 6;
  }

  // === 9. REFERRING HOSPITAL BOX (if exists) ===
  if (data.hospitalName) {
    const hospitalBoxHeight = 36;
    ensureSpace(hospitalBoxHeight);
    const hospitalContentY = drawSectionBox(
      doc,
      "REFERRING HOSPITAL",
      currentY,
      hospitalBoxHeight,
      margin,
      pageWidth,
      [241, 245, 249],
      COLORS.primary
    );

    let hDetailY = hospitalContentY + 2;
    doc.setFontSize(10);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.lightText);
    doc.text("Hospital:", col1X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    doc.text(data.hospitalName, col1X + 22, hDetailY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.lightText);
    doc.text("Type:", col2X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    doc.text(data.hospitalType || "N/A", col2X + 16, hDetailY);

    hDetailY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.lightText);
    doc.text("Contact:", col1X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    doc.text(data.hospitalPhone || "N/A", col1X + 22, hDetailY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.lightText);
    doc.text("Address:", col2X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    const hospAddr = data.hospitalAddress || "N/A";
    const hospAddrLines = doc.splitTextToSize(hospAddr, pageWidth - col2X - 25);
    doc.text(hospAddrLines.slice(0, 3), col2X + 20, hDetailY);

    currentY += hospitalBoxHeight + 6;
  }

  // === FOOTER ===
  // Footer on all pages - matching investigation report style
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Bottom center branding on the last page
  doc.setPage(pageCount);
  doc.setTextColor(COLORS.lightText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "NB: This is a computer generated medical report.",
    pageWidth / 2,
    pageHeight - 26,
    { align: "center" }
  );
  doc.text(
    "Thank you for choosing HSI Center",
    pageWidth / 2,
    pageHeight - 22,
    { align: "center" }
  );

  // Collected by info on the last page - left side
  const printTime = formatBDT(new Date(), "d MMM yyyy, h:mm a");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text("Collected by:", margin, pageHeight - 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.primary);
  doc.text(data.createdByName?.trim() || printedBy, margin, pageHeight - 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text(`Printed on: ${printTime}`, margin, pageHeight - 10);

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
