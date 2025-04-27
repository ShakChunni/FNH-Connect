import React, { FC, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@radix-ui/themes";
import { useIndustryDropdown } from "../../hooks/useIndustryDropdown";
import { FixedSizeList } from "react-window";

interface IndustryDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  options?: string[];
  onNotification?: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
}

const IndustryDropdown: FC<IndustryDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options = [],
  onNotification,
}) => {
  const {
    selectedValue,
    isOpen,
    isCreatingNew,
    customValue,
    searchTerm,
    isSubmitting,
    error,
    dropdownRef,
    inputRef,
    handleSelect,
    handleOpenChange,
    handleCustomInputChange,
    handleCustomSelect,
    handleKeyDown,
    openCustomInput,
    setSearchTerm,
    allOptions,
  } = useIndustryDropdown({
    defaultValue,
    onSelect,
    onDropdownToggle,
    onDropdownOpenStateChange,
    options,
    onNotification,
  });

  // Memoize item renderer for the virtualized list
  const ItemRenderer = useMemo(() => {
    const Component = ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }) => (
      <div
        key={allOptions[index]}
        onClick={() => handleSelect(allOptions[index])}
        className="cursor-pointer px-4 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center"
        style={{ ...style }}
      >
        <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
          {allOptions[index]}
        </Text>
      </div>
    );

    Component.displayName = "ItemRenderer"; // Add display name here
    return Component;
  }, [allOptions, handleSelect]);

  return (
    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className={`${
          selectedValue
            ? "bg-white border-2 border-green-600"
            : "bg-gray-50 border border-gray-300"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
      >
        <span
          className={`${
            selectedValue
              ? "text-[#2A3136] font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue || "Select Industry"}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            }}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg mt-1 w-[calc(100%-48px)] overflow-hidden"
            style={{
              maxHeight: "400px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 sm:p-2 md:p-2 lg:p-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm bg-white pr-10 transition-all duration-150 ease-in-out"
                  autoFocus
                />
              </div>
            </div>

            {/* Virtualized list for industry options */}
            {allOptions.length > 0 && (
              <FixedSizeList
                height={Math.min(240, allOptions.length * 48)}
                width="100%"
                itemCount={allOptions.length}
                itemSize={48}
                overscanCount={5}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              >
                {ItemRenderer}
              </FixedSizeList>
            )}

            <AnimatePresence>
              {!isCreatingNew && (
                <motion.div
                  initial={{ opacity: 1, height: "auto" }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div
                    onClick={openCustomInput}
                    className="border-t-2 border-gray-200 cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center justify-between"
                  >
                    <Text className="font-semibold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
                      Create New Industry
                    </Text>
                    <span className="text-xl font-bold">+</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isCreatingNew && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="flex flex-col px-2"
                >
                  <div className="mt-2 mb-2 bg-blue-950 rounded-lg border border-gray-300 flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-blue-950 focus-within:border-blue-950">
                    <input
                      ref={inputRef}
                      type="text"
                      value={customValue}
                      onChange={handleCustomInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter custom industry"
                      className="flex-grow px-4 py-2 bg-white border-none rounded-l-lg outline-none transition-all duration-300"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center bg-white">
                      <div className="h-[80%] mx-4 border-l border-gray-200" />
                      <button
                        onClick={handleCustomSelect}
                        disabled={isSubmitting}
                        className={`h-full ${
                          isSubmitting
                            ? "bg-gray-500"
                            : "bg-blue-900 hover:bg-blue-950"
                        } text-white text-sm font-semibold py-2 px-4 transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-opacity-50`}
                      >
                        {isSubmitting ? "Adding..." : "Select"}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm px-3 py-1 mb-1">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
IndustryDropdown.displayName = "IndustryDropdown";
export default React.memo(IndustryDropdown);
