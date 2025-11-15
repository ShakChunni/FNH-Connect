import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, Loader2, X } from "lucide-react";

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
    // JD Brand Colors from globals.css
    const jdBlack = "#000000";
    const jdYellow = "#FEDD00";
    const jdWhite = "#FFFFFF";
    const jdGrey = "#B2B2B2";
    const jdRichBlack = "#231F20";
    const jdDeepStone = "#1B1918";
    const jdSandstone = "#B2B2B2";

    // JD Gradient backgrounds
    const successBg = `linear-gradient(135deg, ${jdBlack} 0%, ${jdRichBlack} 100%)`;
    const errorBg = `linear-gradient(135deg, ${jdDeepStone} 0%, ${jdRichBlack} 100%)`;
    const infoBg = `linear-gradient(135deg, ${jdRichBlack} 0%, ${jdDeepStone} 100%)`;
    const loadingBg = `linear-gradient(135deg, ${jdBlack} 0%, ${jdRichBlack} 100%)`;

    switch (type) {
      case "success":
        return {
          bg: successBg,
          border: jdYellow,
          icon: CheckCircle,
          iconColor: jdYellow,
          textColor: jdWhite,
        };
      case "error":
        return {
          bg: errorBg,
          border: "#dc2626", // JD red for errors
          icon: XCircle,
          iconColor: "#dc2626",
          textColor: jdWhite,
        };
      case "info":
        return {
          bg: infoBg,
          border: jdSandstone,
          icon: Info,
          iconColor: jdYellow,
          textColor: jdWhite,
        };
      case "loading":
        return {
          bg: loadingBg,
          border: jdYellow,
          icon: Loader2,
          iconColor: jdYellow,
          textColor: jdWhite,
        };
      default:
        return {
          bg: infoBg,
          border: jdYellow,
          icon: Info,
          iconColor: jdYellow,
          textColor: jdWhite,
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
          className="overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
              duration: 0.3,
              ease: "easeInOut",
            },
          }}
        >
          <motion.div
            className="rounded-3xl shadow-xl backdrop-blur-md border min-w-[280px] max-w-[90vw] sm:max-w-sm md:max-w-md"
            style={{
              background: styles.bg,
              borderColor: styles.border,
              padding: "0.5rem 0.75rem",
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
                  className="w-4 h-4 shrink-0"
                  style={{ color: styles.iconColor }}
                />
              </motion.div>
              <motion.span
                layout
                key={displayMessage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-white font-medium text-sm flex-1 leading-relaxed"
                style={{ color: styles.textColor }}
              >
                {displayMessage}
                {dots}
              </motion.span>
              <button
                onClick={() => setVisible(false)}
                className="shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-all duration-200 ease-in-out opacity-60 hover:opacity-100"
                style={{ color: styles.textColor }}
                aria-label="Close notification"
              >
                <X
                  className="w-3 h-3 text-white/80 hover:text-white"
                  style={{ color: styles.textColor, opacity: 0.8 }}
                />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
