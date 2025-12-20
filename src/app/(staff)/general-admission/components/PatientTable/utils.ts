import type { AdmissionPatientData } from "../../types";

export interface TableHeader {
  key: string;
  label: string;
}

export function getTableHeaders(): TableHeader[] {
  return [
    { key: "id", label: "#" },
    { key: "actions", label: "Actions" },
    { key: "patientFullName", label: "Patient Name" },
    { key: "admissionNumber", label: "Admission #" },
    { key: "departmentName", label: "Department" },
    { key: "doctorName", label: "Doctor" },
    { key: "status", label: "Status" },
    { key: "grandTotal", label: "Total (BDT)" },
    { key: "dueAmount", label: "Due (BDT)" },
    { key: "dateAdmitted", label: "Admitted" },
  ];
}

export function formatDateWithTime(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}
