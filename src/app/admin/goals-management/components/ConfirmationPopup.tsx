import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  message: string;
  actionType: "delete" | "deactivate" | "activate"; // Add actionType prop
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  message,
  actionType, // Destructure the actionType prop
}) => {
  const getButtonColor = () => {
    switch (actionType) {
      case "delete":
        return "bg-red-700 hover:bg-red-800";
      case "activate":
        return "bg-green-700 hover:bg-green-800";
      case "deactivate":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-4 md:p-8 rounded-2xl shadow-lg w-[70%] md:w-[40%] lg:w-[25%] max-h-[90%] flex flex-col overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <button
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
              onClick={onClose}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-blue-950 mb-6">
              Confirm Action
            </h2>
            <p className="mb-6">{message}</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                className="rounded-xl bg-gray-500 text-white px-4 py-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 hover:bg-gray-600 disabled:opacity-50"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`rounded-xl text-white px-4 py-2 shadow-md border border-gray-300 transition-all duration-200 hover:scale-105 disabled:opacity-50 ${getButtonColor()}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "Confirm..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationPopup;
