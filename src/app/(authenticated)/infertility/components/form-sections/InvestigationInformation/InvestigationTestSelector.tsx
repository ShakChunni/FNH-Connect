import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
  memo,
} from "react";
import { ChevronDown, X, Search, Check } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { FixedSizeList as List } from "react-window";

interface Test {
  "Test Name (Investigation)": string;
  Price: number;
}

interface InvestigationTestSelectorProps {
  selectedTests: string[];
  onTestsChange: (tests: string[], total: number) => void;
  disabled?: boolean;
}

// Memoized test item component for performance
const TestItem = memo(
  ({
    test,
    isSelected,
    onToggle,
    disabled,
    style,
  }: {
    test: Test;
    isSelected: boolean;
    onToggle: (testName: string, e: React.MouseEvent) => void;
    disabled: boolean;
    style: React.CSSProperties;
  }) => {
    const testName = test["Test Name (Investigation)"];

    return (
      <div style={style} className="px-2">
        <div
          onClick={(e) => onToggle(testName, e)}
          className={`cursor-pointer px-3 py-2.5 transition-colors duration-200 rounded-lg flex items-center justify-between ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : isSelected
              ? "bg-emerald-50 border border-emerald-300 shadow-sm"
              : "hover:bg-blue-50 hover:border-blue-200 border border-transparent"
          }`}
        >
          <div className="flex items-center flex-1 min-w-0 gap-2.5">
            {/* Custom checkbox */}
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                isSelected
                  ? "bg-emerald-600 border-emerald-600 shadow-sm"
                  : "border-slate-300 bg-white group-hover:border-blue-400"
              }`}
            >
              {isSelected && (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </div>
            <span
              className={`text-sm flex-1 truncate transition-colors duration-200 ${
                isSelected ? "font-semibold text-emerald-800" : "text-slate-700"
              }`}
            >
              {testName}
            </span>
          </div>
          <span
            className={`text-xs font-bold ml-2 px-2.5 py-1 rounded-md shrink-0 transition-colors duration-200 ${
              isSelected
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ৳{test.Price.toLocaleString()}
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.test["Test Name (Investigation)"] ===
      nextProps.test["Test Name (Investigation)"] &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.disabled === nextProps.disabled
);
TestItem.displayName = "TestItem";

const InvestigationTestSelector: FC<InvestigationTestSelectorProps> = ({
  selectedTests,
  onTestsChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tests, setTests] = useState<Test[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<List>(null);

  // Load tests from JSON
  useEffect(() => {
    fetch("/tests.json")
      .then((res) => res.json())
      .then((data) => setTests(data))
      .catch((err) => console.error("Failed to load tests:", err));
  }, []);

  const toggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      setIsOpen((prev) => !prev);
    },
    [disabled]
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleTestToggle = useCallback(
    (testName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      const isSelected = selectedTests.includes(testName);
      const newSelection = isSelected
        ? selectedTests.filter((t) => t !== testName)
        : [...selectedTests, testName];

      // Calculate total price
      const total = newSelection.reduce((sum, name) => {
        const test = tests.find((t) => t["Test Name (Investigation)"] === name);
        return sum + (test?.Price || 0);
      }, 0);

      // Update both tests and total in one call
      onTestsChange(newSelection, total);
    },
    [selectedTests, onTestsChange, tests, disabled]
  );

  const handleRemoveTest = useCallback(
    (testName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      const newSelection = selectedTests.filter((t) => t !== testName);

      // Calculate total price
      const total = newSelection.reduce((sum, name) => {
        const test = tests.find((t) => t["Test Name (Investigation)"] === name);
        return sum + (test?.Price || 0);
      }, 0);

      // Update both tests and total in one call
      onTestsChange(newSelection, total);
    },
    [selectedTests, onTestsChange, tests, disabled]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onTestsChange([], 0);
    },
    [onTestsChange, disabled]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      // Reset list scroll position when searching
      if (listRef.current) {
        listRef.current.scrollTo(0);
      }
    },
    []
  );

  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests;
    return tests.filter((test) =>
      test["Test Name (Investigation)"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tests]);

  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, name) => {
      const test = tests.find((t) => t["Test Name (Investigation)"] === name);
      return sum + (test?.Price || 0);
    }, 0);
  }, [selectedTests, tests]);

  // Get selected test details for pills
  const selectedTestDetails = useMemo(() => {
    return selectedTests
      .map((name) => tests.find((t) => t["Test Name (Investigation)"] === name))
      .filter(Boolean) as Test[];
  }, [selectedTests, tests]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const searchInput = document.querySelector(
        ".pathology-test-search-input"
      ) as HTMLInputElement;
      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 50);
      }
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Row renderer for virtualized list
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const test = filteredTests[index];
      const testName = test["Test Name (Investigation)"];
      const isSelected = selectedTests.includes(testName);

      return (
        <TestItem
          key={testName}
          test={test}
          isSelected={isSelected}
          onToggle={handleTestToggle}
          disabled={disabled}
          style={style}
        />
      );
    },
    [filteredTests, selectedTests, handleTestToggle, disabled]
  );

  return (
    <div className="relative w-full">
      <label className="block text-slate-700 text-sm sm:text-base font-semibold mb-2">
        Select Tests<span className="text-red-600">*</span>
      </label>

      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={disabled}
        type="button"
        className={`text-slate-700 font-normal rounded-lg flex justify-between items-center w-full px-4 py-3 min-h-[56px] outline-none transition-colors duration-200 border-2 ${
          disabled
            ? "bg-slate-200 border-slate-300 cursor-not-allowed"
            : selectedTests.length > 0
            ? "bg-white border-emerald-600 cursor-pointer focus:ring-2 focus:ring-emerald-100 shadow-sm "
            : "bg-white border-slate-300 cursor-pointer focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 hover:border-slate-400"
        }`}
      >
        <div className="flex-1 text-left">
          {selectedTests.length === 0 ? (
            <span className="text-slate-500 text-sm">
              Click to select tests...
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-800">
                {selectedTests.length} test{selectedTests.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sm font-bold text-emerald-700">
                ৳{totalPrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-3">
          {selectedTests.length > 0 && !disabled && (
            <span
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
            >
              Clear
            </span>
          )}
          <ChevronDown
            className={`transition-transform duration-200 text-slate-500 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={18}
          />
        </div>
      </button>

      {/* Selected Tests Pills */}
      {selectedTestDetails.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTestDetails.map((test) => {
            const testName = test["Test Name (Investigation)"];
            return (
              <div
                key={testName}
                className="group inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-colors duration-150"
              >
                <span className="truncate max-w-[180px]">{testName}</span>
                <span className="text-emerald-700 font-semibold">
                  ৳{test.Price.toLocaleString()}
                </span>
                {!disabled && (
                  <button
                    onClick={(e) => handleRemoveTest(testName, e)}
                    aria-label="Remove test" className="-my-2 ml-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                    type="button"
                    title="Remove test"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Content via Portal */}
      <DropdownPortal
        isOpen={isOpen}
        onClose={closeDropdown}
        buttonRef={buttonRef}
        className="rounded-lg overflow-hidden"
      >
        <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden w-full sm:min-w-[320px]">
          {/* Search Input */}
          <div className="sticky top-0 bg-slate-50 z-10 p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pathology-test-search-input w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 focus:outline-none text-sm bg-white transition-colors duration-150 placeholder:text-slate-400"
              />
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>{filteredTests.length} tests</span>
              {selectedTests.length > 0 && (
                <span className="text-emerald-700 font-medium">
                  {selectedTests.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Virtualized Tests List */}
          {filteredTests.length > 0 ? (
            <List
              ref={listRef}
              height={280}
              width="100%"
              itemCount={filteredTests.length}
              itemSize={48}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
            >
              {Row}
            </List>
          ) : (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                <Search className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 mb-2">No tests found</p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-emerald-700 hover:text-emerald-700 text-sm font-medium hover:underline transition-colors"
                type="button"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default InvestigationTestSelector;
