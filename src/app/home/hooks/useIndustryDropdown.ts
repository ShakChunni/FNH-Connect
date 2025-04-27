import { useState, useCallback, useRef, useEffect, useMemo } from "react";

interface UseIndustryDropdownProps {
  defaultValue?: string;
  onSelect: (value: string) => void;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  options?: string[];
  onNotification?: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
}

export const useIndustryDropdown = ({
  defaultValue = "",
  onSelect,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options = [],
  onNotification,
}: UseIndustryDropdownProps) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to fetch industries from the API
  const fetchIndustries = useCallback(async () => {
    try {
      const response = await fetch(`/api/fetch/industry`);
      const data = await response.json();
      setIndustries(data.industries || []);
    } catch (err) {
      console.error("Error loading industries:", err);
      setIndustries([]);
    }
  }, []);

  // Fetch on mount and when dataVersion changes
  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries, dataVersion]);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  const handleSelect = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // Refresh data when opening the dropdown
        setDataVersion((prev) => prev + 1);
        setIsCreatingNew(false);
        setError(null);
      }
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCreatingNew(false);
        setError(null);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(e.target.value);
      setError(null);
    },
    []
  );

  const handleCustomSelect = useCallback(async () => {
    if (!customValue.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/add/industry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ industry: customValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Failed to add industry";
        setError(errorMessage);
        if (onNotification) {
          onNotification(errorMessage, "error");
        }
        return;
      }

      // Force refresh by incrementing dataVersion
      setDataVersion((prev) => prev + 1);

      // Select the newly added industry
      handleSelect(data.industry);
      setIsCreatingNew(false);
      setCustomValue("");

      // Show success notification
      if (onNotification) {
        onNotification(
          `Industry '${data.industry}' added successfully`,
          "success"
        );
      }
    } catch (err) {
      const errorMessage = "An error occurred. Please try again.";
      setError(errorMessage);
      if (onNotification) {
        onNotification(errorMessage, "error");
      }
      console.error("Error adding industry:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [customValue, handleSelect, onNotification]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCustomSelect();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setIsCreatingNew(false);
        setError(null);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [handleCustomSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const openCustomInput = useCallback(() => {
    setIsCreatingNew(true);
    setError(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const filteredIndustries = useMemo(() => {
    return industries.filter((industry) =>
      industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, industries]);

  const allOptions = useMemo(() => {
    // Ensure we don't have duplicates between industries and options
    const uniqueOptions = options.filter(
      (option) =>
        !industries.some(
          (industry) => industry.toLowerCase() === option.toLowerCase()
        )
    );
    return [...filteredIndustries, ...uniqueOptions];
  }, [filteredIndustries, options, industries]);

  return {
    selectedValue,
    isOpen,
    isCreatingNew,
    customValue,
    searchTerm,
    isSubmitting,
    error,
    dropdownRef,
    inputRef,
    handleSelect,
    handleOpenChange,
    handleCustomInputChange,
    handleCustomSelect,
    handleKeyDown,
    openCustomInput,
    setSearchTerm,
    allOptions,
  };
};
