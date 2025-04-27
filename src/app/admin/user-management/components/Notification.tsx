import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
            type === "success"
              ? "bg-blue-900 text-white"
              : "bg-red-500 text-white"
          }`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={handleClose}
              className="ml-4 bg-transparent border-none text-white hover:opacity-75 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
