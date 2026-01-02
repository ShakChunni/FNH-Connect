"use client";

import React, { useState } from "react";
import { FlaskConical, ChevronDown, ChevronUp, Check } from "lucide-react";
import { usePathologyFilterStore } from "../../../stores/filterStore";
import { PATHOLOGY_CATEGORIES } from "../../../constants/pathologyTests";

/**
 * TestCategoryFilter Component
 * Multi-select filter for pathology test categories
 */
export const TestCategoryFilter: React.FC = () => {
  const testCategories = usePathologyFilterStore(
    (state) => state.filters.testCategories
  );
  const setTestCategories = usePathologyFilterStore(
    (state) => state.setTestCategories
  );
  const toggleTestCategory = usePathologyFilterStore(
    (state) => state.toggleTestCategory
  );

  const [isExpanded, setIsExpanded] = useState(false);

  const selectedCount = testCategories.length;
  const allSelected = selectedCount === PATHOLOGY_CATEGORIES.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setTestCategories([]);
    } else {
      setTestCategories([...PATHOLOGY_CATEGORIES]);
    }
  };

  const handleClearAll = () => {
    setTestCategories([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FlaskConical className="w-4 h-4 text-fnh-blue" />
          Test Categories
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 bg-fnh-blue text-white text-xs font-bold rounded-full">
              {selectedCount}
            </span>
          )}
        </label>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSelectAll}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            allSelected
              ? "bg-fnh-navy text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>

        {selectedCount > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 
              rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
          >
            Clear ({selectedCount})
          </button>
        )}
      </div>

      {/* Selected Categories Tags (when collapsed) */}
      {!isExpanded && selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {testCategories.slice(0, 4).map((category) => (
            <span
              key={category}
              onClick={() => toggleTestCategory(category)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-fnh-blue/10 text-fnh-blue 
                text-xs font-medium rounded-lg cursor-pointer hover:bg-fnh-blue/20 transition-colors"
            >
              {category}
              <span className="text-fnh-blue/60 hover:text-fnh-blue">×</span>
            </span>
          ))}
          {selectedCount > 4 && (
            <span
              onClick={() => setIsExpanded(true)}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium 
                rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
            >
              +{selectedCount - 4} more
            </span>
          )}
        </div>
      )}

      {/* Expanded Category List */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-[240px] overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {PATHOLOGY_CATEGORIES.map((category) => {
              const isSelected = testCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleTestCategory(category)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium 
                    transition-all cursor-pointer ${
                      isSelected
                        ? "bg-fnh-blue text-white shadow-sm"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-100"
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-white border-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-fnh-blue" />}
                  </div>
                  <span className="truncate">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper text */}
      {selectedCount === 0 && (
        <p className="text-xs text-gray-500">
          Select categories to filter tests. Leave empty to show all.
        </p>
      )}
    </div>
  );
};

export default TestCategoryFilter;
