import React, { FC, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Check } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import LocationItem from "./LocationItem";
import { createPortal } from "react-dom";
import { FixedSizeList as List } from "react-window";

interface DropdownContentProps {
  preferredValues: string[];
  otherValues: string[];
  selectedValues: string[];
  onLocationSelect: (value: string) => void;
  onSectionSelectAll: (section: "preferred" | "other") => void;
  onClearAll: (e: React.MouseEvent) => void;
  isPreferredSectionAllChecked: boolean;
  isOtherSectionAllChecked: boolean;
  isSmallScreen: boolean;
  triggerRect: DOMRect | null;
  setDropdownRef: (ref: HTMLDivElement | null) => void;
}

const DropdownContent: FC<DropdownContentProps> = ({
  preferredValues,
  otherValues,
  selectedValues,
  onLocationSelect,
  onSectionSelectAll,
  onClearAll,
  isPreferredSectionAllChecked,
  isOtherSectionAllChecked,
  isSmallScreen,
  triggerRect,
  setDropdownRef,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Responsive breakpoints using useMediaQuery
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

  const filteredPreferred = preferredValues.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOther = otherValues.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allItems: Array<
    | { type: "header"; section: "preferred" | "other"; isChecked: boolean }
    | {
        type: "item";
        section: "preferred" | "other";
        name: string;
        isSelected: boolean;
      }
  > = [];

  if (filteredPreferred.length > 0) {
    allItems.push({
      type: "header",
      section: "preferred",
      isChecked: isPreferredSectionAllChecked,
    });

    filteredPreferred.forEach((name) => {
      allItems.push({
        type: "item",
        section: "preferred",
        name,
        isSelected: selectedValues.includes(name),
      });
    });
  }

  if (filteredOther.length > 0) {
    allItems.push({
      type: "header",
      section: "other",
      isChecked: isOtherSectionAllChecked,
    });

    filteredOther.forEach((name) => {
      allItems.push({
        type: "item",
        section: "other",
        name,
        isSelected: selectedValues.includes(name),
      });
    });
  }

  const hasSelectedValues = selectedValues.length > 0;

  const ListItem = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = allItems[index];

    if (item.type === "header") {
      return (
        <div
          className="flex items-center justify-between px-2 py-1 border-b border-gray-200 cursor-pointer"
          onClick={(e) => {
            stopPropagation(e);
            onSectionSelectAll(item.section);
          }}
          style={{
            ...style,
            height: "auto",
            paddingTop: 10,
            paddingBottom: 10,
            marginBottom: 8,
          }}
        >
          <span className="text-blue-900 font-bold text-xs sm:text-sm">
            {item.section === "preferred"
              ? "Preferred Locations"
              : "Other Locations"}
          </span>
          <span
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
              item.isChecked
                ? "border-blue-900 bg-blue-900 text-white"
                : "border-blue-900 bg-white hover:bg-blue-50"
            }`}
          >
            {item.isChecked && (
              <Check size={isMobile ? 12 : 14} className="stroke-current" />
            )}
          </span>
        </div>
      );
    } else {
      return (
        <LocationItem
          key={item.name}
          name={item.name}
          isSelected={item.isSelected}
          onSelect={onLocationSelect}
          isSmallScreen={isMobile}
          style={{
            ...style,
            height: "auto",
            marginTop: 4,
            marginBottom: 4,
          }}
        />
      );
    }
  };

  const itemSize = isMobile ? 32 : 36;

  const getPositionAndSize = () => {
    if (!triggerRect) return { leftPosition: "0" };

    // Position the dropdown aligned with the left edge of the trigger
    let leftPosition = `${triggerRect.left}px`;

    // Determine dropdown width based on screen size
    const dropdownWidth = isSmallMobile
      ? 200
      : isMobile
      ? 220
      : isXsScreen
      ? 240
      : 260;

    // Make sure dropdown doesn't go off the right edge of the screen
    const currentWidth = window.innerWidth;
    const rightEdge = triggerRect.left + dropdownWidth;

    if (rightEdge > currentWidth - 10) {
      // Adjust position to avoid right edge overflow
      leftPosition = `${Math.max(10, currentWidth - dropdownWidth - 10)}px`;
    }

    return { leftPosition };
  };
  const { leftPosition } = getPositionAndSize();

  // Responsive height calculation
  const getListHeight = () => {
    const baseHeight = Math.min(300, allItems.length * itemSize);

    if (isSmallMobile) return Math.min(250, baseHeight);
    if (isMobile) return Math.min(275, baseHeight);
    if (isMdScreen) return Math.min(300, baseHeight);
    if (isLgScreen) return Math.min(325, baseHeight);
    return Math.min(350, baseHeight); // XL and above
  };

  const listHeight = getListHeight();

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
      data-dropdown="location"
    >
      <div className="flex flex-col p-2 sm:p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-blue-900 font-bold text-xs sm:text-sm">
            Locations
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
            placeholder="Search locations..."
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

        {allItems.length > 0 ? (
          <div
            className="overflow-hidden pr-1"
            style={{ height: listHeight }}
            onScroll={stopScrollPropagation}
            onWheel={stopWheelPropagation}
            data-dropdown-content="true"
          >
            <List
              height={listHeight}
              width="100%"
              itemCount={allItems.length}
              itemSize={itemSize}
              overscanCount={5}
              className="locationsList"
              data-dropdown-content="true"
            >
              {ListItem}
            </List>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-3">
            <p className="text-xs sm:text-sm">No locations found</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(dropdownContent, document.body);
};

export default React.memo(DropdownContent);
