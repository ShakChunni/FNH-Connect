import { motion, AnimatePresence } from "framer-motion";

const Authenticating = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4 sm:p-8">
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center p-4 sm:p-8 bg-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Spinner animation */}
          <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-transparent border-black mb-4 sm:mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Authenticating Text */}
          <motion.p
            className="text-lg sm:text-xl text-black font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Authenticating...
          </motion.p>

          {/* Subtext */}
          <motion.p
            className="text-sm sm:text-base text-black mt-2 sm:mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Please wait while we verify your credentials.
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Authenticating;
