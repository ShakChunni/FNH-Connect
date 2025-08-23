import React from "react";
import { PlusIcon } from "lucide-react";
import { motion } from "framer-motion";

interface AddDataButtonProps {
  onClick: () => void;
}

const AddDataButton: React.FC<AddDataButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      initial={false}
      animate={{
        background: "linear-gradient(to right, #172554, #1e3a8a)", // blue-950 to blue-800
      }}
      whileHover={{
        background: "linear-gradient(to right, #1e40af, #1e3a8a)", // blue-800 to blue-900
      }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.1, 0.35, 1],
        background: { duration: 0.5, ease: "easeOut" },
      }}
      className="text-white font-bold py-2.5 xs:py-2.5 sm:py-3 
        px-3 xs:px-3.5 sm:px-4 rounded-xl inline-flex items-center justify-center
        shadow-md hover:shadow-lg
        h-[38px] xs:h-[40px] sm:h-[46px] transition-all duration-500 ease-in-out"
      style={{ border: "none" }}
    >
      <PlusIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 mr-1.5 xs:mr-2 sm:mr-2" />
      <span className="hidden sm:inline text-2xs xs:text-xs sm:text-sm">
        New Lead
      </span>
      <span className="sm:hidden text-2xs xs:text-xs">New</span>
    </motion.button>
  );
};

export default AddDataButton;
