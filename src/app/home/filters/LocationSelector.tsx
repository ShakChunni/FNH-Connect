import { Checkbox } from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import countriesData from "world-countries/countries.json";
import { FixedSizeList as List } from "react-window";

interface LocationSelectorProps {
  onSelect: (selectedValues: string[]) => void;
  defaultValue?: string[];
}

const LocationSelector = ({
  onSelect,
  defaultValue = [],
}: LocationSelectorProps) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

  const preferredCountries = useMemo(() => ["Malaysia", "Singapore"], []);

  const allCountries = useMemo(() => {
    const countriesList = countriesData.map((country) => country.name.common);
    const filteredList = countriesList.filter(
      (country) => !preferredCountries.includes(country)
    );
    return {
      preferred: preferredCountries,
      other: filteredList,
    };
  }, [preferredCountries]);

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<
    "all" | "allWithPreferred" | "specific"
  >("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (defaultValue.length > 0) {
      const hasAllPreferred = allCountries.preferred.every((v) =>
        defaultValue.includes(v)
      );
      const hasAnyOther = allCountries.other.some((v) =>
        defaultValue.includes(v)
      );

      if (hasAllPreferred && !hasAnyOther) {
        setSelectedValues(allCountries.preferred);
        setTempSelectedValues([]);
        setDisplayMode("all");
      } else if (hasAllPreferred && hasAnyOther) {
        const otherSelected = defaultValue.filter((v) =>
          allCountries.other.includes(v)
        );
        setSelectedValues([...allCountries.preferred, ...otherSelected]);
        setTempSelectedValues([...otherSelected]);
        setDisplayMode("allWithPreferred");
      } else {
        setSelectedValues(defaultValue);
        setTempSelectedValues(defaultValue);
        setDisplayMode("specific");
      }
    } else {
      setSelectedValues([]);
      setTempSelectedValues([]);
      setDisplayMode("all");
    }
  }, [allCountries, defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValues]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return allCountries;

    const term = searchTerm.toLowerCase();
    return {
      preferred: allCountries.preferred.filter((country) =>
        country.toLowerCase().includes(term)
      ),
      other: allCountries.other.filter((country) =>
        country.toLowerCase().includes(term)
      ),
    };
  }, [searchTerm, allCountries]);

  const handleSectionSelectAll = useCallback(
    (section: "preferred" | "other") => {
      setTempSelectedValues((prev) => {
        if (section === "preferred") {
          const allPreferredSelected = filteredCountries.preferred.every((v) =>
            prev.includes(v)
          );
          if (allPreferredSelected) {
            return prev.filter((v) => !filteredCountries.preferred.includes(v));
          } else {
            return Array.from(
              new Set([...prev, ...filteredCountries.preferred])
            );
          }
        } else {
          const allOtherSelected = filteredCountries.other.every((v) =>
            prev.includes(v)
          );
          if (allOtherSelected) {
            return prev.filter((v) => !filteredCountries.other.includes(v));
          } else {
            return Array.from(new Set([...prev, ...filteredCountries.other]));
          }
        }
      });
    },
    [filteredCountries]
  );

  const handleCheckboxChange = useCallback((value: string) => {
    setTempSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleSearchClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        const hasAllPreferred = allCountries.preferred.every((v) =>
          tempSelectedValues.includes(v)
        );
        const otherSelected = tempSelectedValues.filter((v) =>
          allCountries.other.includes(v)
        );
        const hasAnyOther = otherSelected.length > 0;

        if (defaultValue.length === 0 && tempSelectedValues.length === 0) {
          setSelectedValues([]);
          setTempSelectedValues([]);
          setDisplayMode("all");
        } else if (tempSelectedValues.length === 0) {
          setSelectedValues([]);
          setTempSelectedValues([]);
          setDisplayMode("all");
          onSelect([]);
        } else if (
          hasAllPreferred &&
          !hasAnyOther &&
          tempSelectedValues.length === allCountries.preferred.length
        ) {
          setSelectedValues(allCountries.preferred);
          setTempSelectedValues([]);
          setDisplayMode("specific");
          onSelect(allCountries.preferred);
        } else if (
          hasAllPreferred &&
          hasAnyOther &&
          tempSelectedValues.length ===
            allCountries.preferred.length + otherSelected.length
        ) {
          setSelectedValues([...allCountries.preferred, ...otherSelected]);
          setTempSelectedValues([...otherSelected]);
          setDisplayMode("allWithPreferred");
          onSelect([...allCountries.preferred, ...otherSelected]);
        } else {
          setSelectedValues(tempSelectedValues);
          setDisplayMode("specific");
          onSelect(tempSelectedValues);
        }
        setSearchTerm("");
      } else {
        if (displayMode === "all" && selectedValues.length > 0) {
          setTempSelectedValues([...selectedValues]);
        } else if (displayMode === "allWithPreferred") {
          const otherSelected = selectedValues.filter((v) =>
            allCountries.other.includes(v)
          );
          setTempSelectedValues([...allCountries.preferred, ...otherSelected]);
        } else {
          setTempSelectedValues([...selectedValues]);
        }
      }
    },
    [
      tempSelectedValues,
      allCountries,
      displayMode,
      selectedValues,
      onSelect,
      defaultValue,
    ]
  );

  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return "All";
    }

    if (displayMode === "specific") {
      if (selectedValues.length === 1) {
        return selectedValues[0];
      }
      return `${selectedValues.length} locations`;
    }

    if (displayMode === "allWithPreferred") {
      const otherSelected = selectedValues.filter((v) =>
        allCountries.other.includes(v)
      );
      const totalSelected =
        allCountries.preferred.length + otherSelected.length;

      if (otherSelected.length === 1) {
        return `${totalSelected} locations`;
      }
      if (otherSelected.length > 1) {
        return `${totalSelected} locations`;
      }
      return `${allCountries.preferred.length} locations`;
    }

    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} locations`;
  }, [selectedValues, displayMode, allCountries]);

  const isPreferredSectionAllChecked = useMemo(
    () =>
      filteredCountries.preferred.length > 0 &&
      filteredCountries.preferred.every((v) => tempSelectedValues.includes(v)),
    [filteredCountries.preferred, tempSelectedValues]
  );

  const isOtherSectionAllChecked = useMemo(
    () =>
      filteredCountries.other.length > 0 &&
      filteredCountries.other.every((v) => tempSelectedValues.includes(v)),
    [filteredCountries.other, tempSelectedValues]
  );

  const OtherCountryItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const name = filteredCountries.other[index];
      return (
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
            style={{
              ...style,
              cursor: "pointer",
              padding: "8px 10px",
              height: "auto",
            }}
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
                flexShrink: 0,
              }}
            >
              {tempSelectedValues.includes(name) && (
                <CheckIcon color="#fff" fontWeight={600} />
              )}
            </Checkbox>
            <Text
              style={{
                fontSize: isSmallScreen ? "12px" : "16px",
                whiteSpace: "normal",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </Text>
          </Flex>
        </DropdownMenu.Item>
      );
    },
    [
      filteredCountries.other,
      tempSelectedValues,
      handleCheckboxChange,
      isSmallScreen,
    ]
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
          <span ref={spanRef}>Location: {displayText}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "300px", maxHeight: "600px", overflow: "hidden" }}
      >
        <div
          className="p-2 border-b border-gray-200"
          onClick={handleSearchClick}
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
          />
        </div>

        <div style={{ overflow: "auto", maxHeight: "350px" }}>
          {filteredCountries.preferred.length > 0 && (
            <>
              <Flex
                align="center"
                justify="between"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "6px 10px 4px 10px",
                  background: "#fff",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
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
                  Preferred Countries
                </Text>
                <Checkbox
                  checked={isPreferredSectionAllChecked}
                  onCheckedChange={() => handleSectionSelectAll("preferred")}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "1px solid #1e3a8a",
                    borderRadius: "4px",
                    backgroundColor: isPreferredSectionAllChecked
                      ? "#1e3a8a"
                      : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {isPreferredSectionAllChecked && (
                    <CheckIcon color="#fff" fontWeight={600} />
                  )}
                </Checkbox>
              </Flex>
              {filteredCountries.preferred.map((name) => (
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
                    style={{ cursor: "pointer", padding: "8px 10px" }}
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
                        flexShrink: 0,
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

          {filteredCountries.other.length > 0 && (
            <>
              <Flex
                align="center"
                justify="between"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  marginTop: filteredCountries.preferred.length > 0 ? "8px" : 0,
                  padding: "6px 10px 4px 10px",
                  background: "#fff",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
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
                  Other Countries
                </Text>
                <Checkbox
                  checked={isOtherSectionAllChecked}
                  onCheckedChange={() => handleSectionSelectAll("other")}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "1px solid #1e3a8a",
                    borderRadius: "4px",
                    backgroundColor: isOtherSectionAllChecked
                      ? "#1e3a8a"
                      : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {isOtherSectionAllChecked && (
                    <CheckIcon color="#fff" fontWeight={600} />
                  )}
                </Checkbox>
              </Flex>
              <div
                style={{
                  height: Math.min(200, filteredCountries.other.length * 40),
                }}
              >
                <List
                  height={Math.min(200, filteredCountries.other.length * 40)}
                  width="100%"
                  itemCount={filteredCountries.other.length}
                  itemSize={40}
                >
                  {OtherCountryItem}
                </List>
              </div>
            </>
          )}

          {filteredCountries.preferred.length === 0 &&
            filteredCountries.other.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No countries found matching your search
              </div>
            )}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default LocationSelector;
