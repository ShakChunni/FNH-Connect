/**
 * Department Code Mapping for Registration Numbers
 * Format: DEPT-YY-XXXXX (e.g., GYNE-25-00001)
 */

// Department name to code mapping
export const DEPARTMENT_CODES: Record<string, string> = {
  Gynecology: "GYNE",
  Surgery: "SURG",
  Medicine: "MED",
  Pediatrics: "PED",
  Cardiology: "CARD",
  ENT: "ENT",
  Orthopedics: "ORTH",
  Radiology: "RAD",
  Psychology: "PSY",
  Eye: "EYE",
  Pathology: "PATH",
  Anesthesia: "ANES",
  // Fallback for unknown departments
  General: "GEN",
};

// Reverse mapping for code to department name
export const CODE_TO_DEPARTMENT: Record<string, string> = Object.fromEntries(
  Object.entries(DEPARTMENT_CODES).map(([name, code]) => [code, name])
);

/**
 * Get department code from department name
 * @param departmentName - Full department name (e.g., "Gynecology")
 * @returns Department code (e.g., "GYNE")
 */
export function getDepartmentCode(departmentName: string): string {
  return DEPARTMENT_CODES[departmentName] || "GEN";
}

/**
 * Generate registration number in format: DEPT-YY-XXXXX
 * @param departmentCode - Department code (e.g., "GYNE")
 * @param year - 2-digit year (e.g., "25" for 2025)
 * @param sequence - Sequential number (will be padded to 5 digits)
 * @returns Formatted registration number (e.g., "GYNE-25-00001")
 */
export function formatRegistrationNumber(
  departmentCode: string,
  year: string,
  sequence: number
): string {
  return `${departmentCode}-${year}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Parse a registration number to extract components
 * @param regNumber - Registration number (e.g., "GYNE-25-00001")
 * @returns Object with departmentCode, year, and sequence, or null if invalid
 */
export function parseRegistrationNumber(regNumber: string): {
  departmentCode: string;
  year: string;
  sequence: number;
} | null {
  const match = regNumber.match(/^([A-Z]+)-(\d{2})-(\d{5})$/);
  if (!match) return null;

  return {
    departmentCode: match[1],
    year: match[2],
    sequence: parseInt(match[3], 10),
  };
}

/**
 * Get 2-digit year from a date
 * @param date - Date object (defaults to current date)
 * @returns 2-digit year string (e.g., "25" for 2025)
 */
export function getTwoDigitYear(date: Date = new Date()): string {
  return date.getFullYear().toString().slice(-2);
}
