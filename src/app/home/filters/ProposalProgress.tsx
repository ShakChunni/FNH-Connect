import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useMemo, useRef } from "react";

interface TypeDropdownProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue: string[];
}

const TypeDropdown = ({ onSelect, defaultValue }: TypeDropdownProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
  const [tempSelectedValues, setTempSelectedValues] =
    useState<string[]>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSelectedValues(defaultValue);
    setTempSelectedValues(defaultValue);
  }, [defaultValue]);

  const values = useMemo(
    () => ["Meeting Conducted", "In Progress", "Sent Out", "Signed"],
    []
  );

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`; // 40px for padding
    }
  }, [selectedValues]);

  const handleCheckboxChange = (value: string) => {
    const newSelectedValues = tempSelectedValues.includes(value)
      ? tempSelectedValues.filter((v) => v !== value)
      : [...tempSelectedValues, value];
    setTempSelectedValues(newSelectedValues);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedValues(tempSelectedValues);
      onSelect(tempSelectedValues);
    }
  };

  const displayText =
    selectedValues.length > 0 ? selectedValues.join(", ") : "Select";

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
            borderRadius: "10px", // Changed border radius to 10px
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
          <span ref={spanRef}>Proposal Progression: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "300px" }}
      >
        {values.map((value) => (
          <DropdownMenu.Item
            asChild
            key={value}
            onSelect={(e) => e.preventDefault()}
            style={{ cursor: "pointer" }}
          >
            <Flex
              justify="start"
              align="center"
              gap="10px"
              onClick={() => handleCheckboxChange(value)}
              style={{ cursor: "pointer" }}
            >
              <Checkbox
                checked={tempSelectedValues.includes(value)}
                style={{
                  width: "16px",
                  height: "16px",
                  border: "1px solid #00000040",
                  borderRadius: "4px",
                  backgroundColor: tempSelectedValues.includes(value)
                    ? "#6078FF"
                    : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {tempSelectedValues.includes(value) && (
                  <CheckIcon color="#fff" fontWeight={600} />
                )}
              </Checkbox>
              <Text>{value}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default TypeDropdown;
