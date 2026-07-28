import { isGynecologyDepartment } from "@/lib/departmentRecognition";

/**
 * Match live department IDs first, while retaining a name fallback for
 * package definitions saved before department IDs were persisted.
 */
export const ALL_MEDICINE_PACKAGE_DEPARTMENTS = "All Departments";

export function isMedicinePackageForDepartment(
  packageDepartment: string | null | undefined,
  departmentName: string | null | undefined,
  packageDepartmentId?: number | null,
  departmentId?: number | null,
): boolean {
  const packageScope = packageDepartment?.trim().toLowerCase();
  const department = departmentName?.trim().toLowerCase();

  if (packageScope === ALL_MEDICINE_PACKAGE_DEPARTMENTS.toLowerCase()) {
    return true;
  }
  if (packageDepartmentId && departmentId) {
    return packageDepartmentId === departmentId;
  }
  if (!packageScope || !department) return false;

  if (
    packageScope === "gynecology" &&
    isGynecologyDepartment(departmentName ?? "")
  ) {
    return true;
  }

  return packageScope === department;
}
