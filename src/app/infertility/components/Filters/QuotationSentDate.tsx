import { Button, DropdownMenu } from "@radix-ui/themes";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file

interface QuotationSentDateProps {
  onSelect: (value: { start: string | null; end: string | null }) => void;
  defaultValue: { start: string | null; end: string | null };
}

const QuotationSentDate = ({
  onSelect,
  defaultValue,
}: QuotationSentDateProps) => {
  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : null;
  const [value, setValue] = useState(
    defaultValue.start && defaultValue.end
      ? `${formatDate(defaultValue.start)} - ${formatDate(defaultValue.end)}`
      : "Select"
  );
  const [tempValue, setTempValue] = useState(
    defaultValue.start && defaultValue.end
      ? `${formatDate(defaultValue.start)} - ${formatDate(defaultValue.end)}`
      : "Select"
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState({
    startDate: defaultValue.start ? new Date(defaultValue.start) : new Date(),
    endDate: defaultValue.end ? new Date(defaultValue.end) : new Date(),
    
    key: "selection",
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setValue(
      defaultValue.start && defaultValue.end
        ? `${formatDate(defaultValue.start)} - ${formatDate(defaultValue.end)}`
        : "Select"
    );
    setTempValue(
      defaultValue.start && defaultValue.end
        ? `${formatDate(defaultValue.start)} - ${formatDate(defaultValue.end)}`
        : "Select"
    );
  }, [defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`; // 40px for padding
    }
  }, [value]);

  const handleSelect = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setSelectionRange({ startDate, endDate, key: "selection" });
    setTempValue(
      `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setValue(tempValue);
      onSelect({
        start: selectionRange.startDate.toISOString().split("T")[0],
        end: selectionRange.endDate.toISOString().split("T")[0],
      });
    }
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger>
        <Button
          ref={buttonRef}
          variant="soft"
          className="dropdown-trigger-button"
          style={{
            backgroundColor: "white",
            color: "black",
            border: "1px solid #00000040",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            textWrap: "nowrap",
            padding: "10px 20px",
            whiteSpace: "nowrap",
            transition:
              "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "pointer",
            height: "50px", // Increased height
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#6078FF";
            e.currentTarget.style.color = "#6078FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#00000040";
            e.currentTarget.style.color = "black";
          }}
        >
          <span ref={spanRef}>Filter Quotation Sent Date: {value}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "auto", padding: "10px" }}
      >
        <DateRangePicker
          ranges={[selectionRange]}
          onChange={handleSelect}
          moveRangeOnFirstSelection={false}
          months={2}
          direction="horizontal"
        />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default QuotationSentDate;
