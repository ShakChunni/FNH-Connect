import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import React from "react";

interface LeadFilterDropdownProps {
  onSelect: (selectedValue: string) => void;
  defaultValue?: string;
}

const LeadsFilterDropdown: React.FC<LeadFilterDropdownProps> = React.memo(
  ({ onSelect, defaultValue = "All" }) => {
    const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

    const options = [
      { label: "All", value: "All" },
      { label: "Warm Leads", value: "Warm Leads" },
      { label: "Exclude Warm Leads", value: "Exclude Warm Leads" },
    ];

    const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const iconRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      // Update internal state when defaultValue prop changes
      setSelectedValue(defaultValue);
    }, [defaultValue]);

    // Create a display text based on selection
    const displayText = useMemo(() => {
      return selectedValue;
    }, [selectedValue]);

    // Adjust button width based on content
    useEffect(() => {
      if (buttonRef.current && spanRef.current && iconRef.current) {
        // Add a bit of extra padding based on content length
        const extraPadding = displayText.length > 15 ? 20 : 40;
        buttonRef.current.style.width = `${
          spanRef.current.scrollWidth +
          iconRef.current.scrollWidth +
          extraPadding
        }px`;
      }
    }, [displayText]);

    const handleOpenChange = useCallback((open: boolean) => {
      setIsOpen(open);
    }, []);

    const handleSelect = useCallback(
      (value: string) => {
        setSelectedValue(value);
        onSelect(value);
        setIsOpen(false);
      },
      [onSelect]
    );

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
            <span ref={spanRef}>Lead Source: {displayText}</span>
            <span ref={iconRef}>
              <DropdownMenu.TriggerIcon />
            </span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={
            isOpen ? "animate-dropdown-open" : "animate-dropdown-close"
          }
          style={{ width: "250px" }}
        >
          {options.map((option) => (
            <DropdownMenu.Item
              asChild
              key={option.value}
              onSelect={(e) => e.preventDefault()}
              style={{ cursor: "pointer" }}
            >
              <Flex
                justify="start"
                align="center"
                gap="10px"
                onClick={() => handleSelect(option.value)}
                style={{ cursor: "pointer" }}
              >
                <Checkbox
                  checked={selectedValue === option.value}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "1px solid #00000040",
                    borderRadius: "4px",
                    backgroundColor:
                      selectedValue === option.value ? "#1a3b66" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {selectedValue === option.value && (
                    <CheckIcon color="#fff" fontWeight={600} />
                  )}
                </Checkbox>
                <Text style={{ fontSize: isSmallScreen ? "12px" : "16px" }}>
                  {option.label}
                </Text>
              </Flex>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    );
  }
);

LeadsFilterDropdown.displayName = "LeadsFilterDropdown";

export default LeadsFilterDropdown;
