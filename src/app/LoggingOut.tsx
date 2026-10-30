import { motion, AnimatePresence } from "framer-motion";
import { tween, DURATION } from "@/lib/motion";

const LoggingOut = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 sm:p-8">
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center p-4 sm:p-8 bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tween(DURATION.base)}
        >
          {/* Spinner animation */}
          <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-transparent border-black mb-4 sm:mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Logging Out Text */}
          <p className="text-lg sm:text-xl text-black font-semibold">
            Logging Out...
          </p>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-black mt-2 sm:mt-4 text-center">
            Please wait while we log you out.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoggingOut;
