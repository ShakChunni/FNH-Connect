import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Button, Flex, Text, DropdownMenu } from "@radix-ui/themes";
import { PiCaretDownBold } from "react-icons/pi";
import { useTableSelector } from "../../context/TableSelectorContext";
import { motion } from "framer-motion";

interface TableSelectorProps {
  defaultValue: string;
  className?: string;
}

const TableSelector: React.FC<TableSelectorProps> = ({ defaultValue }) => {
  const { handleTableSelectorChange } = useTableSelector(); // Get from context
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const values = useMemo(() => ["All", "MAVN", "Moving Image"], []);

  useEffect(() => {
    const updateButtonWidth = () => {
      if (buttonRef.current && spanRef.current && iconRef.current) {
        const newWidth =
          spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40;
        setButtonWidth(newWidth);
      }
    };

    updateButtonWidth();

    // Use ResizeObserver to detect changes in span content
    const resizeObserver = new ResizeObserver(updateButtonWidth);
    if (spanRef.current) {
      resizeObserver.observe(spanRef.current);
    }

    return () => {
      if (spanRef.current) {
        resizeObserver.unobserve(spanRef.current);
      }
    };
  }, [value]);

  const handleSelect = useCallback(
    (newValue: string) => {
      setValue(newValue);
      handleTableSelectorChange(newValue); // Use context function instead of onSelect
      setIsOpen(false);
    },
    [handleTableSelectorChange]
  );

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <motion.div
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          className="w-full"
        >
          <Button
            ref={buttonRef}
            variant="soft"
            className={`dropdown-trigger-button flex justify-between items-center text-white px-5 py-2.5 whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden text-ellipsis cursor-pointer h-[40px] rounded-xl ${
              isOpen
                ? "bg-gradient-to-l from-blue-900 to-blue-950"
                : "bg-gradient-to-r from-blue-900 to-blue-950"
            }`}
            style={{
              width: buttonWidth ? `${buttonWidth}px` : "auto",
              transition: "width 0.2s ease-in-out",
            }}
          >
            <span ref={spanRef} className="text-white">
              Organization: {value}
            </span>
            <span ref={iconRef} className="text-white">
              <PiCaretDownBold
                size={20}
                className={`transition-transform duration-150 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </Button>
        </motion.div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={`${
          isOpen ? "animate-dropdown-open" : "animate-dropdown-close"
        } w-52`}
        style={{
          transition: "height 0.2s ease-in-out, opacity 0.2s ease-in-out",
        }}
      >
        {values.map((item) => (
          <DropdownMenu.Item
            key={item}
            onSelect={() => handleSelect(item)}
            className="cursor-pointer"
          >
            <Flex
              justify="start"
              align="center"
              gap="10px"
              className="cursor-pointer"
            >
              <Text>{item}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default React.memo(TableSelector);
