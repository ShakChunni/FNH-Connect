import { PathologyPatientData } from "../types";
import { format } from "date-fns";

/**
 * Export pathology data to CSV format
 */
export const exportPathologyToCSV = (data: PathologyPatientData[]) => {
  const headers = [
    "Test Number",
    "Test Date",
    "Patient Name",
    "Phone",
    "Category",
    "Status",
    "Ordered By",
    "Test Charge",
    "Discount",
    "Grand Total",
    "Paid",
    "Due",
  ];

  const rows = data.map((row) => [
    row.testNumber,
    format(new Date(row.testDate), "yyyy-MM-dd"),
    row.patientFullName,
    row.mobileNumber || "",
    row.testCategory,
    row.isCompleted ? "Completed" : "Pending",
    row.orderedBy || "Self",
    row.testCharge,
    row.discountAmount || 0,
    row.grandTotal,
    row.paidAmount,
    row.dueAmount,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pathology-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
};
