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
  { key: "actions", label: "Actions" },
  { key: "patientFullName", label: "Patient Name", pinned: true },
  { key: "hospitalName", label: "Hospital" },
  { key: "husbandName", label: "Husband / Partner" },
  { key: "mobileNumber", label: "Phone" },
  { key: "infertilityType", label: "Type" },
  { key: "createdAt", label: "Joined" },
  { key: "updatedAt", label: "Updated" },
];

export interface TableHeader {
  key: string;
  label: string;
  pinned?: boolean;
}
