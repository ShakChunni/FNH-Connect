import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { Text } from "@radix-ui/themes";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import {
  PATHOLOGY_TESTS,
  PathologyTestItem,
} from "@/app/(staff)/pathology/constants/pathologyTests";
import {
  usePathologyPathologyInfo,
  usePathologyActions,
} from "@/app/(staff)/pathology/stores";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

const TestItem = memo(
  ({
    test,
    isSelected,
    onToggle,
  }: {
    test: PathologyTestItem;
    isSelected: boolean;
    onToggle: (code: string) => void;
  }) => {
    return (
      <div
        onClick={() => onToggle(test.code)}
        className={`cursor-pointer px-4 py-3 flex items-center transition-colors duration-200 rounded-md mx-1 ${
          isSelected
            ? "bg-green-100 border-l-4 border-green-600"
            : "hover:bg-blue-900 hover:text-white"
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-3 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <Text
            className={`block text-sm font-medium truncate ${
              isSelected ? "text-gray-900" : ""
            }`}
          >
            {test.name}
          </Text>
          <Text
            className={`block text-xs truncate ${
              isSelected ? "text-gray-600" : "text-gray-500"
            }`}
          >
            {test.category}
          </Text>
        </div>
        <Text
          className={`text-sm font-semibold ml-3 shrink-0 ${
            isSelected ? "text-green-700" : "text-green-600"
          }`}
        >
          ৳{test.price}
        </Text>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.test.code === nextProps.test.code &&
    prevProps.isSelected === nextProps.isSelected
);
TestItem.displayName = "TestItem";

const PathologyTestSelector: React.FC = memo(() => {
  const pathologyInfo = usePathologyPathologyInfo();
  const { setPathologyInfo } = usePathologyActions();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate total price from selected tests
  const totalPrice = useMemo(() => {
    return pathologyInfo.selectedTests.reduce((sum: number, code: string) => {
      const test = PATHOLOGY_TESTS.find((t) => t.code === code);
      return sum + (test?.price || 0);
    }, 0);
  }, [pathologyInfo.selectedTests]);

  // Update testCharge in store when total price changes
  useEffect(() => {
    if (totalPrice !== pathologyInfo.testCharge) {
      setPathologyInfo({
        ...pathologyInfo,
        testCharge: totalPrice,
      });
    }
  }, [totalPrice]); // Only depend on totalPrice

  const toggleDropdown = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleTestToggle = useCallback(
    (testCode: string) => {
      const isSelected = pathologyInfo.selectedTests.includes(testCode);
      const newSelection = isSelected
        ? pathologyInfo.selectedTests.filter(
            (code: string) => code !== testCode
          )
        : [...pathologyInfo.selectedTests, testCode];

      setPathologyInfo({
        ...pathologyInfo,
        selectedTests: newSelection,
      });
    },
    [pathologyInfo, setPathologyInfo]
  );

  const handleRemoveTest = useCallback(
    (testCode: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPathologyInfo({
        ...pathologyInfo,
        selectedTests: pathologyInfo.selectedTests.filter(
          (code: string) => code !== testCode
        ),
      });
    },
    [pathologyInfo, setPathologyInfo]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const clearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPathologyInfo({
        ...pathologyInfo,
        selectedTests: [],
      });
    },
    [pathologyInfo, setPathologyInfo]
  );

  useEffect(() => {
    if (isDropdownOpen) {
      const searchInput = document.querySelector(
        ".test-search-input"
      ) as HTMLInputElement;
      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 50);
      }
    } else {
      setSearchTerm("");
    }
  }, [isDropdownOpen]);

  // Filter tests based on search
  const filteredTests = useMemo(() => {
    if (!searchTerm) return PATHOLOGY_TESTS;

    return PATHOLOGY_TESTS.filter(
      (test) =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Get selected test details
  const selectedTestDetails = useMemo(() => {
    return pathologyInfo.selectedTests
      .map((code: string) => PATHOLOGY_TESTS.find((t) => t.code === code))
      .filter(Boolean) as PathologyTestItem[];
  }, [pathologyInfo.selectedTests]);

  return (
    <div className="relative w-full">
      <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-2">
        Select Tests<span className="text-red-500">*</span>
      </label>

      {/* Selector Box */}
      <div
        className={`
          flex flex-col w-full rounded-lg overflow-hidden
          ${
            pathologyInfo.selectedTests.length > 0
              ? "border-2 border-green-600 bg-white"
              : "border-2 border-gray-300 bg-white"
          }
          hover:border-gray-400 hover:shadow-md transition-all duration-300
        `}
      >
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown(e);
          }}
          type="button"
          className="flex items-center justify-between px-4 h-12 md:h-14 w-full text-left cursor-pointer"
        >
          <div className="flex-1">
            {pathologyInfo.selectedTests.length === 0 ? (
              <span className="text-gray-400 text-sm">
                Click to select tests...
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {pathologyInfo.selectedTests.length} test(s) selected
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-bold text-green-600">
                  Total: ৳{totalPrice}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pathologyInfo.selectedTests.length > 0 && (
              <span
                onClick={clearAll}
                className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                Clear All
              </span>
            )}
            <FaChevronDown
              className={`text-gray-600 text-sm transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Selected Tests Pills */}
        {pathologyInfo.selectedTests.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {selectedTestDetails.map((test) => (
              <div
                key={test.code}
                className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-300"
              >
                <span>{test.name}</span>
                <span className="text-green-600 font-bold">৳{test.price}</span>
                <button
                  onClick={(e) => handleRemoveTest(test.code, e)}
                  className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown using DropdownPortal */}
      <DropdownPortal
        isOpen={isDropdownOpen}
        onClose={closeDropdown}
        buttonRef={buttonRef}
        className="overflow-hidden"
      >
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden w-full min-w-[320px] max-w-[500px]">
          {/* Search Header */}
          <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="test-search-input w-full p-2 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm bg-white transition-all duration-150 ease-in-out"
                autoFocus
              />
            </div>
          </div>

          {/* Test List with Regular Scroll */}
          <div
            className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{ maxHeight: "280px" }}
          >
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <TestItem
                  key={test.code}
                  test={test}
                  isSelected={pathologyInfo.selectedTests.includes(test.code)}
                  onToggle={handleTestToggle}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">
                <p>No tests found matching your search.</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
});

PathologyTestSelector.displayName = "PathologyTestSelector";
export default PathologyTestSelector;
