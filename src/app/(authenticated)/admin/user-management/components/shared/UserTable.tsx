/**
 * UserTable
 * Paginated table of users with action buttons
 */

"use client";

import React, { useRef, useState } from "react";
import {
  Edit3,
  Archive,
  ArchiveRestore,
  KeyRound,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchUsers } from "../../hooks";
import { useUserFilterStore, useUIStore } from "../../stores";
import { SYSTEM_ROLES } from "../../types";
import type { UserWithStaff } from "../../types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TONE_BADGE, type StatusTone } from "@/lib/statusStyles";

// Role chips use the shared tones: elevated access needs attention,
// pharmacy is settled work, front desk is ongoing, everything else is neutral.
const getRoleTone = (role: string): StatusTone => {
  switch (role) {
    case "system-admin":
      return "warning";
    case "admin":
    case "receptionist":
    case "receptionist-infertility":
      return "info";
    case "medicine-pharmacist":
      return "success";
    default:
      return "neutral";
  }
};

const ActionMenu: React.FC<{ user: UserWithStaff }> = ({ user }) => {
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
        className="min-w-[160px]"
      >
        <div className="py-1">
          <button
            onClick={() => {
              openModal("editUser", { user });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-500" /> Edit User
          </button>
          <button
            onClick={() => {
              openModal("resetPassword", { user });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Reset Password
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            onClick={() => {
              openModal("archiveUser", { user });
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${user.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"}`}
          >
            {user.isActive ? (
              <Archive className="w-3.5 h-3.5" />
            ) : (
              <ArchiveRestore className="w-3.5 h-3.5" />
            )}
            {user.isActive ? "Archive" : "Unarchive"}
          </button>
        </div>
      </DropdownPortal>
    </div>
  );
};

export const UserTable: React.FC = () => {
  const { filters, setFilter } = useUserFilterStore();
  const { data, isLoading, isError, refetch } = useFetchUsers(filters);

  const users = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const total = data?.total || 0;

  if (isError) {
    return (
      <div role="alert" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-red-700">Could not load users.</p>
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

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">No users found</h3>
        <p className="text-xs text-slate-500">
          Try adjusting your filters or add a new user.
        </p>
      </div>
    );
  }

  return (
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
                Username
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                System Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Staff Role
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
            {users.map((u) => {
              const roleInfo = SYSTEM_ROLES.find((r) => r.value === u.role);
              return (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">
                      {u.staff.fullName}
                    </p>
                    {u.staff.email && (
                      <p className="text-xs text-slate-500">{u.staff.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 font-medium">
                      {u.username}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset",
                        TONE_BADGE[getRoleTone(u.role)],
                      )}
                    >
                      {roleInfo?.label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">
                      {u.staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.isActive ? "Active" : "Archived"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu user={u} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {users.map((u) => {
          const roleInfo = SYSTEM_ROLES.find((r) => r.value === u.role);
          return (
            <div key={u.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {u.staff.fullName}
                  </p>
                  <StatusBadge status={u.isActive ? "Active" : "Archived"} className="shrink-0" />
                </div>
                <p className="text-xs text-slate-500 mb-1">@{u.username}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-2xs font-semibold ring-1 ring-inset",
                      TONE_BADGE[getRoleTone(u.role)],
                    )}
                  >
                    {roleInfo?.label || u.role}
                  </span>
                  <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20">
                    {u.staff.role}
                  </span>
                </div>
              </div>
              <ActionMenu user={u} />
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Showing {users.length} of {total} users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter("page", Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setFilter("page", Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
