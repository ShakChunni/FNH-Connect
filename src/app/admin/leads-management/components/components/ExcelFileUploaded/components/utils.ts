import { TARGET_FIELDS } from "./constants";

export const findBestMatch = (
  sourceHeader: string,
  targetFields = TARGET_FIELDS
) => {
  // Normalize the source header
  const normalizedHeader = sourceHeader.toLowerCase().trim();

  // Direct matches first (exact matches)
  const directMatch = targetFields.find(
    (field) =>
      field.key.toLowerCase() === normalizedHeader ||
      field.label.toLowerCase() === normalizedHeader
  );
  if (directMatch) return directMatch.key;

  // Check for partial matches
  if (normalizedHeader.includes("company") || normalizedHeader.includes("org"))
    return "organization";
  if (normalizedHeader.includes("name") || normalizedHeader.includes("contact"))
    return "client_name";
  if (
    normalizedHeader.includes("position") ||
    normalizedHeader.includes("title") ||
    normalizedHeader.includes("job")
  )
    return "client_position";
  if (
    normalizedHeader.includes("email") &&
    !normalizedHeader.includes("quality") &&
    !normalizedHeader.includes("other")
  )
    return "client_email";
  if (normalizedHeader.includes("quality")) return "client_Quality";
  if (normalizedHeader.includes("other") && normalizedHeader.includes("email"))
    return "client_otherEmail";
  if (normalizedHeader.includes("phone") && !normalizedHeader.includes("other"))
    return "client_phone";
  if (normalizedHeader.includes("other") && normalizedHeader.includes("phone"))
    return "client_otherPhone";
  if (normalizedHeader.includes("linkedin")) return "client_linkedinUrl";
  if (normalizedHeader.includes("industry")) return "industry";
  if (normalizedHeader.includes("address")) return "address";
  if (normalizedHeader.includes("status") || normalizedHeader.includes("label"))
    return "status";
  if (normalizedHeader.includes("note")) return "notes";

  // No match found
  return "";
};
