import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  timestamp?: number;
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  timestamp,
  duration = 1500,
}) => {
  const [visible, setVisible] = useState(true);
  const [displayMessage, setDisplayMessage] = useState(message);
  const [dots, setDots] = useState("");

  const getBackgroundColor = useCallback(() => {
    switch (type) {
      case "success":
        return "#1e3a8a"; // blue-950
      case "error":
        return "rgb(239, 68, 68)";
      case "info":
        return "rgb(55, 65, 81)";
      default:
        return "#1e3a8a"; // blue-950
    }
  }, [type]);

  useEffect(() => {
    setDisplayMessage(message);
    if (message.toLowerCase().includes("saving")) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots("");
    }
  }, [message]);

  useEffect(() => {
    if (type !== "info") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {visible && (
        <motion.div
          layoutId="notification"
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: 50,
            overflow: "hidden",
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 20,
              mass: 0.8,
            },
          }}
          exit={{
            opacity: 0,
            y: 50,
            transition: {
              duration: 0.3,
              ease: "easeInOut",
            },
          }}
        >
          <motion.div
            className="rounded-xl shadow-lg"
            style={{
              backgroundColor: getBackgroundColor(),
              backgroundSize: "cover",
              padding: "1rem",
            }}
            animate={{
              backgroundColor: getBackgroundColor(),
            }}
            transition={{
              backgroundColor: { duration: 0.3, ease: "easeInOut" },
            }}
          >
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white flex items-center gap-2"
            >
              <motion.span
                layout
                key={displayMessage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
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
