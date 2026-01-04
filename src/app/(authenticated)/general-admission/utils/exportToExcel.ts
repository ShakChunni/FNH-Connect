import * as XLSX from "xlsx";
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
  filterMeta?: ExportFilterMeta
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

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 5 }, // SL
    { wch: 12 }, // Reg:No
    { wch: 12 }, // Admit Date
    { wch: 25 }, // Patient Name
    { wch: 6 }, // Age
    { wch: 15 }, // Mobile
    { wch: 20 }, // Name of Operation
    { wch: 12 }, // Ward/Cabin
    { wch: 12 }, // Release Date
    { wch: 12 }, // Anaesthesia
    { wch: 12 }, // Taka
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");

  // Generate file using writeFile for more reliable download
  const fileName = generateFileName(filterMeta);
  XLSX.writeFile(workbook, fileName);
};
