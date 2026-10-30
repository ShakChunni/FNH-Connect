import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, Loader2, X } from "lucide-react";
import { DURATION, SPRING, tween } from "@/lib/motion";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info" | "loading";
  timestamp?: number;
  duration?: number;
  onClose: () => void;
}

// Errors stay up long enough to actually read; success is a quick confirmation.
const DEFAULT_DURATION: Record<NotificationProps["type"], number> = {
  success: 3000,
  info: 4000,
  error: 7000,
  loading: 0,
};

// Navy surface (brand), coloured accent per type.
const TYPE_STYLES = {
  success: { icon: CheckCircle, accent: "bg-emerald-400", iconClass: "text-emerald-400" },
  error: { icon: XCircle, accent: "bg-red-400", iconClass: "text-red-400" },
  info: { icon: Info, accent: "bg-blue-400", iconClass: "text-blue-400" },
  loading: { icon: Loader2, accent: "bg-fnh-yellow", iconClass: "text-fnh-yellow animate-spin" },
} as const;

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  duration,
}) => {
  const [visible, setVisible] = useState(true);
  const styles = TYPE_STYLES[type] ?? TYPE_STYLES.info;
  const IconComponent = styles.icon;
  const timeout = duration ?? DEFAULT_DURATION[type];

  useEffect(() => {
    if (type === "loading" || !timeout) return;
    const timer = setTimeout(() => setVisible(false), timeout);
    return () => clearTimeout(timer);
  }, [type, timeout]);

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0, transition: SPRING }}
          exit={{ opacity: 0, y: -4, transition: tween(DURATION.fast) }}
          role={type === "error" ? "alert" : "status"}
          className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-fnh-navy-dark py-3 pl-4 pr-2 shadow-xl ring-1 ring-white/10 w-full sm:w-auto sm:min-w-[280px] sm:max-w-md"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`}
          />
          <IconComponent className={`w-5 h-5 shrink-0 ${styles.iconClass}`} />
          <span className="flex-1 text-sm font-medium leading-snug text-white">
            {message}
          </span>
          {(
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
