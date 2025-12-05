import { format } from "date-fns";

export const formatDate = (date: string | null) => {
  if (!date) return "";
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
};

// Table headers with new column order:
// 1. # (includes edit button)
// 2. Patient Name (pinned on md+)
// 3. Hospital
// 4. Rest of fields...
export const getTableHeaders = () => [
  { key: "id", label: "#", pinned: true },
  { key: "patientFullName", label: "Patient Name", pinned: true },
  { key: "hospitalName", label: "Hospital" },
  { key: "patientAge", label: "Age" },
  { key: "patientDOB", label: "DOB" },
  { key: "husbandName", label: "Husband Name" },
  { key: "husbandAge", label: "Husband Age" },
  { key: "husbandDOB", label: "Husband DOB" },
  { key: "mobileNumber", label: "Mobile" },
  { key: "address", label: "Address" },
  { key: "yearsMarried", label: "Years Married" },
  { key: "yearsTrying", label: "Years Trying" },
  { key: "para", label: "Para" },
  { key: "alc", label: "ALC" },
  { key: "weight", label: "Weight" },
  { key: "bp", label: "BP" },
  { key: "infertilityType", label: "Infertility Type" },
  { key: "notes", label: "Notes" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
];

export interface TableHeader {
  key: string;
  label: string;
  pinned?: boolean;
}
