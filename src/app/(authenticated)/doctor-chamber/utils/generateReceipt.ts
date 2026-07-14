import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DoctorChamberVisitRecord } from "../types";

const COLORS = {
  navy: "#020617",
  blue: "#1d4ed8",
  text: "#111827",
  muted: "#475569",
  border: "#cbd5e1",
  faint: "#f8fafc",
};

const COMPANY = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "+8801726219350, +8801701295016, +8801787993086",
};

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = source;
  });

function money(value: number): string {
  return `BDT ${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function drawHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let y = 10;

  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.addImage(logo, "PNG", pageWidth / 2 - 10, y, 20, 20);
  } catch {
    // The document remains usable without the optional logo.
  }

  y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(COLORS.navy);
  doc.text(COMPANY.name, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted);
  doc.text(COMPANY.address, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`Mobile: ${COMPANY.phone}`, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setDrawColor(COLORS.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.blue);
  doc.text(title, pageWidth / 2, y, { align: "center" });
  return y + 8;
}

function drawPatientDetails(doc: jsPDF, data: DoctorChamberVisitRecord, startY: number) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const width = pageWidth - margin * 2;
  const rows = [
    ["Visit No.", data.visitNumber, "Date", new Date(data.visitDate).toLocaleString("en-BD")],
    ["Patient", data.patientFullName, "Gender", data.patientGender || "N/A"],
    ["Phone", data.patientPhoneNumber || "N/A", "Date of birth", data.patientDateOfBirth || "N/A"],
    ["Address", data.patientAddress || "N/A", "Doctor", data.doctorName],
  ];

  autoTable(doc, {
    startY,
    body: rows,
    theme: "grid",
    tableWidth: width,
    styles: { font: "helvetica", fontSize: 9, textColor: COLORS.text, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: COLORS.faint, cellWidth: 28 },
      1: { cellWidth: 65 },
      2: { fontStyle: "bold", fillColor: COLORS.faint, cellWidth: 28 },
      3: { cellWidth: "auto" },
    },
    headStyles: { fillColor: COLORS.navy },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
}

function getChargeRows(data: DoctorChamberVisitRecord): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    [data.ultrasoundName, money(data.ultrasoundCharge)],
    ["Visiting charge", money(data.visitingCharge)],
    ...data.fees.map((fee) => [fee.feeName, money(fee.amount)] as [string, string]),
    ["Subtotal", money(data.subtotal)],
  ];

  if (data.discountAmount > 0) {
    rows.push([
      data.discountType === "percentage" && data.discountValue !== null
        ? `Discount (${data.discountValue}%)`
        : "Discount",
      `- ${money(data.discountAmount)}`,
    ]);
  }

  return rows;
}

export async function generateDoctorChamberForm(
  data: DoctorChamberVisitRecord,
  printedBy = "Staff",
) {
  const doc = new jsPDF();
  const margin = 15;
  let y = await drawHeader(doc, "DR SUFIA KHATUN PRIVATE CHAMBER FORM");
  y = drawPatientDetails(doc, data, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.navy);
  doc.text("Consultation details", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.text(`Consulting doctor: ${data.doctorName}`, margin, y + 5);
  doc.text(`Department: ${data.departmentName}`, margin, y + 10);
  y += 17;

  autoTable(doc, {
    startY: y,
    head: [["No.", "Service / charge", "Amount"]],
    body: getChargeRows(data).map((row, index) => [index + 1, row[0], row[1]]),
    foot: [["", "Total", money(data.totalAmount)]],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.navy, textColor: "#ffffff" },
    footStyles: { fillColor: COLORS.faint, textColor: COLORS.navy, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 18 }, 2: { halign: "right", cellWidth: 35 } },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Report remarks / notes", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const noteLines = doc.splitTextToSize(data.notes || "No remarks recorded.", 180);
  doc.text(noteLines, margin, y + 6);
  y += 12 + noteLines.length * 4;

  doc.setDrawColor(COLORS.border);
  doc.line(margin, 270, 195, 270);
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted);
  doc.text(`Prepared by: ${printedBy}`, margin, 276);
  doc.text(`Generated: ${new Date().toLocaleString("en-BD")}`, margin, 281);
  doc.text("This chamber form records the visit and listed services.", margin, 286);
  doc.save(`${data.visitNumber}-chamber-form.pdf`);
}

export async function generateDoctorChamberReceipt(
  data: DoctorChamberVisitRecord,
  printedBy = "Staff",
) {
  const doc = new jsPDF();
  const margin = 15;
  let y = await drawHeader(doc, "DOCTOR CHAMBER RECEIPT");
  y = drawPatientDetails(doc, data, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: getChargeRows(data),
    foot: [["Total amount", money(data.totalAmount)]],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, textColor: COLORS.text, cellPadding: 4 },
    headStyles: { fillColor: COLORS.blue, textColor: "#ffffff" },
    footStyles: { fillColor: COLORS.faint, textColor: COLORS.navy, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", cellWidth: 45 } },
  });

  const tableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted);
  doc.text(`Fixed Ultra Sono charge: ${money(data.ultrasoundCharge)}`, margin, tableY + 12);
  doc.text(`Printed by: ${printedBy}`, margin, 270);
  doc.text(`Generated: ${new Date().toLocaleString("en-BD")}`, margin, 276);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy);
  doc.text("Thank you.", margin, 286);
  doc.save(`${data.visitNumber}-receipt.pdf`);
}
