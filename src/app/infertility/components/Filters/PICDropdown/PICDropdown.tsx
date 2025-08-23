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

interface User {
  id: number;
  username: string;
  archived: boolean;
}

interface PICDropdownProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
  fetchedPics: User[];
  style?: React.CSSProperties;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const PICDropdown: FC<PICDropdownProps> = ({
  onSelect,
  defaultValue = [],
  fetchedPics,
  style,
  onDropdownToggle,
}) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  const { activeUsers, archivedUsers } = useMemo(() => {
    const active = fetchedPics.filter((u) => !u.archived);
    const archived = fetchedPics.filter((u) => u.archived);
    return { activeUsers: active, archivedUsers: archived };
  }, [fetchedPics]);

  const activeValues = useMemo(
    () => activeUsers.map((u) => capitalizeFirstLetter(u.username)),
    [activeUsers, capitalizeFirstLetter]
  );

  const archivedValues = useMemo(
    () => archivedUsers.map((u) => capitalizeFirstLetter(u.username)),
    [archivedUsers, capitalizeFirstLetter]
  );

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<
    "all" | "allWithArchived" | "specific"
  >("all");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const isMouseOverDropdownRef = useRef<boolean>(false);

  useEffect(() => {
    if (defaultValue.length > 0) {
      const hasAllActive = activeValues.every((v) => defaultValue.includes(v));
      const hasAnyArchived = archivedValues.some((v) =>
        defaultValue.includes(v)
      );
      if (hasAllActive && !hasAnyArchived) {
        setSelectedValues(activeValues);
        setTempSelectedValues([]);
        setDisplayMode("all");
      } else if (hasAllActive && hasAnyArchived) {
        const archivedSelected = defaultValue.filter((v) =>
          archivedValues.includes(v)
        );
        setSelectedValues([...activeValues, ...archivedSelected]);
        setTempSelectedValues([...archivedSelected]);
        setDisplayMode("allWithArchived");
      } else {
        setSelectedValues(defaultValue);
        setTempSelectedValues(defaultValue);
        setDisplayMode("specific");
      }
    } else {
      setSelectedValues(activeValues);
      setTempSelectedValues([]);
      setDisplayMode("all");
    }
  }, [activeValues, archivedValues, defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValues]);

  const processFinalSelection = useCallback(() => {
    const hasAllActive = activeValues.every((v) =>
      tempSelectedValues.includes(v)
    );
    const archivedSelected = tempSelectedValues.filter((v) =>
      archivedValues.includes(v)
    );
    const hasAnyArchived = archivedSelected.length > 0;

    if (tempSelectedValues.length === 0) {
      setSelectedValues(activeValues);
      setTempSelectedValues([]);
      setDisplayMode("all");
      onSelect(activeValues);
    } else if (
      hasAllActive &&
      !hasAnyArchived &&
      tempSelectedValues.length === activeValues.length
    ) {
      setSelectedValues(activeValues);
      setTempSelectedValues([]);
      setDisplayMode("all");
      onSelect(activeValues);
    } else if (
      hasAllActive &&
      hasAnyArchived &&
      tempSelectedValues.length ===
        activeValues.length + archivedSelected.length
    ) {
      setSelectedValues([...activeValues, ...archivedSelected]);
      setTempSelectedValues([...archivedSelected]);
      setDisplayMode("allWithArchived");
      onSelect([...activeValues, ...archivedSelected]);
    } else {
      setSelectedValues(tempSelectedValues);
      setDisplayMode("specific");
      onSelect(tempSelectedValues);
    }
  }, [tempSelectedValues, activeValues, archivedValues, onSelect]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && buttonRef.current) {
        setTriggerRect(buttonRef.current.getBoundingClientRect());
      }

      setIsOpen(open);
      if (onDropdownToggle) onDropdownToggle(open);

      if (!open) {
        processFinalSelection();
      } else {
        if (displayMode === "all") {
          setTempSelectedValues([]);
        } else if (displayMode === "allWithArchived") {
          setTempSelectedValues(
            selectedValues.filter((v) => archivedValues.includes(v))
          );
        } else {
          setTempSelectedValues(selectedValues);
        }
      }
    },
    [
      archivedValues,
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
  
    // Better way to track mouseOver state with refs
    const handleMouseEnterDropdown = () => {
      isMouseOverDropdownRef.current = true;
    };
  
    const handleMouseLeaveDropdown = () => {
      isMouseOverDropdownRef.current = false;
    };
  
    const handleWindowScroll = (event?: Event) => {
      if (!isOpen) return;
  
      // If mouse is over dropdown, don't close
      if (isMouseOverDropdownRef.current) {
        return;
      }
  
      // If event has a target, check if scroll happened inside dropdown
      if (event && event.target) {
        const target = event.target as Node;
        
        // Check if scrolling within dropdown content
        if (contentRef && (contentRef === target || contentRef.contains(target))) {
          return;
        }
  
        // Check for data attributes that mark dropdown elements
        if (target instanceof Element) {
          const isDropdownElement = 
            target.hasAttribute("data-dropdown-content") ||
            target.closest('[data-dropdown-content="true"]') !== null ||
            target.closest('[data-dropdown="pic"]') !== null;
            
          if (isDropdownElement) {
            return;
          }
        }
      }
  
      setIsOpen(false);
      if (onDropdownToggle) onDropdownToggle(false);
      processFinalSelection();
    };
  
    // Improved wheel handler to prevent dropdown from closing when scrolling inside
    const handleWheel = (event: WheelEvent) => {
      if (!isOpen) return;
      
      const target = event.target as Node;
      
      // Check if wheel event originated inside dropdown or its content
      if (contentRef && (contentRef === target || contentRef.contains(target))) {
        event.stopPropagation(); // Stop the event from propagating
        return; // Don't close if wheeling inside dropdown
      }
      
      // Check if the target has dropdown-related data attributes
      if (target instanceof Element) {
        const isDropdownElement = 
          target.hasAttribute("data-dropdown-content") ||
          target.closest('[data-dropdown-content="true"]') !== null ||
          target.closest('[data-dropdown="pic"]') !== null;
          
        if (isDropdownElement) {
          event.stopPropagation(); // Stop the event from propagating
          return; // Don't close dropdown
        }
      }
      
      // If we get here, scroll happened outside dropdown
      if (!isMouseOverDropdownRef.current) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
        processFinalSelection();
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    
    // Use wheel event with capture to intercept it early
    document.addEventListener("wheel", handleWheel, {
      capture: true,
    });
  
    // Update scroll handler to use improved logic
    const scrollHandler = (event: Event) => handleWindowScroll(event);
    window.addEventListener("scroll", scrollHandler, {
      capture: true,
    });
  
    if (contentRef) {
      contentRef.addEventListener("mouseenter", handleMouseEnterDropdown);
      contentRef.addEventListener("mouseleave", handleMouseLeaveDropdown);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("scroll", scrollHandler, { capture: true });
  
      if (contentRef) {
        contentRef.removeEventListener("mouseenter", handleMouseEnterDropdown);
        contentRef.removeEventListener("mouseleave", handleMouseLeaveDropdown);
      }
    };
  }, [isOpen, onDropdownToggle, contentRef, processFinalSelection]);










  const handleSectionSelectAll = useCallback(
    (section: "active" | "archived") => {
      setTempSelectedValues((prev) => {
        if (section === "active") {
          const allActiveSelected = activeValues.every((v) => prev.includes(v));
          if (allActiveSelected) {
            return prev.filter((v) => !activeValues.includes(v));
          } else {
            return Array.from(new Set([...prev, ...activeValues]));
          }
        } else {
          const allArchivedSelected = archivedValues.every((v) =>
            prev.includes(v)
          );
          if (allArchivedSelected) {
            return prev.filter((v) => !archivedValues.includes(v));
          } else {
            return Array.from(new Set([...prev, ...archivedValues]));
          }
        }
      });
    },
    [activeValues, archivedValues]
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

  const clearAllUsers = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setTempSelectedValues([]);
  }, []);

  const displayText = useMemo(() => {
    if (displayMode === "all") {
      return "All";
    }
    if (displayMode === "allWithArchived") {
      const archivedSelected = selectedValues.filter((v) =>
        archivedValues.includes(v)
      );
      if (archivedSelected.length === 1) {
        return `All + ${archivedSelected[0]}`;
      }
      if (archivedSelected.length > 1) {
        return `All + ${archivedSelected.length} archived`;
      }
      return "All";
    }
    if (selectedValues.length > 0) {
      if (selectedValues.length === 1) {
        return selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    return "Select";
  }, [selectedValues, displayMode, archivedValues]);

  const isActiveSectionAllChecked = useMemo(
    () =>
      activeValues.length > 0 &&
      activeValues.every((v) => tempSelectedValues.includes(v)),
    [activeValues, tempSelectedValues]
  );

  const isArchivedSectionAllChecked = useMemo(
    () =>
      archivedValues.length > 0 &&
      archivedValues.every((v) => tempSelectedValues.includes(v)),
    [archivedValues, tempSelectedValues]
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
        <span ref={spanRef}>User: {displayText}</span>
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
            activeValues={activeValues}
            archivedValues={archivedValues}
            selectedValues={tempSelectedValues}
            onUserSelect={handleCheckboxChange}
            onSectionSelectAll={handleSectionSelectAll}
            onClearAll={clearAllUsers}
            isActiveSectionAllChecked={isActiveSectionAllChecked}
            isArchivedSectionAllChecked={isArchivedSectionAllChecked}
            isSmallScreen={isSmallScreen}
            triggerRect={triggerRect}
            setDropdownRef={setContentRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(PICDropdown);
