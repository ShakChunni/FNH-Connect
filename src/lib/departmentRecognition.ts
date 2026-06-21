/**
 * Department Recognition Helpers
 *
 * Shared browser-safe predicates for departments that have a specific
 * clinical meaning in this hospital. Reception and Medicine Inventory
 * rely on these so the two modules cannot drift apart.
 */

/**
 * Returns true when the supplied department name represents the
 * Gynecology / Obstetrics department.
 *
 * Matching is case-insensitive and accepts the local short forms
 * ("gyn", "gyne", "gyna", "obstet") that users routinely type.
 */
export function isGynecologyDepartment(departmentName: string | null | undefined): boolean {
  if (!departmentName) return false;
  return /gyn|gyne|gyna|obstet/i.test(departmentName);
}
