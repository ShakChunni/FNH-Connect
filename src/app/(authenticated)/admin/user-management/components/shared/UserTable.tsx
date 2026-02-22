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

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "system-admin":
      return "bg-red-100 text-red-700 border-red-200";
    case "admin":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "receptionist":
    case "receptionist-infertility":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "medicine-pharmacist":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
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
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
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
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-500" /> Edit User
          </button>
          <button
            onClick={() => {
              openModal("resetPassword", { user });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Reset Password
          </button>
          <hr className="my-1 border-gray-100" />
          <button
            onClick={() => {
              openModal("archiveUser", { user });
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${user.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
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
  const { data, isLoading } = useFetchUsers(filters);

  const users = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const total = data?.total || 0;

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

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 mb-1">No users found</h3>
        <p className="text-xs text-gray-500">
          Try adjusting your filters or add a new user.
        </p>
      </div>
    );
  }

  return (
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
                Username
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                System Role
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Staff Role
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
            {users.map((u) => {
              const roleInfo = SYSTEM_ROLES.find((r) => r.value === u.role);
              return (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">
                      {u.staff.fullName}
                    </p>
                    {u.staff.email && (
                      <p className="text-xs text-gray-500">{u.staff.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 font-medium">
                      {u.username}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border",
                        getRoleBadgeColor(u.role),
                      )}
                    >
                      {roleInfo?.label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {u.staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                        u.isActive
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          u.isActive ? "bg-green-500" : "bg-red-500",
                        )}
                      />
                      {u.isActive ? "Active" : "Archived"}
                    </span>
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
      <div className="md:hidden divide-y divide-gray-100">
        {users.map((u) => {
          const roleInfo = SYSTEM_ROLES.find((r) => r.value === u.role);
          return (
            <div key={u.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {u.staff.fullName}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0",
                      u.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        u.isActive ? "bg-green-500" : "bg-red-500",
                      )}
                    />
                    {u.isActive ? "Active" : "Archived"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">@{u.username}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold border",
                      getRoleBadgeColor(u.role),
                    )}
                  >
                    {roleInfo?.label || u.role}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {users.length} of {total} users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter("page", Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setFilter("page", Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition-colors"
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
