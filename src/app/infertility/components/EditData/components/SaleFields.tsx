import React, {
  ChangeEvent,
  FocusEvent,
  useState,
  memo,
  useCallback,
} from "react";
import { useMediaQuery } from "react-responsive";

interface SaleFieldsProps {
  proposedValue: number | null;
  closedSale: number | null;
  onProposedValueChange: (value: number | null) => void;
  onClosedSaleChange: (value: number | null) => void;
  proposalSigned: string;
  inputClassName: (value: string) => string;
}

const SaleFields: React.FC<SaleFieldsProps> = memo(
  ({
    proposedValue,
    closedSale,
    onProposedValueChange,
    onClosedSaleChange,
    proposalSigned,
    inputClassName,
  }) => {
    const [proposedValueTouched, setProposedValueTouched] = useState(false);
    const [closedSaleTouched, setClosedSaleTouched] = useState(false);

    // Add media queries for responsive design
    const isMobile = useMediaQuery({ maxWidth: 639 });
    const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });

    const handleInputChange = useCallback(
      (onChange: (value: number | null) => void) =>
        (e: ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value === "") {
            onChange(null);
          } else {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
              onChange(numValue);
            }
          }
        },
      []
    );

    const handleBlur = useCallback(
      (setTouched: React.Dispatch<React.SetStateAction<boolean>>) =>
        (e: FocusEvent<HTMLInputElement>) => {
          setTouched(true);
        },
      []
    );

    const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.includes(".")) {
        e.target.setSelectionRange(0, value.indexOf("."));
      }
    }, []);

    const preventScrollChange = useCallback(
      (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.currentTarget.blur();
      },
      []
    );

    const getContainerClassName = useCallback((value: number | null) => {
      const baseClasses =
        "flex items-center rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-12 sm:h-14";

      if (value === null) {
        return `bg-gray-50 border border-gray-300 ${baseClasses}`;
      } else {
        return `bg-white border-2 border-green-700 ${baseClasses}`;
      }
    }, []);
    return (
      <>
        <div className="mb-3 sm:mb-4 relative">
          <label
            htmlFor="proposedValue"
            className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2"
          >
            Total Proposed Value
          </label>
          <div className={getContainerClassName(proposedValue)}>
            <div
              className={`bg-gray-100 h-full flex items-center justify-center ${
                isMobile ? "px-2" : "px-3 sm:px-4"
              } border-r border-gray-300`}
            >
              <span
                className={`text-gray-800 font-semibold ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                RM
              </span>
            </div>
            <input
              type="number"
              id="proposedValue"
              min="0"
              step="1"
              value={proposedValue === null ? "" : proposedValue}
              onChange={handleInputChange(onProposedValueChange)}
              onBlur={handleBlur(setProposedValueTouched)}
              onFocus={handleFocus}
              onWheel={preventScrollChange}
              placeholder="Enter Proposed sale value"
              className={`flex-1 h-full outline-none ${
                isMobile ? "px-2" : "px-3 sm:px-4"
              } text-[#2A3136] ${
                proposedValue === null ? "bg-gray-50" : "bg-white"
              } ${
                isMobile ? "text-xs" : "text-sm"
              } placeholder:text-gray-400 placeholder:font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>
        </div>
        <div className="mb-3 sm:mb-4 relative">
          <label
            htmlFor="closedSale"
            className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2"
          >
            Total Closed Sale
          </label>
          <div className={getContainerClassName(closedSale)}>
            <div
              className={`bg-gray-100 h-full flex items-center justify-center ${
                isMobile ? "px-2" : "px-3 sm:px-4"
              } border-r border-gray-300`}
            >
              <span
                className={`text-gray-800 font-semibold ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                RM
              </span>
            </div>
            <input
              type="number"
              id="closedSale"
              min="0"
              step="1"
              value={closedSale === null ? "" : closedSale}
              onChange={handleInputChange(onClosedSaleChange)}
              onBlur={handleBlur(setClosedSaleTouched)}
              onFocus={handleFocus}
              onWheel={preventScrollChange}
              placeholder="Enter Closed sale value"
              className={`flex-1 h-full outline-none ${
                isMobile ? "px-2" : "px-3 sm:px-4"
              } text-[#2A3136] ${
                closedSale === null ? "bg-gray-50" : "bg-white"
              } ${
                isMobile ? "text-xs" : "text-sm"
              } placeholder:text-gray-400 placeholder:font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>
        </div>
      </>
    );
  }
);

SaleFields.displayName = "SaleFields";

export default SaleFields;
