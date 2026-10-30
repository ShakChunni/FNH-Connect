"use client";

import React, { useState, useMemo } from "react";
import { Microscope, Search, Check, X } from "lucide-react";
import { INFERTILITY_TESTS } from "../../../constants/infertilityTests";
import { useInfertilityFilterStore } from "../../../stores/filterStore";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

interface TestFilterProps {
  scope?: "patients" | "investigations";
}

export const TestFilter: React.FC<TestFilterProps> = ({
  scope = "investigations",
}) => {
  const [searchTerm, setSearchValue] = useState("");
  const patientSelectedTests = useInfertilityFilterStore(
    (state) => state.testNames,
  );
  const patientToggleTestName = useInfertilityFilterStore(
    (state) => state.toggleTestName,
  );
  const patientSetTestNames = useInfertilityFilterStore(
    (state) => state.setTestNames,
  );
  const investigationSelectedTests = useInfertilityTestFilterStore(
    (state) => state.filters.testNames,
  );
  const investigationToggleTestName = useInfertilityTestFilterStore(
    (state) => state.toggleTestName,
  );
  const investigationSetTestNames = useInfertilityTestFilterStore(
    (state) => state.setTestNames,
  );
  const isPatientScope = scope === "patients";
  const selectedTests = isPatientScope
    ? patientSelectedTests
    : investigationSelectedTests;
  const toggleTestName = isPatientScope
    ? patientToggleTestName
    : investigationToggleTestName;
  const setTestNames = isPatientScope
    ? patientSetTestNames
    : investigationSetTestNames;

  const filteredTests = useMemo(() => {
    if (!searchTerm) return INFERTILITY_TESTS.slice(0, 10);
    return INFERTILITY_TESTS.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15);
  }, [searchTerm]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <Microscope className="w-3.5 h-3.5" />
        Filter by Investigations
      </label>

      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search investigation names..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm
            focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none
            transition-colors duration-200"
        />
      </div>

      {/* Selected Tags */}
      {selectedTests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-1">
          {selectedTests.map((name) => (
            <button
              key={name}
              onClick={() => toggleTestName(name)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors animate-in fade-in duration-150"
            >
              {name}
              <X className="w-3 h-3 opacity-80" />
            </button>
          ))}
          <button
            onClick={() => setTestNames([])}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar">
        {filteredTests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTests.map((test) => {
              const isSelected = selectedTests.includes(test.name);
              return (
                <button
                  key={test.code}
                  onClick={() => toggleTestName(test.name)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-left text-sm
                    transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className="line-clamp-1">{test.name}</span>
                    <span className="text-2xs text-slate-500 uppercase tracking-tighter">
                      {test.category} • {test.code}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-emerald-600 rounded-full text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-500 font-medium italic">
              No investigations found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
