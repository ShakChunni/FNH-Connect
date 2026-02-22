/**
 * User Management Page
 * Admin page for managing system users and staff
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import { useFetchUserStats } from "./hooks";
import { useUIStore, useUserFilterStore } from "./stores";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { SYSTEM_ROLES } from "./types";
import {
  AddUserModal,
  AddStaffModal,
  EditUserModal,
  ArchiveUserModal,
  ResetPasswordModal,
} from "./components/modals";
import { UserTable } from "./components/shared";
import type { UserWithStaff } from "./types";

const UserManagementPage = () => {
  const { activeModal, openModal, closeModal, modalData } = useUIStore();
  const { filters, setFilter, resetFilters } = useUserFilterStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Role filter dropdown
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const roleFilterRef = useRef<HTMLButtonElement>(null);

  // Status filter dropdown
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLButtonElement>(null);

  // Sync debounced search
  useEffect(() => {
    setFilter("search", debouncedSearch || undefined);
    setFilter("page", 1);
  }, [debouncedSearch, setFilter]);

  const { data: stats, isLoading: statsLoading } = useFetchUserStats();

  const selectedRoleLabel =
    SYSTEM_ROLES.find((r) => r.value === filters.role)?.label || "All Roles";
  const statusLabels: Record<string, string> = {
    all: "All Status",
    active: "Active",
    archived: "Archived",
  };
  const selectedStatusLabel = statusLabels[filters.status || "all"];

  const hasFilters =
    filters.search ||
    filters.role ||
    (filters.status && filters.status !== "all");

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="User Management"
              subtitle="Manage system users, roles, and staff members."
              actions={
                <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:w-auto">
                  <button
                    onClick={() => openModal("addUser")}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Add User</span>
                  </button>
                  <button
                    onClick={() => openModal("addStaff")}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Add Staff</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {/* Total Users */}
              <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-900/60">
                      Total Users
                    </span>
                  </div>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-blue-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-950">
                      {stats?.totalUsers || 0}
                    </p>
                  )}
                </div>
              </div>
              {/* Active */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-900/60">
                      Active
                    </span>
                  </div>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-emerald-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-950">
                      {stats?.activeUsers || 0}
                    </p>
                  )}
                </div>
              </div>
              {/* Archived */}
              <div className="bg-rose-50/50 rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <UserX className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-900/60">
                      Archived
                    </span>
                  </div>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-rose-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-950">
                      {stats?.archivedUsers || 0}
                    </p>
                  )}
                </div>
              </div>
              {/* Admins */}
              <div className="bg-violet-50/50 rounded-2xl p-4 sm:p-5 border border-violet-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Shield className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-violet-900/60">
                      Admins
                    </span>
                  </div>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-violet-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-violet-950">
                      {(stats?.byRole?.["admin"] || 0) +
                        (stats?.byRole?.["system-admin"] || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <button
                  ref={roleFilterRef}
                  onClick={() => setRoleFilterOpen(!roleFilterOpen)}
                  className="flex items-center justify-between gap-1.5 min-w-[160px] px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{selectedRoleLabel}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-gray-400 transition-transform",
                      roleFilterOpen && "rotate-180",
                    )}
                  />
                </button>
                <DropdownPortal
                  isOpen={roleFilterOpen}
                  onClose={() => setRoleFilterOpen(false)}
                  buttonRef={roleFilterRef}
                  className="w-52"
                >
                  <div className="py-1 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setFilter("role", undefined);
                        setFilter("page", 1);
                        setRoleFilterOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer",
                        !filters.role
                          ? "text-fnh-navy bg-fnh-navy/5"
                          : "text-gray-700",
                      )}
                    >
                      All Roles
                    </button>
                    {SYSTEM_ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setFilter("role", r.value);
                          setFilter("page", 1);
                          setRoleFilterOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer",
                          filters.role === r.value
                            ? "text-fnh-navy bg-fnh-navy/5"
                            : "text-gray-700",
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  ref={statusFilterRef}
                  onClick={() => setStatusFilterOpen(!statusFilterOpen)}
                  className="flex items-center justify-between gap-1.5 min-w-[140px] px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors cursor-pointer border border-gray-100"
                >
                  <span>{selectedStatusLabel}</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-gray-400 transition-transform",
                      statusFilterOpen && "rotate-180",
                    )}
                  />
                </button>
                <DropdownPortal
                  isOpen={statusFilterOpen}
                  onClose={() => setStatusFilterOpen(false)}
                  buttonRef={statusFilterRef}
                  className="w-40"
                >
                  <div className="py-1">
                    {(["all", "active", "archived"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setFilter("status", s);
                          setFilter("page", 1);
                          setStatusFilterOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer capitalize",
                          filters.status === s
                            ? "text-fnh-navy bg-fnh-navy/5"
                            : "text-gray-700",
                        )}
                      >
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    resetFilters();
                    setSearchTerm("");
                  }}
                  className="px-3 py-2 text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            <UserTable />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal isOpen={activeModal === "addUser"} onClose={closeModal} />
      <AddStaffModal isOpen={activeModal === "addStaff"} onClose={closeModal} />
      <EditUserModal
        isOpen={activeModal === "editUser"}
        onClose={closeModal}
        user={(modalData?.user as UserWithStaff) || null}
      />
      <ArchiveUserModal
        isOpen={activeModal === "archiveUser"}
        onClose={closeModal}
        user={(modalData?.user as UserWithStaff) || null}
      />
      <ResetPasswordModal
        isOpen={activeModal === "resetPassword"}
        onClose={closeModal}
        user={(modalData?.user as UserWithStaff) || null}
      />
    </div>
  );
};

export default UserManagementPage;
