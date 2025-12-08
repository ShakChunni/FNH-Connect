import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Button, Flex, Text, DropdownMenu } from "@radix-ui/themes";
import { PiCaretDownBold } from "react-icons/pi";

interface DashboardFilterProps {
  onSelect: (value: string) => void;
  defaultValue: string;
  className?: string; // Add this line
}

const DashboardFilter: React.FC<DashboardFilterProps> = ({
  onSelect,
  defaultValue,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const values = useMemo(() => ["All", "MAVN", "Moving Image"], []);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`; // 40px for padding
    }
  }, [value]);

  const handleSelect = useCallback(
    (newValue: string) => {
      setValue(newValue);
      onSelect(newValue);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <Button
          ref={buttonRef}
          variant="soft"
          className="dropdown-trigger-button rounded-xl"
          style={{
            backgroundColor: "white",
            color: "black",
            border: "1px solid #00000040",
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
            width: "250px", // Set the desired width
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
          <span ref={spanRef}>Show Report For: {value}</span>
          <span ref={iconRef}>
            <PiCaretDownBold size={20} />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={isOpen ? "animate-dropdown-open" : "animate-dropdown-close"}
        style={{ width: "200px" }}
      >
        {values.map((item) => (
          <DropdownMenu.Item
            key={item}
            onSelect={(e) => {
              e.preventDefault();
              handleSelect(item);
            }}
            style={{ cursor: "pointer" }}
          >
            <Flex
              justify="start"
              align="center"
              gap="10px"
              style={{ cursor: "pointer" }}
            >
              <Text>{item}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default DashboardFilter;
