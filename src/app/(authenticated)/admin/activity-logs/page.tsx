"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Activity,
  Search,
  RefreshCw,
  Users,
  LogIn,
  Clock,
  Zap,
} from "lucide-react";
import { useFetchActivityLogs } from "./hooks";
import {
  ActivityLogTable,
  ActivityLogDetailModal,
  ActionTypeFilter,
  UserFilter,
} from "./components";
import { useActivityLogsStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const ActivityLogsPage = () => {
  const {
    filters,
    setFilter,
    selectedLogId,
    setSelectedLogId,
    resetFilters,
    setPage,
  } = useActivityLogsStore();

  // Ref for scrolling table container on pagination
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Local search state for immediate input feedback
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sync debounced search to store
  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading, isError, refetch, isFetching } =
    useFetchActivityLogs(filters);

  const logs = data?.logs || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };
  const summary = data?.summary || {
    totalActions: 0,
    uniqueUsers: 0,
    loginCount: 0,
    lastActivity: null,
  };
  const filterOptions = data?.filterOptions || { actionTypes: [], users: [] };
  const hasData = !!data;

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "No recent activity";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const hasActiveFilters =
    filters.search ||
    filters.action !== "All" ||
    filters.userId !== null ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Activity Logs"
              subtitle="Track user actions, logins, and system events."
              actions={
                <div className="w-full flex justify-center sm:w-auto">
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isFetching ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Total Actions
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-20 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-slate-900 tabular-nums">
                    {hasData ? summary.totalActions.toLocaleString() : "—"}
                  </p>
                )}
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">
                  In selected period
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Unique Users
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-slate-900 tabular-nums">
                    {hasData ? summary.uniqueUsers : "—"}
                  </p>
                )}
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">
                  Active in logs
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <LogIn className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Login Events
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-slate-900 tabular-nums">
                    {hasData ? summary.loginCount : "—"}
                  </p>
                )}
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">
                  Successful logins
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
                    Last Activity
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-20 bg-slate-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-black text-slate-900 tabular-nums">
                    {hasData ? formatRelativeTime(summary.lastActivity) : "—"}
                  </p>
                )}
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">
                  Most recent log
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 relative">
              {/* Search Input */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users, actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-colors"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
                <ActionTypeFilter
                  actionTypes={filterOptions.actionTypes}
                  currentAction={filters.action}
                  onActionChange={(action) => setFilter("action", action)}
                  disabled={isLoading && !data}
                />

                <UserFilter
                  users={filterOptions.users}
                  currentUserId={filters.userId}
                  onUserChange={(userId) => setFilter("userId", userId)}
                  disabled={isLoading && !data}
                />

                <div className="w-full sm:w-[240px] lg:w-[280px]">
                  <DateRangePicker
                    value={{
                      from: filters.startDate
                        ? new Date(filters.startDate)
                        : undefined,
                      to: filters.endDate
                        ? new Date(filters.endDate)
                        : undefined,
                    }}
                    onChange={(range) => {
                      const formatLocalDate = (date: Date | undefined) => {
                        if (!date) return "";
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      };
                      setFilter("startDate", formatLocalDate(range?.from));
                      setFilter("endDate", formatLocalDate(range?.to));
                    }}
                    placeholder="Filter by date range"
                    disabled={isLoading && !data}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      resetFilters();
                      setSearchTerm("");
                    }}
                    disabled={isLoading && !data}
                    className="h-9 px-3 sm:px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear filters
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Table with Pagination */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            <div
              ref={tableContainerRef}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <ActivityLogTable
                logs={logs}
                isLoading={isLoading && !data}
                isError={isError && !data}
                onRetry={() => refetch()}
                onSelectLog={(log) => setSelectedLogId(log.id)}
              />
            </div>

            {/* Pagination - Separate from table container */}
            {pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalResults={pagination.total}
                  startIndex={
                    pagination.total > 0
                      ? (pagination.page - 1) * pagination.limit + 1
                      : 0
                  }
                  endIndex={Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                  onPageChange={setPage}
                  scrollContainerRef={tableContainerRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ActivityLogDetailModal
        logId={selectedLogId}
        isOpen={selectedLogId !== null}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
};

export default ActivityLogsPage;
