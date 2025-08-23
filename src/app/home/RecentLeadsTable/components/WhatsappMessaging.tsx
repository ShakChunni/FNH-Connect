import React, { useState, useRef, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsappMessagingProps {
  phoneNumber: string;
  source?: "table" | "overview" | "input";
}

const WhatsappMessaging: React.FC<WhatsappMessagingProps> = ({
  phoneNumber,
  source = "table",
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return "";

    const cleaned = phone.trim().replace(/[^0-9+]/g, "");

    if (cleaned.startsWith("+")) {
      return cleaned.substring(1);
    }

    if (cleaned.startsWith("0")) {
      return "60" + cleaned.substring(1);
    }

    const hasCountryCode = cleaned.length > 11;

    if (!hasCountryCode) {
      return "60" + cleaned;
    }

    return cleaned;
  };

  const formattedNumber = formatPhoneForWhatsApp(phoneNumber);

  const openWhatsApp = (platform: "web" | "app", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formattedNumber) return;

    const baseUrl =
      platform === "web"
        ? "https://web.whatsapp.com/send?phone="
        : "https://api.whatsapp.com/send?phone=";

    const whatsappUrl = `${baseUrl}${formattedNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowOptions(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowOptions(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  let rightPosition = "-right-12";
  if (source === "overview") rightPosition = "-right-4";
  if (source === "input") rightPosition = "-right-20";

  return (
    <div className="relative inline-block">
      <motion.div
        ref={iconRef}
        whileHover={{}}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FaWhatsapp className="ml-2 w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-900 transition-colors duration-300" />
      </motion.div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[100] bg-white border border-gray-200 shadow-lg rounded-lg -top-14 ${rightPosition} w-28 overflow-hidden`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-1 flex items-center justify-center divide-x divide-gray-200 shadow-sm">
              <motion.div
                whileHover={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                transition={{ duration: 0.2 }}
                className="px-3 py-1.5 cursor-pointer text-xs font-medium flex-1 text-center text-gray-700 rounded-l-md flex items-center justify-center space-x-1"
                onClick={(e) => openWhatsApp("app", e)}
              >
                <span>App</span>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                transition={{ duration: 0.2 }}
                className="px-3 py-1.5 cursor-pointer text-xs font-medium flex-1 text-center text-gray-700 rounded-r-md flex items-center justify-center space-x-1"
                onClick={(e) => openWhatsApp("web", e)}
              >
                <span>Web</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsappMessaging;
