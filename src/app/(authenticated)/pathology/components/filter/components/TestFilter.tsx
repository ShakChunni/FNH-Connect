"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
} from "lucide-react";
import { FixedSizeList as List } from "react-window";
import { usePathologyFilterStore } from "../../../stores/filterStore";

interface Test {
  "Test Name (Investigation)": string;
  Price: number;
}

// Memoized test item for performance
const TestItem = memo(
  ({
    test,
    isSelected,
    onToggle,
    style,
  }: {
    test: Test;
    isSelected: boolean;
    onToggle: (testName: string) => void;
    style: React.CSSProperties;
  }) => {
    const testName = test["Test Name (Investigation)"];

    return (
      <div style={style} className="px-2">
        <div
          onClick={() => onToggle(testName)}
          className={`cursor-pointer px-3 py-2.5 transition-colors duration-150 rounded-lg flex items-center justify-between ${
            isSelected
              ? "bg-emerald-50 border border-emerald-300 shadow-sm"
              : "hover:bg-blue-50 hover:border-blue-200 border border-transparent"
          }`}
        >
          <div className="flex items-center flex-1 min-w-0 gap-2.5">
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
                isSelected
                  ? "bg-emerald-600 border-emerald-600"
                  : "border-slate-300 bg-white"
              }`}
            >
              {isSelected && (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </div>
            <span
              className={`text-sm flex-1 truncate transition-colors duration-150 ${
                isSelected ? "font-semibold text-emerald-800" : "text-slate-700"
              }`}
            >
              {testName}
            </span>
          </div>
          <span
            className={`text-xs font-bold tabular-nums ml-2 px-2.5 py-1 rounded-md shrink-0 transition-colors duration-150 ${
              isSelected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ৳{test.Price.toLocaleString()}
          </span>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.test["Test Name (Investigation)"] ===
      next.test["Test Name (Investigation)"]
);
TestItem.displayName = "TestItem";

export const TestFilter: React.FC = () => {
  const testNames = usePathologyFilterStore((state) => state.filters.testNames);
  const setTestNames = usePathologyFilterStore((state) => state.setTestNames);
  const toggleTestName = usePathologyFilterStore(
    (state) => state.toggleTestName
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [testsError, setTestsError] = useState(false);
  const listRef = useRef<List>(null);

  // Load tests from JSON
  const loadTests = useCallback(() => {
    setTestsError(false);
    fetch("/tests.json")
      .then((res) => res.json())
      .then((data) => setTests(data))
      .catch((err) => {
        console.error("Failed to load tests:", err);
        setTestsError(true);
      });
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests;
    const term = searchTerm.toLowerCase();
    return tests.filter((test) =>
      test["Test Name (Investigation)"].toLowerCase().includes(term)
    );
  }, [searchTerm, tests]);

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTestNames([]);
  };

  const selectedCount = testNames.length;

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const test = filteredTests[index];
      const isSelected = testNames.includes(test["Test Name (Investigation)"]);
      return (
        <TestItem
          test={test}
          isSelected={isSelected}
          onToggle={toggleTestName}
          style={style}
        />
      );
    },
    [filteredTests, testNames, toggleTestName]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <FlaskConical className="w-5 h-5 text-purple-700" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 text-sm">Tests</h3>
            <p className="text-xs text-slate-500 font-medium">
              {selectedCount === 0 ? "All tests" : `${selectedCount} selected`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
            >
              Clear
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-50">
          {/* Search */}
          <div className="relative mb-3 mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-fnh-blue focus:border-fnh-blue transition-colors"
            />
          </div>

          {/* Virtualized List */}
          <div className="min-h-[250px]">
            {tests.length === 0 && testsError ? (
              <div role="alert" className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-red-700">Could not load tests.</p>
                <button
                  type="button"
                  onClick={loadTests}
                  className="mt-2 h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : tests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <p className="text-xs">Loading tests...</p>
              </div>
            ) : filteredTests.length > 0 ? (
              <List
                ref={listRef}
                height={250}
                width="100%"
                itemCount={filteredTests.length}
                itemSize={40}
                className="scrollbar-thin scrollbar-thumb-slate-200"
              >
                {Row}
              </List>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">No tests found</p>
              </div>
            )}
          </div>

          {/* Selected Tags */}
          {selectedCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {testNames.slice(0, 5).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-800 text-2xs font-medium rounded-md border border-emerald-200"
                >
                  <span className="truncate max-w-[150px]">{name}</span>
                  <button
                    type="button"
                    onClick={() => toggleTestName(name)}
                    aria-label={`Remove ${name}`}
                    className="-my-2 -mr-1 h-9 w-9 flex items-center justify-center rounded hover:text-red-600 text-slate-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedCount > 5 && (
                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-2xs font-medium rounded-md">
                  +{selectedCount - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
