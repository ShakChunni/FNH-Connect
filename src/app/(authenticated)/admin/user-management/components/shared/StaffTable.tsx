/**
 * StaffTable
 * Table of staff members without linked user accounts
 */

"use client";

import React, { useRef, useState } from "react";
import { Edit3, MoreVertical, Users, UserPlus, Search } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchStandaloneStaff } from "../../hooks";
import { useUIStore } from "../../stores";
import { useDebounce } from "@/hooks/useDebounce";
import type { StaffRecord } from "../../types";
import { cn } from "@/lib/utils";

const ActionMenu: React.FC<{ staff: StaffRecord }> = ({ staff }) => {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { openModal } = useUIStore();

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={btnRef}
        className="min-w-[140px]"
      >
        <div className="py-1">
          <button
            onClick={() => {
              openModal("editStaff", { staff });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-500" /> Edit Staff
          </button>
        </div>
      </DropdownPortal>
    </div>
  );
};

interface StaffTableProps {
  onAddStaff: () => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({ onAddStaff }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: staffList, isLoading } = useFetchStandaloneStaff({
    search: debouncedSearch,
    includeInactive: true,
  });

  const staff = staffList || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 mb-1">
          No standalone staff found
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Staff without login accounts (e.g., doctors) will appear here.
        </p>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm text-xs font-semibold cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Staff Role
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Specialization
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">
                      {s.fullName}
                    </p>
                    {s.email && (
                      <p className="text-xs text-gray-500">{s.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-100">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {s.specialization || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {s.phoneNumber || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                        s.isActive
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          s.isActive ? "bg-green-500" : "bg-red-500",
                        )}
                      />
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu staff={s} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {staff.map((s) => (
            <div key={s.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {s.fullName}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0",
                      s.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        s.isActive ? "bg-green-500" : "bg-red-500",
                      )}
                    />
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{s.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.specialization && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      {s.specialization}
                    </span>
                  )}
                  {s.phoneNumber && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      {s.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
              <ActionMenu staff={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffTable;
