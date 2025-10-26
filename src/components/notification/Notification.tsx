import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, Loader2 } from "lucide-react";

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
          className="fixed bottom-4 right-4 z-50 overflow-hidden"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            },
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.95,
            transition: {
              duration: 0.2,
            },
          }}
        >
          <motion.div
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
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: styles.iconColor }}
                />
              </motion.div>
              <motion.span
                layout
                key={displayMessage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-white font-medium text-sm flex-1"
              >
                {displayMessage}
                {dots}
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
