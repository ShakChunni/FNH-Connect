/**
 * Infertility Investigation CSV Export Utility
 */

import { InfertilityTestData } from "../types";
import { formatBDT } from "@/lib/timezone";

export const exportInvestigationsToCSV = (data: InfertilityTestData[]) => {
  if (!data || data.length === 0) return;

  // Define headers
  const headers = [
    "Test Number",
    "Date",
    "Patient Name",
    "Subject",
    "Phone Number",
    "Case Number",
    "Ordered By",
    "Investigations",
    "Status",
    "Test Charge",
    "Discount",
    "Grand Total",
    "Paid Amount",
    "Due Amount",
    "Created At"
  ];

  // Map data to rows
  const rows = data.map((item) => {
    const tests =
      item.selectedTests.length > 0
        ? item.selectedTests.join("; ")
        : item.testCategory || "";

    return [
      item.testNumber,
      formatBDT(item.testDate, "yyyy-MM-dd"),
      item.patientFullName,
      item.subjectName
        ? `${item.subjectLabel}: ${item.subjectName}`
        : item.subjectLabel,
      item.mobileNumber || "N/A",
      item.caseNumber,
      item.orderedBy || "Self",
      `"${tests}"`, // Wrap in quotes to handle semicolons/commas
      item.isCompleted ? "Completed" : "Pending",
      item.testCharge,
      item.discountAmount || 0,
      item.grandTotal,
      item.paidAmount,
      item.dueAmount,
      formatBDT(item.createdAt, "yyyy-MM-dd HH:mm:ss")
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `infertility_investigations_${formatBDT(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
