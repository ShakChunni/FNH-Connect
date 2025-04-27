import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AssignOrganizationDropdownProps {
  onSelect: (selectedOrganizations: string[]) => void;
  defaultValue?: string[];
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  hasChanged: boolean;
  role: string;
  username: string;
}

const organizationOptions = {
  mavn: "MAVN",
  mi: "TMI",
};

const AssignOrganizationDropdown: React.FC<AssignOrganizationDropdownProps> = ({
  onSelect,
  defaultValue = [],
  onDropdownToggle,
  onDropdownOpenStateChange,
  hasChanged,
  role,
}) => {
  const [selectedOrganizations, setSelectedOrganizations] =
    useState<string[]>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSelectedOrganizations(defaultValue);
  }, [defaultValue]);

  const handleOptionClick = (organization: string) => {
    setSelectedOrganizations((prevSelected) => {
      const isSelected = prevSelected.includes(organization);
      const newSelected = isSelected
        ? prevSelected.filter((item) => item !== organization)
        : [...prevSelected, organization];
      return newSelected;
    });
  };

  useEffect(() => {
    onSelect(selectedOrganizations);
  }, [selectedOrganizations, onSelect]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) {
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleOpenChange(!isOpen);
  };

  const buttonClassName = `w-full px-4 py-2 h-14 flex items-center justify-between text-gray-700 rounded-lg shadow-sm ease-in-out hover:shadow-md transition-shadow duration-300 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700 ${
    hasChanged
      ? "bg-white border-2 border-green-500"
      : "bg-[#F0F4F8] border border-gray-300"
  }`;

  return (
    <div className="relative isolate">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className={buttonClassName}
      >
        <span className="">
          {selectedOrganizations.length > 0
            ? selectedOrganizations
                .map(
                  (org) =>
                    organizationOptions[org as keyof typeof organizationOptions]
                )
                .join(", ")
            : "Assign Organization"}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-in-out ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
          >
            <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
              {Object.entries(organizationOptions).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center w-full p-2 rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-blue-50 group"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                      <input
                        type="checkbox"
                        id={key}
                        checked={selectedOrganizations.includes(key)}
                        onChange={() => handleOptionClick(key)}
                        className="peer appearance-none w-4 h-4 rounded border-2 border-gray-300 cursor-pointer transition-all duration-300 ease-in-out checked:border-blue-500 checked:bg-blue-500 focus:ring-offset-0 focus:ring-2 focus:ring-blue-200"
                      />
                      <svg
                        className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-300 ease-in-out"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700 truncate transition-all duration-300 ease-in-out group-hover:text-blue-900">
                      {label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignOrganizationDropdown;
