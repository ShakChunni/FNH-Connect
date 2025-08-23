import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiFilter } from "react-icons/fi";
import { PlusIcon } from "lucide-react";
import { useMediaQuery } from "react-responsive";

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
  const isMobile = useMediaQuery({ maxWidth: 639 }); // Tailwind's sm
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 }); // Tailwind's md

  // Responsive classes
  const buttonSize = isMobile
    ? "h-[40px] text-xs"
    : isMd
    ? "h-[44px] text-sm"
    : "h-[46px] text-sm";

  const expandTextWidth = isMobile
    ? "w-[80px]"
    : isMd
    ? "w-[100px]"
    : "w-[90px]";

  return (
    <div
      className={`flex px-4 lg:px-12 mb-6 ${
        isMobile ? "justify-center" : "justify-end"
      }`}
    >
      <div
        className={
          isMobile
            ? "flex items-center gap-3 w-full max-w-md"
            : "flex items-center gap-3"
        }
      >
        {" "}
        {/* Expand Button */}
        <motion.div
          className={`overflow-hidden ${isMobile ? "flex-1" : ""}`}
          initial={{
            width: isMobile ? undefined : isMd ? 160 : 160,
          }}
          animate={{
            width: isMobile ? undefined : isMd ? 160 : 160,
          }}
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
                ? "linear-gradient(to right, #1e3a8a, #172554)"
                : "linear-gradient(to left, #1e3a8a, #172554)",
              scale: 1,
            }}
            whileHover={{
              background: isExpanded
                ? "linear-gradient(to right, #1e40af, #1e3a8a)"
                : "linear-gradient(to left, #1e40af, #1e3a8a)",
            }}
            layout="position"
            className={`text-white rounded-2xl ${buttonSize}
              flex items-center justify-center shadow-md
              transition-all duration-300 ease-in-out cursor-pointer
              font-medium
              ${isMobile ? "w-full px-0" : "w-full px-5 py-2"}
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
              {/* Filter Icon with smoother rotation */}
              <motion.div
                animate={{
                  rotate: isExpanded ? 90 : 0,
                  color: isExpanded ? "#fde047" : "#ffffff",
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.2, 0.1, 0.3, 1],
                }}
                className="mr-2"
              >
                <FiFilter size={16} />
              </motion.div>

              {/* Text with smoother slide animation */}
              <div className={`relative overflow-hidden ${expandTextWidth}`}>
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
                      className={
                        isMobile
                          ? "block whitespace-nowrap text-xs"
                          : "block whitespace-nowrap text-sm"
                      }
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
                      className={
                        isMobile
                          ? "block whitespace-nowrap text-xs"
                          : "block whitespace-nowrap text-sm"
                      }
                    >
                      Show Filters
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.button>
        </motion.div>
        {/* Add Data Button */}
        <motion.button
          onClick={onAddData}
          initial={false}
          animate={{
            background: "linear-gradient(to right, #172554, #1e3a8a)",
          }}
          whileHover={{
            background: "linear-gradient(to right, #1e40af, #1e3a8a)",
          }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.1, 0.35, 1],
            background: { duration: 0.5, ease: "easeOut" },
          }}
          className={`text-white rounded-2xl ${buttonSize}
            flex items-center justify-center shadow-md
            transition-all duration-300 ease-in-out cursor-pointer
            font-medium
            ${isMobile ? "flex-1 px-0" : "w-[160px] px-5 py-2"}
          `}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          <span className={isMobile ? "text-xs" : "text-sm"}>New Patient</span>
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(ButtonContainer);
