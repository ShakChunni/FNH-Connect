import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMediaQuery } from "react-responsive";

interface User {
  id: number;
  username: string;
  archived: boolean;
}

interface PICDropdownProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
  fetchedPics: User[];
}

const PICDropdown = ({
  onSelect,
  defaultValue = [],
  fetchedPics,
}: PICDropdownProps) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  const getFilteredValues = useMemo(() => {
    const activeUsers = fetchedPics.filter((u) => !u.archived);
    return activeUsers.map((u) => capitalizeFirstLetter(u.username));
  }, [fetchedPics, capitalizeFirstLetter]);

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<"all" | "specific">("all");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  // Initialize values and selected state
  useEffect(() => {
    setValues(getFilteredValues);

    // Handle default values
    if (defaultValue.length > 0) {
      // If default values include all items, treat as "All" state
      if (
        defaultValue.length === getFilteredValues.length &&
        defaultValue.every((v) => getFilteredValues.includes(v))
      ) {
        setSelectedValues(getFilteredValues);
        // Keep tempSelectedValues empty for UI display (no checkmarks)
        setTempSelectedValues([]);
        setDisplayMode("all");
      } else {
        // Specific items are selected
        setSelectedValues(defaultValue);
        setTempSelectedValues(defaultValue);
        setDisplayMode("specific");
      }
    } else {
      // Default to "All" state - select all actual values but don't check them in UI
      setSelectedValues(getFilteredValues);
      // Keep tempSelectedValues empty for UI display (no checkmarks)
      setTempSelectedValues([]);
      setDisplayMode("all");
    }
  }, [getFilteredValues, defaultValue]);

  // Adjust button width based on content
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
        // Remove the value if it's already selected
        const newValues = prev.filter((v) => v !== value);
        return newValues;
      } else {
        // Add the value
        return [...prev, value];
      }
    });
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // When closing dropdown, determine the final selected values
        if (tempSelectedValues.length === 0) {
          // No selections, default to all values (but no checkmarks)
          setSelectedValues(getFilteredValues);
          setTempSelectedValues([]);
          setDisplayMode("all");
          onSelect(getFilteredValues);
        } else if (tempSelectedValues.length === values.length) {
          // All items are selected = "All" display mode
          // Keep actual values but clear checkmarks
          setSelectedValues(values);
          setTempSelectedValues([]);
          setDisplayMode("all");
          onSelect(values);
        } else {
          // Some specific items are selected
          setSelectedValues(tempSelectedValues);
          setDisplayMode("specific");
          onSelect(tempSelectedValues);
        }
      } else {
        // When opening, if we're in "all" mode, keep tempSelectedValues empty
        if (displayMode === "all") {
          setTempSelectedValues([]);
        }
      }
    },
    [tempSelectedValues, values, onSelect, getFilteredValues, displayMode]
  );

  const displayText = useMemo(() => {
    if (displayMode === "all") {
      return "All";
    }
    if (selectedValues.length > 0) {
      return selectedValues.join(", ");
    }
    return "Select";
  }, [selectedValues, displayMode]);

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
            border: "1px solid #f3f4f6", // gray-100
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
            height: "50px", // Fixed height to match DateSelector
            fontSize: isSmallScreen ? "14px" : "16px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // shadow-md
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#1e3a8a"; // blue-950
            e.currentTarget.style.color = "#1e3a8a"; // blue-950
            e.currentTarget.style.borderWidth = "2px";
            e.currentTarget.style.borderRadius = "12px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#f3f4f6"; // gray-100
            e.currentTarget.style.color = "black";
            e.currentTarget.style.borderWidth = "1px";
            e.currentTarget.style.borderRadius = "10px";
          }}
        >
          <span ref={spanRef}>User: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "200px" }}
      >
        {/* Individual user options */}
        {values.map((name) => (
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
                    ? "#1a3b66"
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
              <Text style={{ fontSize: isSmallScreen ? "12px" : "16px" }}>
                {name}
              </Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default PICDropdown;
