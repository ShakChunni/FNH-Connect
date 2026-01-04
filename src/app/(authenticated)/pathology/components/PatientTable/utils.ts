import type { PathologyPatientData } from "../../types";

export interface TableHeader {
  key: string;
  label: string;
}

export function getTableHeaders(): TableHeader[] {
  return [
    { key: "id", label: "#" },
    { key: "actions", label: "Actions" },
    { key: "patientFullName", label: "Patient Name" },
    { key: "testNumber", label: "Test Number" },
    { key: "testDate", label: "Test Date" },
    { key: "mobileNumber", label: "Mobile" },
    { key: "grandTotal", label: "Total (BDT)" },
    { key: "paidAmount", label: "Paid (BDT)" },
    { key: "dueAmount", label: "Due (BDT)" },
    { key: "isCompleted", label: "Status" },
  ];
}
