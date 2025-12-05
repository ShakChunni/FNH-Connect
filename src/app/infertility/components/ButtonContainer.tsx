import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiFilter } from "react-icons/fi";
import { PlusIcon } from "lucide-react";

interface ButtonContainerProps {
  onToggleExpand: (isExpanded: boolean) => void;
  isExpanded: boolean;
  onAddData: () => void;
}

const ButtonContainer: React.FC<ButtonContainerProps> = ({
  onToggleExpand,
  isExpanded,
  onAddData,
}) => {
  return (
    <div className="flex px-2 sm:px-4 lg:px-12 mb-4 sm:mb-6 justify-center sm:justify-end">
      <div className="flex items-center gap-2 sm:gap-3 w-full max-w-md sm:max-w-none sm:w-auto">
        {/* Expand/Collapse Filters Button */}
        <motion.div
          className="flex-1 sm:flex-none overflow-hidden"
          initial={{ width: "auto" }}
          animate={{ width: "auto" }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 24,
            mass: 0.8,
          }}
        >
          <motion.button
            onClick={() => onToggleExpand(!isExpanded)}
            initial={false}
            animate={{
              background: isExpanded
                ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                : "linear-gradient(135deg, #1e293b, #334155)",
              scale: 1,
            }}
            whileHover={{
              background: isExpanded
                ? "linear-gradient(135deg, #60a5fa, #3b82f6)"
                : "linear-gradient(135deg, #334155, #475569)",
              scale: 1.02,
            }}
            layout="position"
            className={`
              text-white rounded-lg sm:rounded-xl
              h-9 sm:h-10 md:h-11 lg:h-[46px]
              flex items-center justify-center shadow-lg
              transition-all duration-300 ease-in-out cursor-pointer
              font-semibold
              w-full sm:w-36 md:w-40 lg:w-40
              px-3 sm:px-4 md:px-5 py-2
            `}
            transition={{
              duration: 0.35,
              ease: [0.25, 0.1, 0.35, 1],
              background: {
                duration: 0.5,
                ease: "easeOut",
              },
              layout: {
                type: "spring",
                stiffness: 200,
                damping: 25,
              },
            }}
          >
            <div className="flex items-center relative overflow-hidden">
              {/* Filter Icon with rotation */}
              <motion.div
                animate={{
                  rotate: isExpanded ? 90 : 0,
                  color: isExpanded ? "#fbbf24" : "#ffffff",
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.2, 0.1, 0.3, 1],
                }}
                className="mr-1.5 sm:mr-2"
              >
                <FiFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.div>

              {/* Text with slide animation */}
              <div className="relative overflow-hidden w-[70px] sm:w-[80px] md:w-[90px]">
                <AnimatePresence initial={false} mode="wait">
                  {isExpanded ? (
                    <motion.span
                      key="hide"
                      initial={{ y: 24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -24, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="block whitespace-nowrap text-[10px] sm:text-xs md:text-sm"
                    >
                      Hide Filters
                    </motion.span>
                  ) : (
                    <motion.span
                      key="show"
                      initial={{ y: -24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 24, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="block whitespace-nowrap text-[10px] sm:text-xs md:text-sm"
                    >
                      Show Filters
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Add New Patient Button */}
        <motion.button
          onClick={onAddData}
          initial={false}
          animate={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          }}
          whileHover={{
            background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
            scale: 1.02,
          }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.1, 0.35, 1],
            background: { duration: 0.5, ease: "easeOut" },
          }}
          className={`
            text-white rounded-lg sm:rounded-xl
            h-9 sm:h-10 md:h-11 lg:h-[46px]
            flex items-center justify-center shadow-lg
            transition-all duration-300 ease-in-out cursor-pointer
            font-semibold
            flex-1 sm:flex-none sm:w-36 md:w-40 lg:w-40
            px-3 sm:px-4 md:px-5 py-2
          `}
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
            New Patient
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(ButtonContainer);
