import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
<<<<<<< HEAD
import { CheckCircle, XCircle, Info, Loader2, X } from "lucide-react";
=======
import { CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info" | "loading";
  timestamp?: number;
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  timestamp,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);
  const [displayMessage, setDisplayMessage] = useState(message);
  const [dots, setDots] = useState("");

  const getStyles = useCallback(() => {
<<<<<<< HEAD
    const baseGradient =
      "linear-gradient(180deg, #433F3C 0%, #332F2D 35%, #2A2524 70%, #393434 100%)"; // JD Sidebar Gradient

    switch (type) {
      case "success":
        return {
          bg: baseGradient,
          border: "#FEDD00",
          icon: CheckCircle,
          iconColor: "#FEDD00",
        };
      case "error":
        return {
          bg: baseGradient,
          border: "#fca5a5",
          icon: XCircle,
          iconColor: "#fef2f2",
        };
      case "info":
        return {
          bg: baseGradient,
          border: "#B2B2B2",
          icon: Info,
          iconColor: "#FEDD00",
        };
      case "loading":
        return {
          bg: baseGradient,
          border: "#FEDD00",
          icon: Loader2,
          iconColor: "#FEDD00",
        };
      default:
        return {
          bg: baseGradient,
          border: "#FEDD00",
          icon: Info,
          iconColor: "#FEDD00",
=======
    switch (type) {
      case "success":
        return {
          bg: "linear-gradient(135deg, #1F3B5C 0%, #183047 100%)",
          border: "#2E5C8A",
          icon: CheckCircle,
          iconColor: "#4CAF50",
        };
      case "error":
        return {
          bg: "linear-gradient(135deg, #1F3B5C 0%, #183047 100%)",
          border: "#EF4444",
          icon: XCircle,
          iconColor: "#FECACA",
        };
      case "info":
        return {
          bg: "linear-gradient(135deg, #1F3B5C 0%, #183047 100%)",
          border: "#2E5C8A",
          icon: Info,
          iconColor: "#93C5FD",
        };
      case "loading":
        return {
          bg: "linear-gradient(135deg, #1F3B5C 0%, #183047 100%)",
          border: "#2E5C8A",
          icon: Loader2,
          iconColor: "#60A5FA",
        };
      default:
        return {
          bg: "linear-gradient(135deg, #1F3B5C 0%, #183047 100%)",
          border: "#2E5C8A",
          icon: Info,
          iconColor: "#93C5FD",
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
        };
    }
  }, [type]);

  useEffect(() => {
    setDisplayMessage(message);
    if (type === "loading") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots("");
    }
  }, [message, type]);

  useEffect(() => {
    if (type !== "loading") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration]);

  const styles = getStyles();
  const IconComponent = styles.icon;

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {visible && (
        <motion.div
          layoutId="notification"
<<<<<<< HEAD
          className="overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
=======
          className="fixed bottom-4 right-4 z-50 overflow-hidden"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
<<<<<<< HEAD
              stiffness: 400,
              damping: 30,
=======
              stiffness: 300,
              damping: 25,
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
            },
          }}
          exit={{
            opacity: 0,
<<<<<<< HEAD
            y: -10,
            scale: 0.95,
            transition: {
              duration: 0.3,
              ease: "easeInOut",
=======
            y: 20,
            scale: 0.95,
            transition: {
              duration: 0.2,
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
            },
          }}
        >
          <motion.div
<<<<<<< HEAD
            className="rounded-3xl shadow-xl backdrop-blur-md border min-w-[280px] max-w-[90vw] sm:max-w-sm md:max-w-md"
            style={{
              background: styles.bg,
              borderColor: styles.border,
              padding: "0.5rem 0.75rem",
=======
            className="rounded-xl shadow-2xl backdrop-blur-sm border-2 min-w-[300px] max-w-md"
            style={{
              background: styles.bg,
              borderColor: styles.border,
              padding: "1rem 1.25rem",
            }}
            initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
            animate={{
              boxShadow: [
                "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: type === "loading" ? Infinity : 0,
                ease: "easeInOut",
              },
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
            }}
          >
            <motion.div
              layout
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={
                  type === "loading"
                    ? {
                        rotate: 360,
                      }
                    : {}
                }
                transition={
                  type === "loading"
                    ? {
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }
                    : {}
                }
              >
                <IconComponent
<<<<<<< HEAD
                  className="w-4 h-4 flex-shrink-0"
=======
                  className="w-5 h-5 flex-shrink-0"
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
                  style={{ color: styles.iconColor }}
                />
              </motion.div>
              <motion.span
                layout
                key={displayMessage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
<<<<<<< HEAD
                className="text-white font-medium text-sm flex-1 leading-relaxed"
=======
                className="text-white font-medium text-sm flex-1"
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
              >
                {displayMessage}
                {dots}
              </motion.span>
<<<<<<< HEAD
              <button
                onClick={() => setVisible(false)}
                className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-all duration-200 ease-in-out opacity-60 hover:opacity-100"
                aria-label="Close notification"
              >
                <X className="w-3 h-3 text-white/80 hover:text-white" />
              </button>
=======
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
