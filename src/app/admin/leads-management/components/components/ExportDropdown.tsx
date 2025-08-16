import { useState, useRef, useEffect } from "react";
import { FaFileCsv, FaFilePdf, FaEllipsisV } from "react-icons/fa";

interface ExportDropdownProps {
  onExportCSV: () => void;
}

const ExportDropdown = ({ onExportCSV }: ExportDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="inline-flex justify-center w-full text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <FaEllipsisV />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        >
          <div className="py-1">
            <button
              onClick={onExportCSV}
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <FaFileCsv className="mr-3 h-5 w-5 text-green-500 group-hover:text-green-700" />
              Export as CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
