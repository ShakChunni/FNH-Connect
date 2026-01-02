import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdmissionPatientData } from "../types";
import { format } from "date-fns";

// FNH Brand Colors
const COLORS = {
  primary: "#020617", // darker navy
  accent: "#1d4ed8", // darker blue
  success: "#059669", // green for positive
  warning: "#d97706", // amber for due
  text: "#000000", // pure black
  lightText: "#1a202c", // darker gray
  border: "#cbd5e1",
  faint: "#f1f5f9",
};

const COMPANY_INFO = {
  name: "Feroza Nursing Home",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  email: "Email: firozanursinghome@gmail.com",
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

const drawHeader = async (doc: jsPDF, title: string, dateRange?: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let currentY = 10;

  try {
    const logo = await loadImage("/fnh-logo.png");
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
  doc.text(
    `${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );
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

  if (dateRange) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.lightText);
    doc.text(`Report Period: ${dateRange}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 5;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated: ${format(new Date(), "PPpp")}`,
      pageWidth / 2,
      currentY,
      {
        align: "center",
      }
    );
    currentY += 8;
  }

  return currentY;
};

// Helper to draw a metric box
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
  doc.roundedRect(x, y, width, height, 2, 2, "F");
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(x, y, width, height, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text(label, x + 5, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(valueColor);
  doc.text(value, x + 5, y + 18);
};

export const generateAdmissionsReport = async (
  data: AdmissionPatientData[],
  type: "summary" | "detailed",
  filters?: {
    dateRange?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    department?: string;
    doctor?: string;
    status?: string;
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  const title =
    type === "summary"
      ? "Admissions Summary Report"
      : "Detailed Admissions Report";

  // Format actual date range - always use startDate/endDate if available
  let dateStr = "All Time";
  if (filters?.startDate && filters?.endDate) {
    // Same day check
    const startDateStr = format(filters.startDate, "MMMM dd, yyyy");
    const endDateStr = format(filters.endDate, "MMMM dd, yyyy");
    if (startDateStr === endDateStr) {
      dateStr = startDateStr; // Single day
    } else {
      dateStr = `${format(filters.startDate, "MMM dd, yyyy")} - ${format(
        filters.endDate,
        "MMM dd, yyyy"
      )}`;
    }
  } else if (filters?.dateRange && filters.dateRange !== "all") {
    // Fallback to calculating dates from preset if startDate/endDate not passed
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filters.dateRange) {
      case "today":
        dateStr = format(today, "MMMM dd, yyyy");
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateStr = format(yesterday, "MMMM dd, yyyy");
        break;
      case "last7days":
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        dateStr = `${format(last7Days, "MMM dd")} - ${format(
          today,
          "MMM dd, yyyy"
        )}`;
        break;
      case "last30days":
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        dateStr = `${format(last30Days, "MMM dd")} - ${format(
          today,
          "MMM dd, yyyy"
        )}`;
        break;
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateStr = `${format(startOfMonth, "MMM dd")} - ${format(
          today,
          "MMM dd, yyyy"
        )}`;
        break;
      case "custom":
        dateStr = "Custom Range";
        break;
      default:
        dateStr = filters.dateRange;
    }
  }

  let currentY = await drawHeader(doc, title, dateStr);

  // ═══════════════════════════════════════════════════════════════
  // KEY METRICS SECTION
  // ═══════════════════════════════════════════════════════════════

  const totalPatients = data.length;
  const totalRevenue = data.reduce(
    (sum, item) => sum + (item.grandTotal || 0),
    0
  );
  const totalCollected = data.reduce(
    (sum, item) => sum + (item.paidAmount || 0),
    0
  );
  const totalDue = data.reduce((sum, item) => sum + (item.dueAmount || 0), 0);
  const collectionRate =
    totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : "0";

  // Status breakdown
  const statusCounts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const admittedCount = statusCounts["Admitted"] || 0;
  const dischargedCount = statusCounts["Discharged"] || 0;
  const underTreatmentCount = statusCounts["Under Treatment"] || 0;
  const canceledCount = statusCounts["Canceled"] || 0;

  // Average per patient
  const avgPerPatient =
    totalPatients > 0 ? Math.round(totalRevenue / totalPatients) : 0;

  // Draw Key Metrics Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Key Performance Metrics", margin, currentY);
  currentY += 6;

  // Row 1: 4 boxes - Patient & Status Stats
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 25;
  const boxGap = 5;

  drawMetricBox(
    doc,
    margin,
    currentY,
    boxWidth,
    boxHeight,
    "Total Patients",
    totalPatients.toString(),
    COLORS.primary
  );
  drawMetricBox(
    doc,
    margin + boxWidth + boxGap,
    currentY,
    boxWidth,
    boxHeight,
    "Currently Admitted",
    admittedCount.toString(),
    COLORS.accent
  );
  drawMetricBox(
    doc,
    margin + (boxWidth + boxGap) * 2,
    currentY,
    boxWidth,
    boxHeight,
    "Under Treatment",
    underTreatmentCount.toString(),
    COLORS.warning
  );
  drawMetricBox(
    doc,
    margin + (boxWidth + boxGap) * 3,
    currentY,
    boxWidth,
    boxHeight,
    "Discharged",
    dischargedCount.toString(),
    COLORS.success
  );

  currentY += boxHeight + 5;

  // Row 2: Financial metrics
  drawMetricBox(
    doc,
    margin,
    currentY,
    boxWidth,
    boxHeight,
    "Total Revenue",
    `BDT ${totalRevenue.toLocaleString()}`,
    COLORS.primary
  );
  drawMetricBox(
    doc,
    margin + boxWidth + boxGap,
    currentY,
    boxWidth,
    boxHeight,
    "Amount Collected",
    `BDT ${totalCollected.toLocaleString()}`,
    COLORS.success
  );
  drawMetricBox(
    doc,
    margin + (boxWidth + boxGap) * 2,
    currentY,
    boxWidth,
    boxHeight,
    "Outstanding Due",
    `BDT ${totalDue.toLocaleString()}`,
    COLORS.warning
  );
  drawMetricBox(
    doc,
    margin + (boxWidth + boxGap) * 3,
    currentY,
    boxWidth,
    boxHeight,
    "Collection Rate",
    `${collectionRate}%`,
    COLORS.accent
  );

  currentY += boxHeight + 10;

  // ═══════════════════════════════════════════════════════════════
  // STATUS BREAKDOWN TABLE
  // ═══════════════════════════════════════════════════════════════

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Status Breakdown", margin, currentY);
  currentY += 5;

  const statusData = Object.entries(statusCounts).map(([status, count]) => {
    const percentage =
      totalPatients > 0 ? ((count / totalPatients) * 100).toFixed(1) : "0";
    return [status, count.toString(), `${percentage}%`];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Status", "Count", "Percentage"]],
    body: statusData,
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth / 2 - margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════════════
  // DEPARTMENT BREAKDOWN
  // ═══════════════════════════════════════════════════════════════

  const deptMap = new Map<
    string,
    { count: number; revenue: number; collected: number; due: number }
  >();
  data.forEach((item) => {
    const dept = item.departmentName || "General";
    const current = deptMap.get(dept) || {
      count: 0,
      revenue: 0,
      collected: 0,
      due: 0,
    };
    deptMap.set(dept, {
      count: current.count + 1,
      revenue: current.revenue + (item.grandTotal || 0),
      collected: current.collected + (item.paidAmount || 0),
      due: current.due + (item.dueAmount || 0),
    });
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Department-wise Breakdown", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Department",
        "Patients",
        "Revenue (BDT )",
        "Collected (BDT )",
        "Due (BDT )",
      ],
    ],
    body: Array.from(deptMap.entries()).map(([name, stats]) => [
      name,
      stats.count.toString(),
      stats.revenue.toLocaleString(),
      stats.collected.toLocaleString(),
      stats.due.toLocaleString(),
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════════════
  // DOCTOR-WISE BREAKDOWN
  // ═══════════════════════════════════════════════════════════════

  const doctorMap = new Map<string, { count: number; revenue: number }>();
  data.forEach((item) => {
    const doctor = item.doctorName || "Unknown";
    const current = doctorMap.get(doctor) || { count: 0, revenue: 0 };
    doctorMap.set(doctor, {
      count: current.count + 1,
      revenue: current.revenue + (item.grandTotal || 0),
    });
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text("Doctor-wise Breakdown", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [["Doctor", "Patients", "Revenue (BDT )"]],
    body: Array.from(doctorMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, stats]) => [
        name,
        stats.count.toString(),
        stats.revenue.toLocaleString(),
      ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.primary, fontSize: 9 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // ═══════════════════════════════════════════════════════════════
  // DETAILED PATIENT LIST (for detailed report)
  // ═══════════════════════════════════════════════════════════════

  if (type === "detailed") {
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.text("Detailed Patient Records", margin, currentY);
    currentY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText);
    doc.text(`Total: ${data.length} patient(s)`, margin, currentY + 4);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "#",
          "Adm. No.",
          "Date",
          "Patient",
          "Doctor",
          "Department",
          "Status",
          "Total",
          "Paid",
          "Due",
        ],
      ],
      body: data.map((item, index) => [
        (index + 1).toString(),
        item.admissionNumber || "",
        format(new Date(item.dateAdmitted), "dd/MM/yy"),
        item.patientFullName || "",
        item.doctorName || "Self",
        item.departmentName || "",
        item.status || "",
        (item.grandTotal || 0).toLocaleString(),
        (item.paidAmount || 0).toLocaleString(),
        (item.dueAmount || 0).toLocaleString(),
      ]),
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        fontSize: 7,
        cellPadding: 2,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      columnStyles: {
        0: { cellWidth: 8 }, // #
        1: { cellWidth: 20 }, // Adm No
        2: { cellWidth: 14 }, // Date
        3: { cellWidth: 25 }, // Patient
        4: { cellWidth: 30 }, // Doctor (wraps)
        5: { cellWidth: 22 }, // Department
        6: { cellWidth: 14 }, // Status
        7: { cellWidth: 16, halign: "right" }, // Total
        8: { cellWidth: 14, halign: "right" }, // Paid
        9: { cellWidth: 14, halign: "right" }, // Due
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Add header to each page
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `${COMPANY_INFO.name} - Detailed Admissions Report`,
          margin,
          10
        );
      },
    });

    // Summary totals at bottom
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.text(
      `Total: ${totalRevenue.toLocaleString()}  |  Collected: ${totalCollected.toLocaleString()}  |  Due: ${totalDue.toLocaleString()}`,
      pageWidth - margin,
      finalY,
      { align: "right" }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ═══════════════════════════════════════════════════════════════

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    const footerDate = format(new Date(), "PPpp");
    doc.text(
      `Generated on ${footerDate} - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" }
    );
  }

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
