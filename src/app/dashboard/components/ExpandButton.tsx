import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiFilter } from "react-icons/fi";

interface ExpandButtonProps {
  onToggle: (isExpanded: boolean) => void;
  isExpanded: boolean;
}

const ExpandButton: React.FC<ExpandButtonProps> = ({
  onToggle,
  isExpanded,
}) => {
  const handleClick = () => {
    onToggle(!isExpanded);
  };

  return (
    <div className="flex justify-end px-4 lg:px-12 mb-6">
      <motion.div
        className="sm:w-auto overflow-hidden"
        initial={{ width: 180 }}
        animate={{
          width: isExpanded ? 160 : 180,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24,
          mass: 0.8,
        }}
      >
        <motion.button
          onClick={handleClick}
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
          className={`
            text-white rounded-lg px-5 py-2
            w-full flex items-center justify-center
            shadow-md
            transition-all duration-300 ease-in-out
            cursor-pointer
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
                ease: [0.2, 0.1, 0.3, 1], // Smoother custom easing
              }}
              className="mr-2"
            >
              <FiFilter size={18} />
            </motion.div>

            {/* Text with smoother slide animation */}
            <div className="relative overflow-hidden w-[110px]">
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
                    className="block whitespace-nowrap"
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
                    className="block whitespace-nowrap"
                  >
                    Show Filters
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default React.memo(ExpandButton);
