import React, { useState, useRef, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsappMessagingProps {
  phoneNumber: string;
}

const WhatsappMessaging: React.FC<WhatsappMessagingProps> = ({
  phoneNumber,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return "";
    // Remove all non-numeric characters except the plus at the beginning
    const cleaned = phone.trim().replace(/[^0-9+]/g, "");
    // Remove plus sign if present (WhatsApp API doesn't need it)
    return cleaned.startsWith("+") ? cleaned.substring(1) : cleaned;
  };

  const formattedNumber = formatPhoneForWhatsApp(phoneNumber);

  const openWhatsApp = (platform: "web" | "app", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formattedNumber) return;

    // Base URL for WhatsApp
    const baseUrl =
      platform === "web"
        ? "https://web.whatsapp.com/send?phone="
        : "https://api.whatsapp.com/send?phone=";

    // Construct the URL
    const whatsappUrl = `${baseUrl}${formattedNumber}`;

    // Open in new tab
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
    }, 400); // Slightly longer timeout for smoother UX
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        whileHover={{}}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <FaWhatsapp className="ml-2 w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-900 transition-colors duration-300" />
      </motion.div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 bg-white border border-gray-200 shadow-lg rounded-lg mt-2 -right-12 w-28 overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-1 flex items-center justify-center divide-x divide-gray-200 shadow-sm">
              <motion.div
                whileHover={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                transition={{ duration: 0.2 }}
                className="px-3 py-1.5 cursor-pointer text-xs font-medium flex-1 text-center text-gray-700 rounded-l-md flex items-center justify-center space-x-1"
                onClick={(e) => openWhatsApp("web", e)}
              >
                <span>Web</span>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                transition={{ duration: 0.2 }}
                className="px-3 py-1.5 cursor-pointer text-xs font-medium flex-1 text-center text-gray-700 rounded-r-md flex items-center justify-center space-x-1"
                onClick={(e) => openWhatsApp("app", e)}
              >
                <span>App</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsappMessaging;
