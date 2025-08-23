import React, {
  FC,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { ChevronDown } from "lucide-react";
import DropdownContent from "./components/DropdownContent";
import countriesData from "world-countries/countries.json";

interface LocationDropdownProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
  style?: React.CSSProperties;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const LocationDropdown: FC<LocationDropdownProps> = ({
  onSelect,
  defaultValue = [],
  style,
  onDropdownToggle,
}) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const lastScrollY = useRef<number>(0);

  const preferredCountries = useMemo(() => ["Malaysia", "Singapore"], []);

  const allCountries = useMemo(() => {
    const countriesList = countriesData.map((country) => country.name.common);
    const filteredList = countriesList.filter(
      (country) => !preferredCountries.includes(country)
    );
    return {
      preferred: preferredCountries,
      other: filteredList,
    };
  }, [preferredCountries]);

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<
    "all" | "allWithPreferred" | "specific"
  >("all");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (defaultValue.length > 0) {
      const hasAllPreferred = allCountries.preferred.every((v) =>
        defaultValue.includes(v)
      );
      const hasAnyOther = allCountries.other.some((v) =>
        defaultValue.includes(v)
      );

      if (hasAllPreferred && !hasAnyOther) {
        setSelectedValues(allCountries.preferred);
        setTempSelectedValues([]);
        setDisplayMode("all");
      } else if (hasAllPreferred && hasAnyOther) {
        const otherSelected = defaultValue.filter((v) =>
          allCountries.other.includes(v)
        );
        setSelectedValues([...allCountries.preferred, ...otherSelected]);
        setTempSelectedValues([...otherSelected]);
        setDisplayMode("allWithPreferred");
      } else {
        setSelectedValues(defaultValue);
        setTempSelectedValues(defaultValue);
        setDisplayMode("specific");
      }
    } else {
      setSelectedValues([]);
      setTempSelectedValues([]);
      setDisplayMode("all");
    }
  }, [allCountries, defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValues]);

  const processFinalSelection = useCallback(() => {
    const hasAllPreferred = allCountries.preferred.every((v) =>
      tempSelectedValues.includes(v)
    );
    const otherSelected = tempSelectedValues.filter((v) =>
      allCountries.other.includes(v)
    );
    const hasAnyOther = otherSelected.length > 0;

    if (tempSelectedValues.length === 0) {
      setSelectedValues([]);
      setTempSelectedValues([]);
      setDisplayMode("all");
      onSelect([]);
    } else if (
      hasAllPreferred &&
      !hasAnyOther &&
      tempSelectedValues.length === allCountries.preferred.length
    ) {
      setSelectedValues(allCountries.preferred);
      setTempSelectedValues([]);
      setDisplayMode("specific");
      onSelect(allCountries.preferred);
    } else if (
      hasAllPreferred &&
      hasAnyOther &&
      tempSelectedValues.length ===
        allCountries.preferred.length + otherSelected.length
    ) {
      setSelectedValues([...allCountries.preferred, ...otherSelected]);
      setTempSelectedValues([...otherSelected]);
      setDisplayMode("allWithPreferred");
      onSelect([...allCountries.preferred, ...otherSelected]);
    } else {
      setSelectedValues(tempSelectedValues);
      setDisplayMode("specific");
      onSelect(tempSelectedValues);
    }
  }, [tempSelectedValues, allCountries, onSelect]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && buttonRef.current) {
        setTriggerRect(buttonRef.current.getBoundingClientRect());
        lastScrollY.current = window.scrollY;
      }

      setIsOpen(open);
      if (onDropdownToggle) onDropdownToggle(open);

      if (!open) {
        processFinalSelection();
      } else {
        if (displayMode === "all" && selectedValues.length > 0) {
          setTempSelectedValues([...selectedValues]);
        } else if (displayMode === "allWithPreferred") {
          const otherSelected = selectedValues.filter((v) =>
            allCountries.other.includes(v)
          );
          setTempSelectedValues([...allCountries.preferred, ...otherSelected]);
        } else {
          setTempSelectedValues([...selectedValues]);
        }
      }
    },
    [
      allCountries,
      displayMode,
      selectedValues,
      onSelect,
      onDropdownToggle,
      processFinalSelection,
    ]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;
      const isButtonClick = buttonRef.current?.contains(target);
      const isContentClick = contentRef && contentRef.contains(target);

      if (!isButtonClick && !isContentClick) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
        processFinalSelection();
      }
    };

    let isMouseOverDropdown = false;

    const handleMouseEnterDropdown = () => {
      isMouseOverDropdown = true;
    };

    const handleMouseLeaveDropdown = () => {
      isMouseOverDropdown = false;
    };

    const handleWindowScroll = (event?: Event) => {
      if (!isOpen) return;

      // If mouse is over dropdown, don't close
      if (isMouseOverDropdown) {
        return;
      }

      // If event has a target, check if scroll happened inside dropdown
      if (event && event.target) {
        const target = event.target as Node;

        // Check if scrolling within dropdown content
        if (
          contentRef &&
          (contentRef === target || contentRef.contains(target))
        ) {
          return;
        }

        // Check for List component or any element with locationsList class
        const targetElement = target as Element;
        if (
          targetElement.classList &&
          (targetElement.classList.contains("locationsList") ||
            targetElement.closest(".locationsList"))
        ) {
          return;
        }
      }

      setIsOpen(false);
      if (onDropdownToggle) onDropdownToggle(false);
      processFinalSelection();
    };

    const handlePositionChange = () => {
      if (!isOpen || !buttonRef.current) return;

      const newRect = buttonRef.current.getBoundingClientRect();
      if (!triggerRect) return;

      const hasPositionChanged =
        Math.abs(newRect.top - triggerRect.top) > 5 ||
        Math.abs(newRect.left - triggerRect.left) > 5;

      if (hasPositionChanged) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
        processFinalSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Update the event listener to pass the event object
    const scrollHandler = (event: Event) => handleWindowScroll(event);
    window.addEventListener("scroll", scrollHandler, {
      capture: true,
      passive: true,
    });

    window.addEventListener("resize", handlePositionChange);

    if (contentRef) {
      contentRef.addEventListener("mouseenter", handleMouseEnterDropdown);
      contentRef.addEventListener("mouseleave", handleMouseLeaveDropdown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", scrollHandler, {
        capture: true,
      });
      window.removeEventListener("resize", handlePositionChange);

      if (contentRef) {
        contentRef.removeEventListener("mouseenter", handleMouseEnterDropdown);
        contentRef.removeEventListener("mouseleave", handleMouseLeaveDropdown);
      }
    };
  }, [
    isOpen,
    onDropdownToggle,
    contentRef,
    processFinalSelection,
    triggerRect,
  ]);

  const handleSectionSelectAll = useCallback(
    (section: "preferred" | "other") => {
      setTempSelectedValues((prev) => {
        if (section === "preferred") {
          const allPreferredSelected = allCountries.preferred.every((v) =>
            prev.includes(v)
          );
          if (allPreferredSelected) {
            return prev.filter((v) => !allCountries.preferred.includes(v));
          } else {
            return Array.from(new Set([...prev, ...allCountries.preferred]));
          }
        } else {
          const allOtherSelected = allCountries.other.every((v) =>
            prev.includes(v)
          );
          if (allOtherSelected) {
            return prev.filter((v) => !allCountries.other.includes(v));
          } else {
            return Array.from(new Set([...prev, ...allCountries.other]));
          }
        }
      });
    },
    [allCountries]
  );

  const handleCheckboxChange = useCallback((value: string) => {
    setTempSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const clearAllLocations = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setTempSelectedValues([]);
  }, []);

  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return "All";
    }

    if (displayMode === "specific") {
      if (selectedValues.length === 1) {
        return selectedValues[0];
      }
      return `${selectedValues.length} locations`;
    }

    if (displayMode === "allWithPreferred") {
      const otherSelected = selectedValues.filter((v) =>
        allCountries.other.includes(v)
      );
      const totalSelected =
        allCountries.preferred.length + otherSelected.length;

      if (otherSelected.length === 1) {
        return `${totalSelected} locations`;
      }
      if (otherSelected.length > 1) {
        return `${totalSelected} locations`;
      }
      return `${allCountries.preferred.length} locations`;
    }

    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} locations`;
  }, [selectedValues, displayMode, allCountries]);

  const isPreferredSectionAllChecked = useMemo(
    () =>
      allCountries.preferred.length > 0 &&
      allCountries.preferred.every((v) => tempSelectedValues.includes(v)),
    [allCountries.preferred, tempSelectedValues]
  );

  const isOtherSectionAllChecked = useMemo(
    () =>
      allCountries.other.length > 0 &&
      allCountries.other.every((v) => tempSelectedValues.includes(v)),
    [allCountries.other, tempSelectedValues]
  );

  return (
    <div ref={dropdownRef} style={style}>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className="dropdown-trigger-button"
        style={{
          backgroundColor: "white",
          color: "black",
          border: "1px solid #f3f4f6",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textWrap: "nowrap",
          padding: "10px 20px",
          whiteSpace: "nowrap",
          transition:
            "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
          height: "50px",
          fontSize: isSmallScreen ? "14px" : "16px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#1e3a8a";
          e.currentTarget.style.color = "#1e3a8a";
          e.currentTarget.style.borderWidth = "2px";
          e.currentTarget.style.borderRadius = "12px";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#f3f4f6";
          e.currentTarget.style.color = "black";
          e.currentTarget.style.borderWidth = "1px";
          e.currentTarget.style.borderRadius = "10px";
        }}
      >
        <span ref={spanRef}>Location: {displayText}</span>
        <span ref={iconRef} className="flex items-center">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <DropdownContent
            preferredValues={allCountries.preferred}
            otherValues={allCountries.other}
            selectedValues={tempSelectedValues}
            onLocationSelect={handleCheckboxChange}
            onSectionSelectAll={handleSectionSelectAll}
            onClearAll={clearAllLocations}
            isPreferredSectionAllChecked={isPreferredSectionAllChecked}
            isOtherSectionAllChecked={isOtherSectionAllChecked}
            isSmallScreen={isSmallScreen}
            triggerRect={triggerRect}
            setDropdownRef={setContentRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(LocationDropdown);
