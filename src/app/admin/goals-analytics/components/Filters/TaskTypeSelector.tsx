import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

interface TaskTypeSelectorProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
}

const TaskTypeSelector = ({
  onSelect,
  defaultValue = [],
}: TaskTypeSelectorProps) => {
  const options = useMemo(
    () => [
      "EMAIL",
      "CALL",
      "MESSAGE",
      "MEETING",
      "PROPOSAL",
      "SOCIAL MEDIA",
      "PROSPECT",
      "FOLLOW UP",
      "OTHER",
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
    if (selectedValues.length === options.length) return "All";
    if (selectedValues.length > 0) return selectedValues.join(", ");
    return "Select";
  }, [selectedValues, options]);

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
          <span ref={spanRef}>Task Type: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "200px" }}
      >
        {options.map((name) => (
          <DropdownMenu.Item
            asChild
            key={name}
            onSelect={(e) => e.preventDefault()}
            style={{ cursor: "pointer" }}
          >
            <Flex
              justify="start"
              align="center"
              gap="10px"
              onClick={() => handleCheckboxChange(name)}
              style={{ cursor: "pointer" }}
            >
              <Checkbox
                checked={tempSelectedValues.includes(name)}
                style={{
                  width: "16px",
                  height: "16px",
                  border: "1px solid #00000040",
                  borderRadius: "4px",
                  backgroundColor: tempSelectedValues.includes(name)
                    ? "#1e3a8a"
                    : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {tempSelectedValues.includes(name) && (
                  <CheckIcon color="#fff" fontWeight={600} />
                )}
              </Checkbox>
              <Text>{name}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default TaskTypeSelector;
