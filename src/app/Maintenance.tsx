"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Clock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const TANVIR_WHATSAPP = "+60124277450";
const MAINTENANCE_END = new Date("2025-07-16T20:00:00+08:00"); // 8pm MYT, 16 July 2025

function formatDuration(ms: number) {
  if (ms <= 0) return "Maintenance should be completed!";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes}m remaining`;
}

function formatMaintenanceEndTime() {
  return MAINTENANCE_END.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  const openWhatsApp = () => {
    const number = TANVIR_WHATSAPP.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${number}`, "_blank");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f6f9fd] p-2 sm:p-6">
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center p-6 sm:p-10 md:p-14 bg-white/90 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg md:max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Maintenance Icon */}
          <motion.div
            className="w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center rounded-full bg-orange-50 shadow-lg relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                <Settings className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 drop-shadow-lg" />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Under Maintenance
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-gray-600 text-center mb-6 leading-relaxed text-base sm:text-lg md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Our dashboard is currently undergoing a major upgrade.
            <br />
            Thank you for your patience!
          </motion.p>

          {/* Progress indicator */}
          <motion.div
            className="w-full bg-gray-200 rounded-full h-3 mb-6 shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <motion.div
              className="bg-orange-500 h-3 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 1, duration: 2, ease: "easeOut" }}
              style={{ width: `${progress}%` }}
            />
          </motion.div>

          {/* Downtime Information - Horizontal Card */}
          <motion.div
            className="flex flex-row items-center justify-center text-center mb-6 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            {/* Remaining time */}
            <div className="flex flex-col items-center bg-orange-50 px-5 py-4 rounded-xl border border-orange-200 shadow">
              <span className="flex items-center gap-2 text-sm text-gray-500 font-semibold mb-1">
                <Clock className="w-4 h-4 text-orange-400" />
                Time Remaining
              </span>
              <span className="text-xl font-bold text-orange-700 font-mono">
                {remaining}
              </span>
            </div>
          </motion.div>

          {/* Contact info */}
          <motion.div
            className="flex flex-col items-center justify-center mt-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <span className="text-sm text-gray-500">Questions?</span>
            <button
              type="button"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
              onClick={openWhatsApp}
            >
              <FaWhatsapp className="w-5 h-5" />
              Contact Tanvir TMI
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export default Maintenance;
