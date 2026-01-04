import { format } from "date-fns";

export const formatDate = (date: string | null) => {
  if (!date) return "";
  try {
    return format(new Date(date), "MMM dd, yyyy");
  } catch {
    return date;
  }
};

export const formatDateWithTime = (date: string | null) => {
  if (!date) return "";
  try {
    return format(new Date(date), "dd MMM yyyy, h:mm a");
  } catch {
    return date;
  }
};

// Table headers with comprehensive patient information
// Columns: #, Actions, Patient Name, Hospital, Husband/Partner, Phone, Type, Para/Gravida, Years Married, Status, Joined
export const getTableHeaders = () => [
  { key: "id", label: "#", pinned: true },
  { key: "actions", label: "Actions" },
  { key: "patientFullName", label: "Patient Name", pinned: true },
  { key: "hospitalName", label: "Hospital" },
  { key: "husbandName", label: "Husband / Partner" },
  { key: "mobileNumber", label: "Phone" },
  { key: "infertilityType", label: "Type" },
  { key: "paraGravida", label: "Para/Gravida" },
  { key: "yearsMarried", label: "Married (Yrs)" },
  { key: "yearsTrying", label: "Trying (Yrs)" },
  { key: "status", label: "Status" },
  { key: "nextAppointment", label: "Next Appt" },
  { key: "createdAt", label: "Joined" },
  { key: "updatedAt", label: "Updated" },
];

export interface TableHeader {
  key: string;
  label: string;
  pinned?: boolean;
}
