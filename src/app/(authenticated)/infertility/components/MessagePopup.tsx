import React from "react";
import { motion } from "framer-motion";

interface MessagePopupProps {
  messageType: "success" | "error" | null;
  messageContent: string;
  onDismiss: () => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
}

const MessagePopup: React.FC<MessagePopupProps> = ({
  messageType,
  messageContent,
  onDismiss,
  messagePopupRef,
}) => {
  if (!messageType) return null;

  return (
    <motion.div
      ref={messagePopupRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 flex items-center justify-center z-99999"
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center border border-gray-100">
        {/* Title */}
        <h3
          className={`text-lg font-semibold mb-3 ${
            messageType === "success" ? "text-green-700" : "text-red-700"
          }`}
        >
          {messageType === "success" ? "Success!" : "Error!"}
        </h3>
        {/* Message */}
        <div className="mb-6 text-gray-600 leading-relaxed">
          {messageContent}
        </div>
        <button
          onClick={onDismiss}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
            messageType === "success"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          Got it
        </button>
      </div>
    </motion.div>
  );
};

export default MessagePopup;
