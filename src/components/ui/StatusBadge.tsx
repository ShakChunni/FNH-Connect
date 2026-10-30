import { cn } from "@/lib/utils";
import { StatusTone, TONE_BADGE, statusTone } from "@/lib/statusStyles";

interface StatusBadgeProps {
  status: string | null | undefined;
  /** Display text when it differs from the stored status value. */
  label?: React.ReactNode;
  /** Force a tone instead of deriving it from `status`. */
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ status, label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_BADGE[tone ?? statusTone(status)],
        className
      )}
    >
      {label ?? status ?? "—"}
    </span>
  );
}

export default StatusBadge;
