import React, {
  ChangeEvent,
  FocusEvent,
  useState,
  memo,
  useCallback,
} from "react";

interface SaleFieldsProps {
  proposedValue: number | null;
  closedSale: number | null;
  onProposedValueChange: (value: number | null) => void;
  onClosedSaleChange: (value: number | null) => void;
  proposalSigned: string;
}

const SaleFields: React.FC<SaleFieldsProps> = memo(
  ({
    proposedValue,
    closedSale,
    onProposedValueChange,
    onClosedSaleChange,
    proposalSigned,
  }) => {
    const [proposedValueTouched, setProposedValueTouched] = useState(false);
    const [closedSaleTouched, setClosedSaleTouched] = useState(false);

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

    const getContainerClassName = useCallback(
      (value: number | null, touched: boolean) => `
        flex items-center h-14 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300
        ${
          touched && value !== null
            ? "border border-green-700 ring-1 ring-green-700 focus-within:border-blue-950 focus-within:ring-2 focus-within:ring-blue-950"
            : "border border-gray-300 focus-within:border-blue-950 focus-within:ring-2 focus-within:ring-blue-950"
        }
        ${
          proposalSigned === "Yes" && value === null
            ? "border-red-700 border ring-2 ring-red-700"
            : ""
        }
      `,
      [proposalSigned]
    );

    return (
      <>
        <div className="mb-4 relative">
          <label
            htmlFor="proposedValue"
            className="block text-[#001F3F] text-base font-bold mb-2"
          >
            Total Proposed Value
          </label>
          <div
            className={getContainerClassName(
              proposedValue,
              proposedValueTouched
            )}
          >
            <div className="bg-gray-100 h-full flex items-center justify-center px-4 border-r border-gray-300">
              <span className="text-gray-800 font-semibold">RM</span>
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
              className="flex-1 h-full outline-none px-4 text-[#2A3136] bg-white text-sm placeholder:text-gray-400 placeholder:font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="mb-4 relative">
          <label
            htmlFor="closedSale"
            className="block text-[#001F3F] text-base font-bold mb-2"
          >
            Total Closed Sale
          </label>
          <div className={getContainerClassName(closedSale, closedSaleTouched)}>
            <div className="bg-gray-100 h-full flex items-center justify-center px-4 border-r border-gray-300">
              <span className="text-gray-800 font-semibold">RM</span>
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
              className="flex-1 h-full outline-none px-4 text-[#2A3136] bg-white text-sm placeholder:text-gray-400 placeholder:font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </>
    );
  }
);

SaleFields.displayName = "SaleFields";

export default SaleFields;
