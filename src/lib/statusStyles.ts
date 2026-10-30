/**
 * One meaning per colour, everywhere in the app.
 *
 *   info     blue     ongoing / currently in care   (Admitted, Active)
 *   success  emerald  finished well / money settled (Discharged, Completed, Paid)
 *   warning  amber    needs attention soon          (Under Treatment, Pending, Partial, Follow-up)
 *   danger   red      blocked / owed / stopped      (Due, Canceled, Out of Stock)
 *   neutral  slate    inactive / archived / closed
 */
export type StatusTone = "info" | "success" | "warning" | "danger" | "neutral";

/** Pill/badge classes: tinted background, dark text, hairline ring. */
export const TONE_BADGE: Record<StatusTone, string> = {
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

/** Small status dot (filters, legends). */
export const TONE_DOT: Record<StatusTone, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-slate-400",
};

/** Plain text colour (amounts, inline status words). AA on white. */
export const TONE_TEXT: Record<StatusTone, string> = {
  info: "text-blue-700",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-700",
  neutral: "text-slate-600",
};

const STATUS_TONE: Record<string, StatusTone> = {
  // Admissions
  admitted: "info",
  "under treatment": "warning",
  "under active care": "warning",
  "awaiting discharge": "warning",
  discharged: "success",
  // Visits / cases / tests
  active: "info",
  "in progress": "info",
  "follow-up": "warning",
  pending: "warning",
  completed: "success",
  discontinued: "neutral",
  canceled: "danger",
  cancelled: "danger",
  // Money
  paid: "success",
  "fully paid": "success",
  partial: "warning",
  "partially paid": "warning",
  due: "danger",
  unpaid: "danger",
  // Stock
  "in stock": "success",
  "low stock": "warning",
  "out of stock": "danger",
  expired: "danger",
  // Accounts / records
  inactive: "neutral",
  archived: "neutral",
  closed: "neutral",
  open: "info",
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return STATUS_TONE[status.trim().toLowerCase()] ?? "neutral";
}

export function statusBadgeClass(status: string | null | undefined): string {
  return TONE_BADGE[statusTone(status)];
}
