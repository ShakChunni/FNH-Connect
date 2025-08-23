import React, { useState, useEffect, useCallback, useRef, FC } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import CustomCalendar from "./CustomCalendar";

interface ProposalSignedDateDropdownProps {
  onSelect: (value: Date) => void;
  defaultValue?: Date | null;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  hasChanged: boolean;
  prospectDate: Date | null;
  meetingDate: Date | null;
  proposalInProgressDate: Date | null;
  proposalSentDate: Date | null;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
}

// Helper function to create a timezone-safe date at noon
const createSafeDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day, 12, 0, 0, 0);
};

const normalizeDateToNoon = (date: Date): Date => {
  return createSafeDate(date.getFullYear(), date.getMonth(), date.getDate());
};

const getTodayAtNoon = (): Date => {
  const today = new Date();
  return createSafeDate(today.getFullYear(), today.getMonth(), today.getDate());
};

const ProposalSignedDateDropdown: FC<ProposalSignedDateDropdownProps> = ({
  onSelect,
  defaultValue = null,
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  hasChanged,
  prospectDate,
  meetingDate,
  proposalInProgressDate,
  proposalSentDate,
  onMessage,
  messagePopupRef,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    defaultValue ? normalizeDateToNoon(defaultValue) : null
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (defaultValue) {
      setSelectedDate(normalizeDateToNoon(defaultValue));
    }
  }, [defaultValue]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    onDropdownToggle(false);
    onDropdownOpenStateChange(false);
  }, [onDropdownToggle, onDropdownOpenStateChange]);

  const handleDateSelect = useCallback(
    (day: Date) => {
      const normalizedDate = normalizeDateToNoon(day);
      const todayAtNoon = getTodayAtNoon();

      if (normalizedDate > todayAtNoon) {
        onMessage("error", "Selected date cannot be in the future.");
        return;
      } else if (
        prospectDate &&
        normalizedDate < normalizeDateToNoon(prospectDate)
      ) {
        onMessage(
          "error",
          "Proposal signed date cannot be older than prospect date."
        );
        return;
      } else if (
        meetingDate &&
        normalizedDate < normalizeDateToNoon(meetingDate)
      ) {
        onMessage(
          "error",
          "Proposal signed date cannot be older than meeting date."
        );
        return;
      } else if (
        proposalInProgressDate &&
        normalizedDate < normalizeDateToNoon(proposalInProgressDate)
      ) {
        onMessage(
          "error",
          "Proposal signed date cannot be older than proposal in progress date."
        );
        return;
      } else if (
        proposalSentDate &&
        normalizedDate < normalizeDateToNoon(proposalSentDate)
      ) {
        onMessage(
          "error",
          "Proposal signed date cannot be older than proposal sent date."
        );
        return;
      }
      setSelectedDate(normalizedDate);
      onSelect(normalizedDate);
      closeDropdown();
    },
    [
      onSelect,
      closeDropdown,
      prospectDate,
      meetingDate,
      proposalInProgressDate,
      proposalSentDate,
      onMessage,
    ]
  );

  const updatePortalPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const calendarHeight = 360;
      const calendarWidth = 300;

      let top = rect.bottom + 4;
      let left = rect.left;

      if (top + calendarHeight > viewportHeight) {
        top = rect.top - calendarHeight - 4;
      }
      if (left + calendarWidth > viewportWidth) {
        left = viewportWidth - calendarWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setPortalPosition({ top, left });
    }
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        updatePortalPosition();
      }
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange, updatePortalPosition]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Element;
      const isYearDropdownClick =
        target.closest("[data-year-dropdown]") !== null ||
        target.hasAttribute("data-year-dropdown");

      if (
        isOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(
          messagePopupRef.current &&
          messagePopupRef.current.contains(event.target as Node)
        ) &&
        !isYearDropdownClick
      ) {
        closeDropdown();
      }
    },
    [closeDropdown, isOpen, messagePopupRef]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      const handleScroll = (event: Event) => {
        const target = event.target as Element;
        if (
          target.hasAttribute?.("data-year-dropdown") ||
          target.closest?.("[data-year-dropdown]")
        ) {
          return;
        }
        closeDropdown();
      };

      const handleResize = () => {
        updatePortalPosition();
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, { capture: true });
      };
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, handleClickOutside, updatePortalPosition, closeDropdown]);

  const getButtonClassName = useCallback(() => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (!selectedDate) {
      return `bg-gray-50 border border-gray-300 ${baseClasses}`;
    } else {
      return `bg-white border-2 border-green-700 ${baseClasses}`;
    }
  }, [selectedDate]);

  return (
    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className={getButtonClassName()}
      >
        <span
          className={`${
            selectedDate
              ? "text-[#2A3136] font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedDate
            ? format(selectedDate, "dd/MM/yyyy")
            : "Select Proposal Signed Date"}
        </span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                ref={calendarRef}
                style={{
                  position: "fixed",
                  top: portalPosition.top,
                  left: portalPosition.left,
                  zIndex: 99999,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomCalendar
                    selectedDisplayDate={selectedDate}
                    handleDateSelect={handleDateSelect}
                    colorScheme="emerald"
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default ProposalSignedDateDropdown;
