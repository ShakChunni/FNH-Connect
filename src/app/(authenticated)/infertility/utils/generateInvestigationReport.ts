import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InfertilityTestData } from "../types";
import { format } from "date-fns";
import { PATHOLOGY_TESTS } from "../../pathology/constants/pathologyTests";

// FNH Brand Colors
const COLORS = {
  primary: "#020617", // darker navy
  accent: "#1d4ed8", // darker blue
  success: "#059669",
  warning: "#d97706",
  text: "#000000",
  lightText: "#1a202c",
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "HSI Center",
  address: "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  email: "Email: firozanursinghome@gmail.com",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
  department: "HSI Center",
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const drawHeader = async (doc: jsPDF, title: string, dateRange?: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let currentY = 10;

  try {
    const logo = await loadImage("/hsi-logo.png");
    const logoW = 20;
    const logoH = 20;
    const logoX = pageWidth / 2 - logoW / 2;
    doc.addImage(logo, "PNG", logoX, currentY, logoW, logoH);
  } catch (e) {}

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
  doc.text(`${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 4;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.accent);
  doc.text(COMPANY_INFO.department, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  if (dateRange) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.lightText);
    doc.text(`Report Period: ${dateRange}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  return currentY;
};

const drawMetricBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  valueColor: string = COLORS.primary
) => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, height, 3, 3, "F");
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(x, y, width, height, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text(label, x + 5, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(valueColor);
  doc.text(value, x + 5, y + 18);
};

export const generateInfertilityInvestigationReport = async (
  data: InfertilityTestData[],
  type: "summary" | "detailed",
  filters?: { startDate?: Date | null; endDate?: Date | null; dateRange?: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  const title = type === "summary" ? "HSI Center Investigation Summary" : "Detailed HSI Center Investigation Report";

  // Date range string formatting
  let dateStr = "All Time";
  if (filters?.startDate && filters?.endDate) {
    dateStr = `${format(filters.startDate, "MMM dd, yyyy")} - ${format(filters.endDate, "MMM dd, yyyy")}`;
  } else if (filters?.dateRange && filters.dateRange !== "all") {
    dateStr = filters.dateRange;
  }

  let currentY = await drawHeader(doc, title, dateStr);

  // Metrics
  const totalTests = data.length;
  const completedTests = data.filter((d) => d.isCompleted).length;
  const pendingTests = totalTests - completedTests;
  const completionRate = totalTests > 0 ? ((completedTests / totalTests) * 100).toFixed(1) : "0";

  const totalCharges = data.reduce((sum, item) => sum + Number(item.testCharge), 0);
  const totalDiscount = data.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  const totalRevenue = data.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const totalCollected = data.reduce((sum, item) => sum + Number(item.paidAmount), 0);
  const totalDue = data.reduce((sum, item) => sum + Number(item.dueAmount), 0);
  const collectionRate = totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : "0";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Performance Metrics", margin, currentY);
  currentY += 5;

  const boxWidth = (pageWidth - margin * 2 - 12) / 4;
  const boxHeight = 26;
  const boxGap = 4;

  drawMetricBox(doc, margin, currentY, boxWidth, boxHeight, "Total Records", totalTests.toString());
  drawMetricBox(doc, margin + boxWidth + boxGap, currentY, boxWidth, boxHeight, "Completed", completedTests.toString(), COLORS.success);
  drawMetricBox(doc, margin + (boxWidth + boxGap) * 2, currentY, boxWidth, boxHeight, "Pending", pendingTests.toString(), COLORS.warning);
  drawMetricBox(doc, margin + (boxWidth + boxGap) * 3, currentY, boxWidth, boxHeight, "Completion", `${completionRate}%`, COLORS.accent);
  currentY += boxHeight + 4;

  drawMetricBox(doc, margin, currentY, boxWidth, boxHeight, "Gross Charges", `BDT ${totalCharges.toLocaleString()}`);
  drawMetricBox(doc, margin + boxWidth + boxGap, currentY, boxWidth, boxHeight, "Discount", `- BDT ${totalDiscount.toLocaleString()}`, "#dc2626");
  drawMetricBox(doc, margin + (boxWidth + boxGap) * 2, currentY, boxWidth, boxHeight, "Net Revenue", `BDT ${totalRevenue.toLocaleString()}`, COLORS.success);
  drawMetricBox(doc, margin + (boxWidth + boxGap) * 3, currentY, boxWidth, boxHeight, "Collection %", `${collectionRate}%`, COLORS.accent);
  currentY += boxHeight + 4;

  const wideBoxWidth = (pageWidth - margin * 2 - boxGap) / 2;
  drawMetricBox(doc, margin, currentY, wideBoxWidth, boxHeight, "Total Collected", `BDT ${totalCollected.toLocaleString()}`, COLORS.success);
  drawMetricBox(doc, margin + wideBoxWidth + boxGap, currentY, wideBoxWidth, boxHeight, "Total Due", `BDT ${totalDue.toLocaleString()}`, totalDue > 0 ? "#dc2626" : COLORS.success);
  currentY += boxHeight + 10;

  // Individual Tests Breakdown
  const testCountMap = new Map<string, { count: number; revenue: number; name: string }>();
  data.forEach((record) => {
    const testNames = record.selectedTests;
    testNames.forEach((name: string) => {
      const testInfo = PATHOLOGY_TESTS.find((t) => t.name === name || t.code === name);
      const testPrice = testInfo?.price || 0;
      const current = testCountMap.get(name) || { count: 0, revenue: 0, name: testInfo?.name || name };
      testCountMap.set(name, { count: current.count + 1, revenue: current.revenue + testPrice, name: current.name });
    });
  });

  doc.setFont("helvetica", "bold");
  doc.text("Investigations Breakdown", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [["Investigation Name", "Count", "Revenue (Estimated)"]],
    body: Array.from(testCountMap.values()).sort((a, b) => b.count - a.count).map((s) => [s.name, s.count.toString(), s.revenue.toLocaleString()]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Doctor Breakdown
  const doctorMap = new Map<string, { count: number; revenue: number }>();
  data.forEach((item) => {
    const docName = item.orderedBy || "Self";
    const current = doctorMap.get(docName) || { count: 0, revenue: 0 };
    doctorMap.set(docName, { count: current.count + 1, revenue: current.revenue + Number(item.grandTotal) });
  });

  doc.setFont("helvetica", "bold");
  doc.text("Doctor-wise Breakdown", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [["Doctor Name", "Total Tests", "Total Revenue"]],
    body: Array.from(doctorMap.entries()).sort((a, b) => b[1].count - a[1].count).map(([n, s]) => [n, s.count.toString(), s.revenue.toLocaleString()]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });

  if (type === "detailed") {
    doc.addPage();
    currentY = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detailed Investigation Records", margin, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Test No.", "Date", "Patient", "Investigations", "Status", "Total", "Paid", "Due"]],
      body: data.map((item, i) => [
        (i + 1).toString(),
        item.testNumber,
        format(new Date(item.testDate), "dd/MM/yy"),
        item.patientFullName,
        item.selectedTests.join(", ").substring(0, 30),
        item.isCompleted ? "Done" : "Pending",
        Number(item.grandTotal).toLocaleString(),
        Number(item.paidAmount).toLocaleString(),
        Number(item.dueAmount).toLocaleString(),
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 7 },
      styles: { fontSize: 7 },
      margin: { left: margin, right: margin },
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${format(new Date(), "PPpp")} - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
  }

  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
};
