import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityPatientData } from "../types";

// FNH Brand Colors
const COLORS = {
  primary: "#1e293b", // fnh-navy (header)
  accent: "#3b82f6", // fnh-blue
  indigo: "#4f46e5", // indigo-600
  text: "#334155", // slate-700
  lightText: "#64748b",
  border: "#cbd5e1",
  faint: "#f8fafc",
  success: "#16a34a",
  rose: "#e11d48",
};

const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "+8801712-345678",
  department: "Infertility Management Unit",
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
 */
const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    const logoSize = 90;
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight / 2 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch (e) {
    // Silently fail if logo not available
  }
};

/**
 * Format date in a clean readable format
 */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  // Draw subtle logo watermark
  await drawLogoWatermark(doc);

  // === HEADER SECTION ===
  try {
    const logo = await loadImage("/fnh-logo.png");
    const logoW = 16;
    const logoH = 16;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, 8, logoW, logoH);
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  let currentY = 28;

  // Hospital Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY_INFO.name, pageWidth / 2, currentY, { align: "center" });
  currentY += 5;

  // Department
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.indigo);
  doc.text(COMPANY_INFO.department, pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 4;

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text(COMPANY_INFO.address, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Divider
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text("INFERTILITY CASE REPORT", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 5;

  // Case ID and Date Row
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  doc.text(`#${data.caseNumber || `INF-${data.id}`}`, margin, currentY);
  doc.text(
    `Report Date: ${formatDate(new Date().toISOString())}`,
    pageWidth - margin,
    currentY,
    {
      align: "right",
    }
  );
  currentY += 8;

  /**
   * Proactive page break check
   */
  const ensureSpace = (neededHeight: number) => {
    const footerBuffer = 45; // Space for the footer and margins
    if (currentY + neededHeight > pageHeight - footerBuffer) {
      doc.addPage();
      drawLogoWatermark(doc);
      currentY = 20;
      return true;
    }
    return false;
  };

  // === 1. PATIENT INFORMATION BOX ===
  const patientBoxHeight = 32;
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
  const labelWidth = 26;

  doc.setFontSize(8);
  let detailY = patientContentY + 2;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Name:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientFullName || "N/A", col1X + labelWidth, detailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Gender:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientGender || "N/A", col2X + labelWidth, detailY);

  // Row 2
  detailY += 5;
  doc.setTextColor(COLORS.lightText);
  doc.text("Age:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.patientAge
      ? `${data.patientAge} Years`
      : calculateAge(data.patientDOB),
    col1X + labelWidth,
    detailY
  );

  doc.setTextColor(COLORS.lightText);
  doc.text("Blood Group:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.bloodGroup || "N/A", col2X + labelWidth, detailY);

  // Row 3
  detailY += 5;
  doc.setTextColor(COLORS.lightText);
  doc.text("Mobile:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.mobileNumber || "N/A", col1X + labelWidth, detailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Occupation:", col2X, detailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.patientOccupation || "N/A", col2X + labelWidth, detailY);

  // Row 4
  detailY += 5;
  doc.setTextColor(COLORS.lightText);
  doc.text("Address:", col1X, detailY);
  doc.setTextColor(COLORS.primary);
  const addressText = data.address || "N/A";
  const truncatedAddress =
    addressText.length > 70
      ? addressText.substring(0, 70) + "..."
      : addressText;
  doc.text(truncatedAddress, col1X + labelWidth, detailY);

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
  doc.setFontSize(8);

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Name:", col1X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.husbandName || "N/A", col1X + labelWidth, sDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Age:", col2X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.husbandAge
      ? `${data.husbandAge} Years`
      : calculateAge(data.husbandDOB),
    col2X + labelWidth,
    sDetailY
  );

  // Row 2
  sDetailY += 5;
  doc.setTextColor(COLORS.lightText);
  doc.text("Occupation:", col1X, sDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.husbandOccupation || "N/A", col1X + labelWidth, sDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Contact:", col2X, sDetailY);
  doc.setTextColor(COLORS.primary);
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
  doc.setFontSize(8);

  const col3X = pageWidth / 3 + 5;
  const col4X = (2 * pageWidth) / 3 + 5;
  const labelWidth2 = 28;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Years Married:", col1X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.yearsMarried ? `${data.yearsMarried} Year(s)` : "N/A",
    col1X + labelWidth2,
    fDetailY
  );

  doc.setTextColor(COLORS.lightText);
  doc.text("Years Trying:", col3X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.yearsTrying ? `${data.yearsTrying} Year(s)` : "N/A",
    col3X + labelWidth2,
    fDetailY
  );

  doc.setTextColor(COLORS.lightText);
  doc.text("Type:", col4X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.infertilityType || "N/A", col4X + 12, fDetailY);

  // Row 2
  fDetailY += 5;
  doc.setTextColor(COLORS.lightText);
  doc.text("Gravida (G):", col1X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.gravida || "N/A", col1X + labelWidth2, fDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Para (P):", col3X, fDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.para || "N/A", col3X + labelWidth2, fDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Referral:", col4X, fDetailY);
  doc.setTextColor(COLORS.primary);
  const referralText = (data.referralSource || "Self").substring(0, 15);
  doc.text(referralText, col4X + 15, fDetailY);

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

  let pDetailY = physicalContentY + 2;
  doc.setFontSize(8);

  // Single Row - all measurements
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Weight:", col1X, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.weight ? `${data.weight} kg` : "N/A", col1X + 16, pDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Height:", col1X + 42, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.height ? `${data.height} cm` : "N/A", col1X + 58, pDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("BMI:", col2X, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.bmi ? data.bmi.toFixed(1) : "N/A", col2X + 12, pDetailY);

  doc.setTextColor(COLORS.lightText);
  doc.text("Blood Pressure:", col2X + 32, pDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(data.bloodPressure || "N/A", col2X + 60, pDetailY);

  currentY += physicalBoxHeight + 6;

  // === 5. CHIEF COMPLAINT BOX ===
  if (data.chiefComplaint) {
    const complaintBoxHeight = 16;
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
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    const complaintText = doc.splitTextToSize(
      data.chiefComplaint,
      pageWidth - margin * 2 - 12
    );
    doc.text(complaintText.slice(0, 2), col1X, complaintContentY + 2);

    currentY += complaintBoxHeight + 6;
  }

  // === 6. MEDICAL HISTORY BOX ===
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
    const historyBoxHeight = 12 + historyItems.length * 10;
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
    doc.setFontSize(7);

    historyItems.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.lightText);
      doc.text(label + ":", col1X, histY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text);
      // Truncate long values
      const maxLen = 100;
      const displayValue =
        value.length > maxLen ? value.substring(0, maxLen) + "..." : value;
      const lines = doc.splitTextToSize(
        displayValue,
        pageWidth - margin * 2 - 45
      );
      doc.text(lines[0], col1X + 38, histY);

      histY += 8;
    });

    currentY += historyBoxHeight + 6;
  }

  // === 7. TREATMENT PLAN BOX ===
  const treatmentBoxHeight = 26;
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
  doc.setFontSize(7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Treatment Plan:", col1X, tDetailY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.primary);
  const planText = (data.treatmentPlan || "Initial assessment phase").substring(
    0,
    60
  );
  doc.text(planText, col1X + 28, tDetailY);

  tDetailY += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Medications:", col1X, tDetailY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.primary);
  const medsText = (data.medications || "No medications prescribed").substring(
    0,
    65
  );
  doc.text(medsText, col1X + 24, tDetailY);

  tDetailY += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.lightText);
  doc.text("Next Appointment:", col1X, tDetailY);
  doc.setTextColor(COLORS.primary);
  doc.text(
    data.nextAppointment ? formatDate(data.nextAppointment) : "To be scheduled",
    col1X + 32,
    tDetailY
  );

  doc.setTextColor(COLORS.lightText);
  doc.text("Status:", col2X, tDetailY);
  doc.setTextColor(data.status === "Active" ? COLORS.success : COLORS.primary);
  doc.text(data.status || "Active", col2X + 14, tDetailY);

  currentY += treatmentBoxHeight + 6;

  // === 8. CLINICAL NOTES BOX (if exists) ===
  if (data.notes) {
    const notesBoxHeight = 22;
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
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text);
    const notesText = doc.splitTextToSize(
      data.notes,
      pageWidth - margin * 2 - 12
    );
    doc.text(notesText.slice(0, 2), col1X, notesContentY + 2);

    currentY += notesBoxHeight + 6;
  }

  // === 9. REFERRING HOSPITAL BOX (if exists) ===
  if (data.hospitalName) {
    const hospitalBoxHeight = 24;
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
    doc.setFontSize(7);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.lightText);
    doc.text("Hospital:", col1X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.text(data.hospitalName, col1X + 18, hDetailY);

    doc.setTextColor(COLORS.lightText);
    doc.text("Type:", col2X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.text(data.hospitalType || "N/A", col2X + 12, hDetailY);

    hDetailY += 5;
    doc.setTextColor(COLORS.lightText);
    doc.text("Contact:", col1X, hDetailY);
    doc.setTextColor(COLORS.primary);
    doc.text(data.hospitalPhone || "N/A", col1X + 18, hDetailY);

    doc.setTextColor(COLORS.lightText);
    doc.text("Address:", col2X, hDetailY);
    doc.setTextColor(COLORS.primary);
    const hospAddr = (data.hospitalAddress || "N/A").substring(0, 40);
    doc.text(hospAddr, col2X + 16, hDetailY);

    currentY += hospitalBoxHeight + 6;
  }

  // === FOOTER ===
  const footerY = pageHeight - 35; // Increased bottom margin

  // Left side - Prepared By
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text("Prepared By", margin + 18, footerY, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.primary);
  doc.text(printedBy, margin + 18, footerY + 4, { align: "center" });

  // Print timestamp
  const printTime = new Date().toLocaleString("en-BD", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(COLORS.lightText);
  doc.text(printTime, margin + 18, footerY + 8, { align: "center" });

  // Right side - Record timestamps
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText);
  doc.text("Record Created", pageWidth - margin - 22, footerY, {
    align: "center",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(formatDate(data.createdAt), pageWidth - margin - 22, footerY + 4, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(
    `Updated: ${formatDate(data.updatedAt)}`,
    pageWidth - margin - 22,
    footerY + 8,
    { align: "center" }
  );

  // Bottom center branding
  doc.setTextColor(COLORS.lightText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(
    "This is a computer-generated medical report from the Woman's Own Medicine (WOM) System",
    pageWidth / 2,
    pageHeight - 12, // Increased safety margin
    { align: "center" }
  );
  doc.text(
    "Feroza Nursing Home · Infertility Management Unit",
    pageWidth / 2,
    pageHeight - 8, // Increased safety margin
    { align: "center" }
  );

  // Auto Print & Preview
  doc.autoPrint();
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
