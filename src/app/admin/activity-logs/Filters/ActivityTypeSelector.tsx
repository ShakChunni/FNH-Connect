import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

interface ActivityTypeSelectorProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
}

const ActivityTypeSelector = ({
  onSelect,
  defaultValue = [],
}: ActivityTypeSelectorProps) => {
  // Define the activity types with their underlying values and display values
  const activityTypeOptions = useMemo(
    () => [
      { value: "CREATE", display: "CREATE" },
      { value: "UPDATE", display: "UPDATE" },
      { value: "DELETE", display: "DELETE" },
      { value: "TRANSFER", display: "TRANSFER" },
      { value: "ACTIVE", display: "ACTIVE" },
      { value: "INACTIVE", display: "INACTIVE" },
      { value: "LOGIN", display: "LOGIN" },
      { value: "LOGOUT", display: "LOGOUT" },
      { value: "CREATE_AD_HOC_TASK", display: "CREATE AD HOC TASK" },
      { value: "UPDATE_AD_HOC_TASK", display: "UPDATE AD HOC TASK" },
      { value: "COMPLETE_AD_HOC_TASK", display: "COMPLETE AD HOC TASK" },
      { value: "DELETE_AD_HOC_TASK", display: "DELETE AD HOC TASK" },
      { value: "UPDATE_GOAL", display: "UPDATE GOAL" },
    ],
    []
  );

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSelectedValues(defaultValue);
    setTempSelectedValues(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValues]);

  const handleCheckboxChange = useCallback((value: string) => {
    setTempSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        if (tempSelectedValues.length === 0) {
          setTempSelectedValues(selectedValues);
        } else {
          setSelectedValues(tempSelectedValues);
          onSelect(tempSelectedValues);
        }
      }
    },
    [tempSelectedValues, selectedValues, onSelect]
  );

  const displayText = useMemo(() => {
    if (selectedValues.length === activityTypeOptions.length) return "All";
    if (selectedValues.length > 0) {
      const displayValues = selectedValues.map(
        (val) =>
          activityTypeOptions.find((opt) => opt.value === val)?.display || val
      );
      const fullText = displayValues.join(", ");
      // Return the full string if it's 12 chars or less, otherwise truncate
      return fullText.length <= 12
        ? fullText
        : `${fullText.substring(0, 12)}...`;
    }
    return "Select";
  }, [selectedValues, activityTypeOptions]);
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
          <span ref={spanRef}>Activity Type: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "280px" }}
      >
        {activityTypeOptions.map(({ value, display }) => (
          <DropdownMenu.Item
            asChild
            key={value}
            onSelect={(e) => e.preventDefault()}
            style={{ cursor: "pointer" }}
          >
            <Flex
              justify="start"
              align="center"
              gap="12px"
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
                    ? "#1e3a8a"
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
              <Text>{display}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default ActivityTypeSelector;
