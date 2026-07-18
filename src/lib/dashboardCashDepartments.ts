/**
 * Departments included in the main dashboard cash tracker.
 *
 * General Admission owns the regular admission departments. Pathology and
 * Infertility have dedicated workflows/cash tracking, so they are excluded.
 * Private Chamber is created as its own active department by the chamber
 * service and is included automatically when it exists.
 */
const EXCLUDED_DASHBOARD_CASH_DEPARTMENTS = new Set([
  "pathology",
  "infertility",
]);

export function isDashboardCashDepartment(departmentName: string): boolean {
  return !EXCLUDED_DASHBOARD_CASH_DEPARTMENTS.has(
    departmentName.trim().toLowerCase(),
  );
}
