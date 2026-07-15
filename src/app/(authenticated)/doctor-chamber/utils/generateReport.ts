import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DoctorChamberVisitRecord } from "../types";

const money = (value: number) =>
  `BDT ${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = source;
  });

async function drawReportHeader(doc: jsPDF, title: string, period: string) {
  const pageWidth = doc.internal.pageSize.width;
  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.addImage(logo, "PNG", pageWidth / 2 - 10, 8, 20, 20);
  } catch {
    // Optional logo.
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor("#020617");
  doc.text("Feroza Nursing Home", pageWidth / 2, 34, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor("#1d4ed8");
  doc.text(title, pageWidth / 2, 44, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  doc.text(`Dr Sufia Khatun private chamber · Period: ${period}`, pageWidth / 2, 51, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleString("en-BD")}`, pageWidth / 2, 57, { align: "center" });
  return 65;
}

export async function generateDoctorChamberReport(
  data: DoctorChamberVisitRecord[],
  type: "summary" | "detailed",
  period: string,
) {
  const doc = new jsPDF("landscape");
  let y = await drawReportHeader(
    doc,
    type === "summary" ? "CHAMBER SUMMARY REPORT" : "DETAILED CHAMBER REPORT",
    period,
  );
  const totalTestCharges = data.reduce(
    (sum, visit) =>
      sum +
      visit.ultrasoundCharge +
      visit.tests.reduce((testSum, test) => testSum + test.amount, 0),
    0,
  );
  const totalVisiting = data.reduce((sum, visit) => sum + visit.visitingCharge, 0);
  const totalAmount = data.reduce((sum, visit) => sum + visit.totalAmount, 0);
  const totalSubtotal = data.reduce((sum, visit) => sum + visit.subtotal, 0);
  const totalDiscount = data.reduce((sum, visit) => sum + visit.discountAmount, 0);
  const totalExtra = data.reduce(
    (sum, visit) => sum + visit.fees.reduce((feeSum, fee) => feeSum + fee.amount, 0),
    0,
  );

  autoTable(doc, {
    startY: y,
    body: [
      ["Visits", String(data.length), "Selected tests", money(totalTestCharges), "Visit charge", money(totalVisiting), "Extra charges", money(totalExtra), "Subtotal", money(totalSubtotal), "Discount", money(totalDiscount), "Total", money(totalAmount)],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, textColor: "#111827", cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" }, 4: { fontStyle: "bold" }, 6: { fontStyle: "bold" }, 8: { fontStyle: "bold" }, 10: { fontStyle: "bold" }, 12: { fontStyle: "bold" } },
  });
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;

  if (data.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("No chamber visits found for the selected filters.", 15, y);
  } else if (type === "summary") {
    autoTable(doc, {
      startY: y,
      head: [["No.", "Visit No.", "Date", "Patient", "Doctor", "Subtotal", "Discount", "Total"]],
      body: data.map((visit, index) => [
        index + 1,
        visit.visitNumber,
        new Date(visit.visitDate).toLocaleDateString("en-BD"),
        visit.patientFullName,
        visit.doctorName,
        money(visit.subtotal),
        money(visit.discountAmount),
        money(visit.totalAmount),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, textColor: "#111827" },
      headStyles: { fillColor: "#020617", textColor: "#ffffff" },
      columnStyles: { 0: { cellWidth: 12 }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
    });
  } else {
    autoTable(doc, {
      startY: y,
      head: [["No.", "Visit No.", "Date", "Patient", "Phone", "Selected tests", "Test total", "Visit", "Extra", "Subtotal", "Discount", "Total"]],
      body: data.map((visit, index) => [
        index + 1,
        visit.visitNumber,
        new Date(visit.visitDate).toLocaleString("en-BD"),
        visit.patientFullName,
        visit.patientPhoneNumber || "N/A",
        visit.tests.length > 0
          ? visit.tests.map((test) => test.name).join("; ")
          : visit.ultrasoundCharge > 0
            ? visit.ultrasoundName
            : "None",
        money(
          visit.ultrasoundCharge +
            visit.tests.reduce((sum, test) => sum + test.amount, 0),
        ),
        money(visit.visitingCharge),
        money(visit.fees.reduce((sum, fee) => sum + fee.amount, 0)),
        money(visit.subtotal),
        money(visit.discountAmount),
        money(visit.totalAmount),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, textColor: "#111827" },
      headStyles: { fillColor: "#020617", textColor: "#ffffff" },
      columnStyles: { 0: { cellWidth: 9 }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" }, 10: { halign: "right" }, 11: { halign: "right" } },
    });
  }

  doc.save(`dr-sufia-khatun-chamber-${type}-report.pdf`);
}
