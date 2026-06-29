/**
 * Shared helpers for medicine inventory PDF reports
 */

import jsPDF from "jspdf";
import { formatBDT } from "@/lib/timezone";

interface JsPDFWithGState {
  GState: new (state: { opacity: number }) => unknown;
}

export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export const COLORS = {
  primary: "#020617",
  accent: "#1d4ed8",
  text: "#000000",
  lightText: "#1a202c",
  border: "#cbd5e1",
  faint: "#f1f5f9",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
};

export const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  email: "Email: firozanursinghome@gmail.com",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export const formatCurrency = (amount: number): string => {
  return `BDT ${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-BD").format(num);
};

export const formatDate = (dateString: string | Date): string => {
  return formatBDT(dateString, "MMM dd, yyyy");
};

export const safeText = (
  value: string | null | undefined,
  fallback = "N/A",
): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const drawLogoWatermark = async (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  try {
    const logo = await loadImage("/fnh-logo.png");
    doc.saveGraphicsState();
    doc.setGState(
      new (doc as unknown as JsPDFWithGState).GState({ opacity: 0.04 }),
    );
    const logoSize = 100;
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight * 0.65 - logoSize / 2;
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
    doc.restoreGraphicsState();
  } catch {
    // Silently fail if logo not available
  }
};

export const drawHeader = async (
  doc: jsPDF,
  title: string,
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  let currentY = 10;

  try {
    const logo = await loadImage("/fnh-logo.png");
    const logoW = 20;
    const logoH = 20;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, currentY, logoW, logoH);
  } catch {
    // Silently fail if logo not available
  }

  currentY = 35;

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
    { align: "center" },
  );
  currentY += 6;

  // Divider
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  return currentY;
};

export const drawInfoBox = (
  doc: jsPDF,
  currentY: number,
  rows: Array<{ label: string; value: string }>,
): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const boxPadding = 5;
  const rowHeight = 6;
  const boxHeight = boxPadding * 2 + rowHeight * Math.max(1, rows.length);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "S");

  let infoY = currentY + boxPadding + 4;
  doc.setFontSize(10);

  rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.lightText);
    doc.text(row.label, margin + boxPadding, infoY);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "normal");
    doc.text(row.value, margin + boxPadding + row.label.length * 2.7 + 4, infoY);
    infoY += rowHeight;
  });

  return currentY + boxHeight + 10;
};

export const drawFooter = (
  doc: jsPDF,
  generatedBy: string,
): void => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(COLORS.lightText);

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, {
      align: "right",
    });

    doc.text("Report Generated By", margin, footerY - 6);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text(generatedBy, margin, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(COLORS.lightText);
    const printTime = formatBDT(new Date(), "dd MMM yyyy, h:mm a");
    doc.text(`Generated on: ${printTime}`, margin, footerY + 4);

    doc.text(
      "NB: This is a computer generated report.",
      pageWidth / 2,
      footerY,
      { align: "center" },
    );

    doc.text(
      "Thank you for choosing Feroza Nursing Home",
      pageWidth / 2,
      footerY + 4,
      { align: "center" },
    );
  }
};

export const checkNewPage = (
  doc: jsPDF,
  currentY: number,
  requiredSpace = 50,
): number => {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY > pageHeight - requiredSpace) {
    doc.addPage();
    drawLogoWatermark(doc);
    return 20;
  }
  return currentY;
};
