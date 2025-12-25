import * as XLSX from "xlsx";
import { AdmissionPatientData } from "../types";
import { format } from "date-fns";

export const exportAdmissionsToExcel = (data: AdmissionPatientData[]) => {
  const worksheetData = data.map((item) => ({
    "Admission Number": item.admissionNumber,
    "Date Admitted": format(new Date(item.dateAdmitted), "yyyy-MM-dd HH:mm"),
    "Patient Name": item.patientFullName,
    "Phone Number": item.patientPhone,
    Department: item.departmentName,
    Doctor: item.doctorName,
    Status: item.status,
    "Total Amount": item.totalAmount,
    Discount: item.discountAmount,
    "Grand Total": item.grandTotal,
    Paid: item.paidAmount,
    Due: item.dueAmount,
    "Date Discharged": item.dateDischarged
      ? format(new Date(item.dateDischarged), "yyyy-MM-dd")
      : "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");

  // Generate binary string
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  // Create blob and download
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admissions_report_${format(
    new Date(),
    "yyyyMMdd_HHmm"
  )}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
