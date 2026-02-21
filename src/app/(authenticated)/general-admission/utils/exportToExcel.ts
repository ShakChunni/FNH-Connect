import ExcelJS from "exceljs";
import { AdmissionPatientData } from "../types";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Bangladesh timezone
const BANGLADESH_TIMEZONE = "Asia/Dhaka";

/**
 * Export filter metadata for naming the file
 */
export interface ExportFilterMeta {
  departmentName?: string;
  doctorName?: string;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Converts a UTC date string to Bangladesh timezone and formats as dd/mm/yyyy
 */
const formatToBangladeshDate = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    const utcDate = new Date(dateString);
    const bdDate = toZonedTime(utcDate, BANGLADESH_TIMEZONE);
    return format(bdDate, "dd/MM/yyyy");
  } catch {
    return "";
  }
};

/**
 * Formats a number value, returns empty string if null, undefined, or 0
 */
const formatFee = (value: number | null | undefined): number | string => {
  if (value === null || value === undefined || value === 0) return "";
  return value;
};

/**
 * Generate a descriptive filename based on filters
 */
const generateFileName = (filterMeta?: ExportFilterMeta): string => {
  const parts: string[] = ["general-admission-report"];

  // Add department name if filtered
  if (filterMeta?.departmentName) {
    const deptSlug = filterMeta.departmentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    parts.push(deptSlug);
  }

  // Add doctor name if filtered
  if (filterMeta?.doctorName) {
    const doctorSlug = filterMeta.doctorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    parts.push(doctorSlug);
  }

  // Add status if filtered
  if (filterMeta?.status && filterMeta.status !== "All") {
    const statusSlug = filterMeta.status
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    parts.push(statusSlug);
  }

  // Add date range if specified
  if (filterMeta?.startDate || filterMeta?.endDate) {
    const startStr = filterMeta.startDate
      ? format(filterMeta.startDate, "ddMMyyyy")
      : "start";
    const endStr = filterMeta.endDate
      ? format(filterMeta.endDate, "ddMMyyyy")
      : "end";
    parts.push(`${startStr}-to-${endStr}`);
  }

  return `${parts.join("-")}.xlsx`;
};

export const exportAdmissionsToExcel = (
  data: AdmissionPatientData[],
  filterMeta?: ExportFilterMeta,
) => {
  const worksheetData = data.map((item, index) => ({
    SL: index + 1,
    "Reg:No": item.admissionNumber || "",
    "Admit Date": formatToBangladeshDate(item.dateAdmitted),
    "Patient Name": item.patientFullName || "",
    Age: item.patientAge ?? "",
    Mobile: item.patientPhone || "",
    "Name of Operation": item.otType || "",
    "Ward/Cabin": item.ward || "",
    "Release Date": formatToBangladeshDate(item.dateDischarged),
    Anaesthesia: formatFee(item.anesthesiaFee),
    Taka: formatFee(item.grandTotal),
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Admissions");

  const headers = [
    "SL",
    "Reg:No",
    "Admit Date",
    "Patient Name",
    "Age",
    "Mobile",
    "Name of Operation",
    "Ward/Cabin",
    "Release Date",
    "Anaesthesia",
    "Taka",
  ];

  worksheet.addRow(headers);
  worksheetData.forEach((row) => {
    worksheet.addRow(headers.map((header) => row[header as keyof typeof row]));
  });

  worksheet.columns = [
    { width: 5 },
    { width: 12 },
    { width: 12 },
    { width: 25 },
    { width: 6 },
    { width: 15 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  const fileName = generateFileName(filterMeta);

  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  });
};
