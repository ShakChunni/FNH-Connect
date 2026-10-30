/**
 * Group Table Component
 * Displays medicine groups and allows quick edit
 */

"use client";

import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchPaginatedMedicineGroups } from "../../hooks";
import { useUIStore } from "../../stores";

interface GroupTableProps {
  search?: string;
  startDate?: string;
  endDate?: string;
}

const GroupTable: React.FC<GroupTableProps> = ({
  search = "",
  startDate,
  endDate,
}) => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useFetchPaginatedMedicineGroups({
    activeOnly: true,
    search: search.trim() || undefined,
    startDate,
    endDate,
    page,
    limit: 20,
  });
  const { openModal } = useUIStore();

  const groups = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || page;
  const limit = data?.limit || 20;
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-slate-50"
          >
            <div className="h-8 w-8 bg-purple-50 rounded-lg animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center"
      >
        <p className="text-sm font-medium text-red-700">
          {error instanceof Error ? error.message : "Failed to load groups"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">
          No Groups Found
        </h3>
        <p className="text-sm text-slate-500">
          {search.trim()
            ? "No groups match your search criteria."
            : 'No groups have been added yet. Click "Manage" to add one.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {total} group{total !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y divide-slate-50">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() =>
                openModal("editGroup", {
                  groupId: group.id,
                  groupName: group.name,
                })
              }
              className="w-full flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {group.name}
                </p>
                <p className="text-xs text-slate-500">
                  {group._count?.medicines ?? 0} medicine
                  {(group._count?.medicines ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-2xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                Edit
              </span>
            </button>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={total}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setPage}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </div>
      )}
    </>
  );
};

export default GroupTable;
