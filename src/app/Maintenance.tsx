"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Clock } from "lucide-react";
import { tween, DURATION } from "@/lib/motion";

const MAINTENANCE_END = new Date("2025-07-16T20:00:00+08:00"); // 8pm MYT, 16 July 2025

function formatDuration(ms: number) {
  if (ms <= 0) return "Maintenance should be completed!";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes}m remaining`;
}

const Maintenance = () => {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const total = MAINTENANCE_END.getTime() - now.getTime();
      const started = MAINTENANCE_END.getTime() - 6 * 60 * 60 * 1000; // Assume started 6 hours before end
      const percent =
        total <= 0
          ? 100
          : Math.min(
              100,
              Math.max(
                0,
                ((now.getTime() - started) /
                  (MAINTENANCE_END.getTime() - started)) *
                  100
              )
            );
      setProgress(percent);
      setRemaining(formatDuration(total));
    };
    update();
    const interval = setInterval(update, 1000 * 60); // update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f6f9fd] p-2 sm:p-6">
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center p-6 sm:p-10 md:p-14 bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-lg md:max-w-2xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={tween(DURATION.base)}
        >
          {/* Maintenance Icon: gear turns slowly as a spinner */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center rounded-full bg-orange-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="flex items-center justify-center"
            >
              <Settings className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-4 text-center">
            Under Maintenance
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-center mb-6 leading-relaxed text-base sm:text-lg md:text-xl">
            Our dashboard is currently undergoing a major upgrade.
            <br />
            Thank you for your patience!
          </p>

          {/* Progress indicator */}
          <div className="w-full bg-slate-200 rounded-full h-3 mb-6">
            <motion.div
              className="bg-orange-500 h-3 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={tween(DURATION.slow)}
            />
          </div>

          {/* Downtime Information */}
          <div className="flex flex-row items-center justify-center text-center mb-6 gap-6">
            {/* Remaining time */}
            <div className="flex flex-col items-center bg-orange-50 px-5 py-4 rounded-xl border border-orange-200">
              <span className="flex items-center gap-2 text-sm text-slate-500 font-semibold mb-1">
                <Clock className="w-4 h-4 text-orange-500" />
                Time Remaining
              </span>
              <span className="text-xl font-bold text-orange-700 font-mono">
                {remaining}
              </span>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export default Maintenance;
