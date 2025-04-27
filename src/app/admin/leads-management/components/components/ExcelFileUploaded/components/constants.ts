export const TARGET_FIELDS = [
  { key: "organization", label: "Organization", required: true },
  { key: "client_name", label: "Contact Name", required: false },
  { key: "client_position", label: "Position", required: false },
  { key: "client_email", label: "Email", required: false },
  { key: "client_Quality", label: "Quality", required: false },
  { key: "client_otherEmail", label: "Other Email", required: false },
  { key: "client_phone", label: "Phone", required: false },
  { key: "client_otherPhone", label: "Other Phone", required: false },
  { key: "client_linkedinUrl", label: "LinkedIn URL", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "address", label: "Address", required: false },
  { key: "status", label: "Status", required: false },
  { key: "notes", label: "Notes", required: false },
];

export const tabContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const dropdownVariants = {
  closed: {
    opacity: 0,
    height: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      opacity: { duration: 0.1 },
    },
  },
  open: {
    opacity: 1,
    height: "auto",
    scale: 1,
    transition: {
      duration: 0.2,
      opacity: { duration: 0.15 },
    },
  },
};
