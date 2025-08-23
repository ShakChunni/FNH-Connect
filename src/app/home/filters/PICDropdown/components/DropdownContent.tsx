import React, { FC, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Check } from "lucide-react";
import UserItem from "./UserItem";
import { createPortal } from "react-dom";
import { useMediaQuery } from "react-responsive";

interface DropdownContentProps {
  activeValues: string[];
  archivedValues: string[];
  selectedValues: string[];
  onUserSelect: (value: string) => void;
  onSectionSelectAll: (section: "active" | "archived") => void;
  onClearAll: (e: React.MouseEvent) => void;
  isActiveSectionAllChecked: boolean;
  isArchivedSectionAllChecked: boolean;
  isSmallScreen: boolean;
  triggerRect: DOMRect | null;
  setDropdownRef: (ref: HTMLDivElement | null) => void;
}

const DropdownContent: FC<DropdownContentProps> = ({
  activeValues,
  archivedValues,
  selectedValues,
  onUserSelect,
  onSectionSelectAll,
  onClearAll,
  isActiveSectionAllChecked,
  isArchivedSectionAllChecked,
  isSmallScreen,
  triggerRect,
  setDropdownRef,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isXsScreen = useMediaQuery({ maxWidth: 479 });
  const isSmScreen = useMediaQuery({ minWidth: 480, maxWidth: 639 });
  const isMdScreen = useMediaQuery({ minWidth: 640, maxWidth: 767 });
  const isLgScreen = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isXlScreen = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const is2XlScreen = useMediaQuery({ minWidth: 1280 });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setDropdownRef(contentRef.current);
    }
    return () => setDropdownRef(null);
  }, [setDropdownRef]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const stopWheelPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const stopScrollPropagation = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  const filteredActive = activeValues.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchived = archivedValues.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSelectedValues = selectedValues.length > 0;

  const getPositionAndSize = () => {
    if (!triggerRect) return { leftPosition: "0" };

    let leftPosition = `${triggerRect.left}px`;

    const dropdownWidth = isSmallMobile
      ? 200
      : isMobile
      ? 220
      : isXsScreen
      ? 240
      : 260;

    const currentWidth = window.innerWidth;
    const rightEdge = triggerRect.left + dropdownWidth;

    if (rightEdge > currentWidth - 10) {
      leftPosition = `${Math.max(10, currentWidth - dropdownWidth - 10)}px`;
    }

    return { leftPosition };
  };
  const { leftPosition } = getPositionAndSize();

  const dropdownContent = (
    <motion.div
      ref={contentRef}
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
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg overflow-hidden shadow-xl"
      style={{
        top: triggerRect ? `${triggerRect.bottom + 8}px` : "0",
        left: leftPosition,
        width: isSmallMobile
          ? "200px"
          : isMobile
          ? "220px"
          : isXsScreen
          ? "240px"
          : "260px",
        maxHeight: isMobile ? "80vh" : "90vh",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
      }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onKeyDown={stopPropagation}
      onWheel={stopWheelPropagation}
      data-dropdown="pic"
    >
      <div className="flex flex-col p-2 sm:p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-blue-900 font-bold text-xs sm:text-sm">
            Users
          </div>
          {hasSelectedValues && (
            <button
              onClick={onClearAll}
              className="text-red-500 hover:text-red-700 transition-colors p-0.5 rounded-md hover:bg-red-50 flex items-center"
              title="Clear all"
            >
              <Trash2 size={isMobile ? 12 : 14} />
            </button>
          )}
        </div>

        <div className="relative mb-3">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-1.5 sm:p-2 pr-8 rounded-md border border-gray-300 text-xs sm:text-sm focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none"
            onClick={stopPropagation}
          />
          <Search
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div
          className="overflow-y-auto max-h-[250px] sm:max-h-[275px] md:max-h-[300px] lg:max-h-[325px] xl:max-h-[350px]"
          onScroll={stopScrollPropagation}
          onWheel={stopWheelPropagation}
          data-dropdown-content="true"
        >
          {filteredActive.length > 0 && (
            <div className="mb-2">
              <div
                className="flex items-center justify-between px-2 py-1 mb-1 border-b border-gray-200 cursor-pointer"
                onClick={(e) => {
                  stopPropagation(e);
                  onSectionSelectAll("active");
                }}
              >
                <span className="text-blue-900 font-bold text-xs sm:text-sm">
                  Active Users
                </span>
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                    isActiveSectionAllChecked
                      ? "border-blue-900 bg-blue-900 text-white"
                      : "border-blue-900 bg-white hover:bg-blue-50"
                  }`}
                >
                  {isActiveSectionAllChecked && (
                    <Check
                      size={isMobile ? 12 : 14}
                      className="stroke-current"
                    />
                  )}
                </span>
              </div>
              {filteredActive.map((name) => (
                <UserItem
                  key={name}
                  name={name}
                  isSelected={selectedValues.includes(name)}
                  onSelect={onUserSelect}
                  isSmallScreen={isMobile}
                />
              ))}
            </div>
          )}

          {filteredArchived.length > 0 && (
            <div className="mt-3">
              <div
                className="flex items-center justify-between px-2 py-1 mb-1 border-b border-gray-200 cursor-pointer"
                onClick={(e) => {
                  stopPropagation(e);
                  onSectionSelectAll("archived");
                }}
              >
                <span className="text-blue-900 font-bold text-xs sm:text-sm">
                  Archived Users
                </span>
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                    isArchivedSectionAllChecked
                      ? "border-blue-900 bg-blue-900 text-white"
                      : "border-blue-900 bg-white hover:bg-blue-50"
                  }`}
                >
                  {isArchivedSectionAllChecked && (
                    <Check
                      size={isMobile ? 12 : 14}
                      className="stroke-current"
                    />
                  )}
                </span>
              </div>
              {filteredArchived.map((name) => (
                <UserItem
                  key={name}
                  name={name}
                  isSelected={selectedValues.includes(name)}
                  onSelect={onUserSelect}
                  isSmallScreen={isMobile}
                />
              ))}
            </div>
          )}

          {filteredActive.length === 0 && filteredArchived.length === 0 && (
            <div className="text-center text-gray-500 py-3">
              <p className="text-xs sm:text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(dropdownContent, document.body);
};

export default React.memo(DropdownContent);
