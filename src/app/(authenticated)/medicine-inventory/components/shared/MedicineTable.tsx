/**
 * Medicine Table Component
 * Displays all medicines with stock levels and group info
 */

"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Layers, List, Pill } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchMedicines } from "../../hooks";
import { useMedicineFilterStore, useUIStore } from "../../stores";
import type { Medicine } from "../../types";
import {
  getMedicineDisplayName,
  getMedicineGenericSubtitle,
} from "../../utils/medicineDisplay";

const MedicineTable: React.FC = () => {
  const { filters, setFilter } = useMedicineFilterStore();
  const { openModal } = useUIStore();
  const { data, isLoading, isError, error } = useFetchMedicines(filters);
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");

  const fetchedMedicines = data?.data;
  const medicines = useMemo(() => fetchedMedicines ?? [], [fetchedMedicines]);
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || filters.page || 1;
  const limit = data?.limit || filters.limit || 20;
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

  const groupedMedicines = useMemo(() => {
    const groups = new Map<
      number,
      { groupId: number; name: string; medicines: Medicine[] }
    >();

    medicines.forEach((medicine) => {
      const groupId = medicine.group?.id || 0;
      const name = medicine.group?.name || "Unknown Group";
      const existing = groups.get(groupId);

      if (existing) {
        existing.medicines.push(medicine);
        return;
      }

      groups.set(groupId, {
        groupId,
        name,
        medicines: [medicine],
      });
    });

    return [...groups.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [medicines]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-BD").format(num);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-gray-100">
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-10 bg-gray-100 rounded animate-pulse ml-auto" />
          <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-gray-50"
          >
            <div className="space-y-1 flex-1">
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-20 bg-blue-50 rounded-lg animate-pulse" />
            <div className="h-4 w-14 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-4 w-14 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-4 w-10 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-16 bg-emerald-50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
        <p className="text-sm text-red-600 font-medium">
          {error instanceof Error ? error.message : "Failed to load medicines"}
        </p>
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pill className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Medicines Found
        </h3>
        <p className="text-sm text-gray-500">
          {filters.search
            ? "No medicines match your search criteria."
            : 'No medicines have been added yet. Click "Add Medicine" to get started.'}
        </p>
      </div>
    );
  }

  const renderDesktopTable = (rows: Medicine[]) => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Medicine Name
            </th>
            <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Group
            </th>
            <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Strength
            </th>
            <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Form
            </th>
            <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Stock
            </th>
            <th className="text-center px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((medicine) => {
            const isLowStock =
              medicine.currentStock <= medicine.lowStockThreshold;
            const groupName = medicine.group?.name || "Unknown Group";

            return (
              <tr
                key={medicine.id}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => openModal("editMedicine", { medicine })}
              >
                <td className="px-6 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {getMedicineDisplayName(medicine)}
                    </p>
                    {getMedicineGenericSubtitle(medicine) && (
                      <p className="text-xs text-gray-500">
                        Generic: {getMedicineGenericSubtitle(medicine)}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openModal("editGroup", {
                        groupId: medicine.group?.id,
                        groupName,
                      });
                    }}
                    className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {groupName}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">
                  {medicine.strength || "—"}
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">
                  {medicine.dosageForm || "—"}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span
                    className={`text-sm font-bold ${
                      isLowStock ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatNumber(medicine.currentStock)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  {isLowStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg">
                      <AlertTriangle className="w-3 h-3" />
                      Low
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">
                      In Stock
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = (rows: Medicine[]) => (
    <div className="md:hidden divide-y divide-gray-100">
      {rows.map((medicine) => {
        const isLowStock =
          medicine.currentStock <= medicine.lowStockThreshold;
        const groupName = medicine.group?.name || "Unknown Group";

        return (
          <div
            key={medicine.id}
            className="p-4 space-y-2 cursor-pointer hover:bg-gray-50/60 transition-colors"
            onClick={() => openModal("editMedicine", { medicine })}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {getMedicineDisplayName(medicine)}
                </p>
                {getMedicineGenericSubtitle(medicine) && (
                  <p className="text-xs text-gray-500">
                    Generic: {getMedicineGenericSubtitle(medicine)}
                  </p>
                )}
              </div>
              {isLowStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-lg shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  Low
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-lg shrink-0">
                  In Stock
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span>
                <span className="font-semibold text-gray-500">Group:</span>{" "}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openModal("editGroup", {
                      groupId: medicine.group?.id,
                      groupName,
                    });
                  }}
                  className="text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {groupName}
                </button>
              </span>
              {medicine.strength && (
                <span>
                  <span className="font-semibold text-gray-500">Strength:</span>{" "}
                  {medicine.strength}
                </span>
              )}
              <span>
                <span className="font-semibold text-gray-500">Stock:</span>{" "}
                <span className={`font-bold ${isLowStock ? "text-red-600" : ""}`}>
                  {formatNumber(medicine.currentStock)}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {formatNumber(total)} medicine{total !== 1 ? "s" : ""}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {viewMode === "grouped"
                ? `${groupedMedicines.length} group${groupedMedicines.length !== 1 ? "s" : ""} on this page`
                : "List view"}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 self-start sm:self-auto p-1 bg-white rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              aria-pressed={viewMode === "grouped"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                viewMode === "grouped"
                  ? "bg-fnh-navy text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              title="Group-wise view"
            >
              <Layers className="w-3.5 h-3.5" />
              Groups
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-fnh-navy text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>

        {viewMode === "grouped" ? (
          <div className="divide-y divide-gray-100">
            {groupedMedicines.map((group) => {
              const lowStockCount = group.medicines.filter(
                (medicine) =>
                  medicine.currentStock <= medicine.lowStockThreshold,
              ).length;
              const totalStock = group.medicines.reduce(
                (sum, medicine) => sum + medicine.currentStock,
                0,
              );

              return (
                <section key={`${group.groupId}-${group.name}`}>
                  <div className="px-4 sm:px-6 py-3 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <button
                        type="button"
                        onClick={() =>
                          openModal("editGroup", {
                            groupId: group.groupId,
                            groupName: group.name,
                          })
                        }
                        className="truncate text-sm font-black text-blue-900 hover:text-blue-700 cursor-pointer"
                      >
                        {group.name}
                      </button>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-blue-700 border border-blue-100">
                        {group.medicines.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500">
                      <span>Total stock: {formatNumber(totalStock)}</span>
                      {lowStockCount > 0 && (
                        <span className="text-amber-700">
                          {lowStockCount} low stock
                        </span>
                      )}
                    </div>
                  </div>
                  {renderDesktopTable(group.medicines)}
                  {renderMobileCards(group.medicines)}
                </section>
              );
            })}
          </div>
        ) : (
          <>
            {renderDesktopTable(medicines)}
            {renderMobileCards(medicines)}
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={total}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={(page) => setFilter("page", page)}
            onPrev={() => setFilter("page", Math.max(1, currentPage - 1))}
            onNext={() =>
              setFilter("page", Math.min(totalPages, currentPage + 1))
            }
          />
        </div>
      )}
    </>
  );
};

export default MedicineTable;
