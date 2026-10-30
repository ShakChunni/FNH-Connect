/**
 * User Management Page
 * Admin page for managing system users and staff
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  EditStaffModal,
  ArchiveStaffModal,
  DeleteStaffModal,
  ArchiveUserModal,
  ResetPasswordModal,
} from "./components/modals";
import { UserTable, StaffTable } from "./components/shared";
import { useAuth } from "@/app/AuthContext";
import { isSystemAdminRole } from "@/lib/roles";
import type { UserWithStaff, StaffRecord } from "./types";

const UserManagementPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Client-side guard: User Management is restricted to system-admin only
  useEffect(() => {
    if (user && !isSystemAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

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

  // Section tabs: users vs standalone staff
  const [activeSection, setActiveSection] = useState<"users" | "staff">(
    "users",
  );

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
                    className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Add User</span>
                  </button>
                  <button
                    onClick={() => openModal("addStaff")}
                    className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
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
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Total Users
                  </span>
                </div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums truncate min-w-0">
                    {stats ? stats.totalUsers : "—"}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Active
                  </span>
                </div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums truncate min-w-0">
                    {stats ? stats.activeUsers : "—"}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <UserX className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Archived
                  </span>
                </div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums truncate min-w-0">
                    {stats ? stats.archivedUsers : "—"}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Admins
                  </span>
                </div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums truncate min-w-0">
                    {stats ? (stats.byRole?.["admin"] || 0) + (stats.byRole?.["system-admin"] || 0) : "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveSection("users")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer",
                  activeSection === "users"
                    ? "bg-fnh-navy text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                Users
              </button>
              <button
                onClick={() => setActiveSection("staff")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer",
                  activeSection === "staff"
                    ? "bg-fnh-navy text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                Staff without Accounts
              </button>
            </div>
          </div>

          {/* Filters */}
          {activeSection === "users" && (
            <div className="px-1 sm:px-2 lg:px-4">
              <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-colors"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <button
                    ref={roleFilterRef}
                    onClick={() => setRoleFilterOpen(!roleFilterOpen)}
                    className="flex items-center justify-between gap-1.5 min-w-[160px] px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer border border-slate-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{selectedRoleLabel}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-slate-400 transition-transform",
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
                          "w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer",
                          !filters.role
                            ? "text-fnh-navy bg-fnh-navy/5"
                            : "text-slate-700",
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
                            "w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer",
                            filters.role === r.value
                              ? "text-fnh-navy bg-fnh-navy/5"
                              : "text-slate-700",
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
                    className="flex items-center justify-between gap-1.5 min-w-[140px] px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer border border-slate-100"
                  >
                    <span>{selectedStatusLabel}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-slate-400 transition-transform",
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
                            "w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer capitalize",
                            filters.status === s
                              ? "text-fnh-navy bg-fnh-navy/5"
                              : "text-slate-700",
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
                    className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            {activeSection === "users" ? (
              <UserTable />
            ) : (
              <StaffTable onAddStaff={() => openModal("addStaff")} />
            )}
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
      <EditStaffModal
        isOpen={activeModal === "editStaff"}
        onClose={closeModal}
        staff={(modalData?.staff as StaffRecord) || null}
      />
      <ArchiveStaffModal
        isOpen={activeModal === "archiveStaff"}
        onClose={closeModal}
        staff={(modalData?.staff as StaffRecord) || null}
      />
      <DeleteStaffModal
        isOpen={activeModal === "deleteStaff"}
        onClose={closeModal}
        staff={(modalData?.staff as StaffRecord) || null}
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
