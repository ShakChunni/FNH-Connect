/**
 * Departments included in the General Admission group filter.
 *
 * Pathology and Infertility have dedicated workflows, so they are not part
 * of the General Admission group. They remain available as individual
 * department filters, as does the separate Private Chamber department.
 */
const EXCLUDED_GENERAL_ADMISSION_DEPARTMENTS = new Set([
  "pathology",
  "infertility",
]);

export function isGeneralAdmissionDepartment(departmentName: string): boolean {
  return !EXCLUDED_GENERAL_ADMISSION_DEPARTMENTS.has(
    departmentName.trim().toLowerCase(),
  );
}
