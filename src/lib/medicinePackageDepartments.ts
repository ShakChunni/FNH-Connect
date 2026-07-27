import { isGynecologyDepartment } from "@/lib/departmentRecognition";

/**
 * Package department matching is label based. Presets live in HospitalConfig
 * while admissions reference the live Department table, so IDs are not
 * embedded in a preset.
 */
export const ALL_MEDICINE_PACKAGE_DEPARTMENTS = "All Departments";

export function isMedicinePackageForDepartment(
  packageDepartment: string | null | undefined,
  departmentName: string | null | undefined,
): boolean {
  const packageScope = packageDepartment?.trim().toLowerCase();
  const department = departmentName?.trim().toLowerCase();

  if (!packageScope || !department) return false;
  if (packageScope === ALL_MEDICINE_PACKAGE_DEPARTMENTS.toLowerCase()) {
    return true;
  }

  if (
    packageScope === "gynecology" &&
    isGynecologyDepartment(departmentName ?? "")
  ) {
    return true;
  }

  return packageScope === department;
}
