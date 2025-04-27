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

  // Split users into active and archived
  const { activeUsers, archivedUsers } = useMemo(() => {
    const active = fetchedPics.filter((u) => !u.archived);
    const archived = fetchedPics.filter((u) => u.archived);
    return { activeUsers: active, archivedUsers: archived };
  }, [fetchedPics]);

  // All values for each section
  const activeValues = useMemo(
    () => activeUsers.map((u) => capitalizeFirstLetter(u.username)),
    [activeUsers, capitalizeFirstLetter]
  );
  const archivedValues = useMemo(
    () => archivedUsers.map((u) => capitalizeFirstLetter(u.username)),
    [archivedUsers, capitalizeFirstLetter]
  );

  // All values combined
  const allValues = useMemo(
    () => [...activeValues, ...archivedValues],
    [activeValues, archivedValues]
  );

  // State
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<
    "all" | "allWithArchived" | "specific"
  >("all");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  // Initialize values and selected state
  useEffect(() => {
    // By default, select all active users
    if (defaultValue.length > 0) {
      // If default values include all active and no archived, treat as "All"
      const hasAllActive = activeValues.every((v) => defaultValue.includes(v));
      const hasAnyArchived = archivedValues.some((v) =>
        defaultValue.includes(v)
      );
      if (hasAllActive && !hasAnyArchived) {
        setSelectedValues(activeValues);
        setTempSelectedValues([]);
        setDisplayMode("all");
      } else if (hasAllActive && hasAnyArchived) {
        // All active + some archived
        const archivedSelected = defaultValue.filter((v) =>
          archivedValues.includes(v)
        );
        setSelectedValues([...activeValues, ...archivedSelected]);
        setTempSelectedValues([...archivedSelected]);
        setDisplayMode("allWithArchived");
      } else {
        // Specific selection
        setSelectedValues(defaultValue);
        setTempSelectedValues(defaultValue);
        setDisplayMode("specific");
      }
    } else {
      setSelectedValues(activeValues);
      setTempSelectedValues([]);
      setDisplayMode("all");
    }
  }, [activeValues, archivedValues, defaultValue]);

  // Adjust button width based on content
  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValues]);

  // Section select all handlers
  const handleSectionSelectAll = useCallback(
    (section: "active" | "archived") => {
      setTempSelectedValues((prev) => {
        if (section === "active") {
          // If all active are selected, deselect all active
          const allActiveSelected = activeValues.every((v) => prev.includes(v));
          if (allActiveSelected) {
            return prev.filter((v) => !activeValues.includes(v));
          } else {
            // Add all active users (avoid duplicates)
            return Array.from(new Set([...prev, ...activeValues]));
          }
        } else {
          // If all archived are selected, deselect all archived
          const allArchivedSelected = archivedValues.every((v) =>
            prev.includes(v)
          );
          if (allArchivedSelected) {
            return prev.filter((v) => !archivedValues.includes(v));
          } else {
            // Add all archived users (avoid duplicates)
            return Array.from(new Set([...prev, ...archivedValues]));
          }
        }
      });
    },
    [activeValues, archivedValues]
  );

  // Individual checkbox handler
  const handleCheckboxChange = useCallback((value: string) => {
    setTempSelectedValues((prev) => {
      if (prev.includes(value)) {
        // Remove the value if it's already selected
        return prev.filter((v) => v !== value);
      } else {
        // Add the value
        return [...prev, value];
      }
    });
  }, []);

  // Dropdown open/close logic
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // When closing dropdown, determine the final selected values
        const hasAllActive = activeValues.every((v) =>
          tempSelectedValues.includes(v)
        );
        const archivedSelected = tempSelectedValues.filter((v) =>
          archivedValues.includes(v)
        );
        const hasAnyArchived = archivedSelected.length > 0;

        if (tempSelectedValues.length === 0) {
          // No selections, default to all active users
          setSelectedValues(activeValues);
          setTempSelectedValues([]);
          setDisplayMode("all");
          onSelect(activeValues);
        } else if (
          hasAllActive &&
          !hasAnyArchived &&
          tempSelectedValues.length === activeValues.length
        ) {
          // All active selected, no archived
          setSelectedValues(activeValues);
          setTempSelectedValues([]);
          setDisplayMode("all");
          onSelect(activeValues);
        } else if (
          hasAllActive &&
          hasAnyArchived &&
          tempSelectedValues.length ===
            activeValues.length + archivedSelected.length
        ) {
          // All active + some archived
          setSelectedValues([...activeValues, ...archivedSelected]);
          setTempSelectedValues([...archivedSelected]);
          setDisplayMode("allWithArchived");
          onSelect([...activeValues, ...archivedSelected]);
        } else {
          // Specific selection
          setSelectedValues(tempSelectedValues);
          setDisplayMode("specific");
          onSelect(tempSelectedValues);
        }
      } else {
        // When opening, if we're in "all" or "allWithArchived" mode, keep tempSelectedValues empty
        if (displayMode === "all") {
          setTempSelectedValues([]);
        } else if (displayMode === "allWithArchived") {
          setTempSelectedValues(
            selectedValues.filter((v) => archivedValues.includes(v))
          );
        }
      }
    },
    [
      tempSelectedValues,
      activeValues,
      archivedValues,
      displayMode,
      selectedValues,
      onSelect,
    ]
  );

  // Display text logic
  const displayText = useMemo(() => {
    if (displayMode === "all") {
      return "All";
    }
    if (displayMode === "allWithArchived") {
      const archivedSelected = selectedValues.filter((v) =>
        archivedValues.includes(v)
      );
      if (archivedSelected.length === 1) {
        return `All + ${archivedSelected[0]}`;
      }
      if (archivedSelected.length > 1) {
        return `All + ${archivedSelected.length} archived`;
      }
      return "All";
    }
    if (selectedValues.length > 0) {
      return selectedValues.join(", ");
    }
    return "Select";
  }, [selectedValues, displayMode, archivedValues]);

  // Section select all checked state
  const isActiveSectionAllChecked = useMemo(
    () =>
      activeValues.length > 0 &&
      activeValues.every((v) => tempSelectedValues.includes(v)),
    [activeValues, tempSelectedValues]
  );
  const isArchivedSectionAllChecked = useMemo(
    () =>
      archivedValues.length > 0 &&
      archivedValues.every((v) => tempSelectedValues.includes(v)),
    [archivedValues, tempSelectedValues]
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
            fontSize: isSmallScreen ? "14px" : "16px",
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
          <span ref={spanRef}>User: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "240px" }}
      >
        {/* Active Users Section */}
        {activeValues.length > 0 && (
          <>
            <Flex
              align="center"
              justify="between"
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "6px 10px 4px 10px",
                background: "#fff",
              }}
            >
              <Text
                style={{
                  color: "#1e3a8a",
                  fontWeight: 700,
                  fontSize: isSmallScreen ? "13px" : "15px",
                  letterSpacing: "0.01em",
                }}
              >
                Active Users
              </Text>
              <Checkbox
                checked={isActiveSectionAllChecked}
                onCheckedChange={() => handleSectionSelectAll("active")}
                style={{
                  width: "16px",
                  height: "16px",
                  border: "1px solid #1e3a8a",
                  borderRadius: "4px",
                  backgroundColor: isActiveSectionAllChecked
                    ? "#1e3a8a"
                    : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginLeft: "8px",
                }}
              >
                {isActiveSectionAllChecked && (
                  <CheckIcon color="#fff" fontWeight={600} />
                )}
              </Checkbox>
            </Flex>
            {activeValues.map((name) => (
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
          </>
        )}

        {/* Archived Users Section */}
        {archivedValues.length > 0 && (
          <>
            <Flex
              align="center"
              justify="between"
              style={{
                borderBottom: "1px solid #e5e7eb",
                marginTop: "8px",
                padding: "6px 10px 4px 10px",
                background: "#fff",
              }}
            >
              <Text
                style={{
                  color: "#1e3a8a",
                  fontWeight: 700,
                  fontSize: isSmallScreen ? "13px" : "15px",
                  letterSpacing: "0.01em",
                }}
              >
                Archived Users
              </Text>
              <Checkbox
                checked={isArchivedSectionAllChecked}
                onCheckedChange={() => handleSectionSelectAll("archived")}
                style={{
                  width: "16px",
                  height: "16px",
                  border: "1px solid #1e3a8a",
                  borderRadius: "4px",
                  backgroundColor: isArchivedSectionAllChecked
                    ? "#1e3a8a"
                    : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginLeft: "8px",
                }}
              >
                {isArchivedSectionAllChecked && (
                  <CheckIcon color="#fff" fontWeight={600} />
                )}
              </Checkbox>
            </Flex>
            {archivedValues.map((name) => (
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
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default PICDropdown;
