/**
 * StaffTable
 * Table of staff members without linked user accounts
 */

"use client";

import React, { useRef, useState } from "react";
import {
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreVertical,
  Users,
  UserPlus,
  Search,
} from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchStandaloneStaff } from "../../hooks";
import { useUIStore } from "../../stores";
import { useDebounce } from "@/hooks/useDebounce";
import type { StaffRecord } from "../../types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TONE_BADGE } from "@/lib/statusStyles";

const ActionMenu: React.FC<{ staff: StaffRecord }> = ({ staff }) => {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { openModal } = useUIStore();

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4 text-slate-500" />
      </button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={btnRef}
        className="min-w-[150px]"
      >
        <div className="py-1">
          <button
            onClick={() => {
              openModal("editStaff", { staff });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-500" /> Edit Staff
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            onClick={() => {
              openModal("archiveStaff", { staff });
              setIsOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer",
              staff.isActive
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50",
            )}
          >
            {staff.isActive ? (
              <Archive className="w-3.5 h-3.5" />
            ) : (
              <ArchiveRestore className="w-3.5 h-3.5" />
            )}
            {staff.isActive ? "Archive" : "Unarchive"}
          </button>
          <button
            onClick={() => {
              openModal("deleteStaff", { staff });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Staff
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

  const { data: staffList, isLoading, isError, refetch } = useFetchStandaloneStaff({
    search: debouncedSearch,
    includeInactive: true,
  });

  const staff = staffList || [];

  if (isError) {
    return (
      <div role="alert" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-red-700">Could not load staff.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 h-9 px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">
          No standalone staff found
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Staff without login accounts (e.g., doctors) will appear here.
        </p>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center gap-2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm text-xs font-semibold cursor-pointer"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-colors shadow-sm"
          />
        </div>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center justify-center gap-2 h-10 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-fnh-navy text-white">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Staff Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Specialization
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">
                      {s.fullName}
                    </p>
                    {s.email && (
                      <p className="text-xs text-slate-500">{s.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset", TONE_BADGE.neutral)}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">
                      {s.specialization || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">
                      {s.phoneNumber || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.isActive ? "Active" : "Inactive"} />
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
        <div className="md:hidden divide-y divide-slate-100">
          {staff.map((s) => (
            <div key={s.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {s.fullName}
                  </p>
                  <StatusBadge status={s.isActive ? "Active" : "Inactive"} className="shrink-0" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{s.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.specialization && (
                    <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20">
                      {s.specialization}
                    </span>
                  )}
                  {s.phoneNumber && (
                    <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20">
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
