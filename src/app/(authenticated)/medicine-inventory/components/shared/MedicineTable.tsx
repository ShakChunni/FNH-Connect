/**
 * Medicine Table Component
 * Displays all medicines with stock levels and group info
 */

"use client";

import React from "react";
import { Pill, AlertTriangle } from "lucide-react";
import { useFetchMedicines } from "../../hooks";
import { useMedicineFilterStore } from "../../stores";

const MedicineTable: React.FC = () => {
  const { filters } = useMedicineFilterStore();
  const { data, isLoading, isError, error } = useFetchMedicines(filters);

  const medicines = data?.data || [];
  const total = data?.total || 0;

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {formatNumber(total)} medicine{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Generic Name
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
            {medicines.map((medicine) => {
              const isLowStock =
                medicine.currentStock <= medicine.lowStockThreshold;
              const groupName = medicine.group?.name || "Unknown Group";
              return (
                <tr
                  key={medicine.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {medicine.genericName}
                      </p>
                      {medicine.brandName && (
                        <p className="text-xs text-gray-500">
                          {medicine.brandName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                      {groupName}
                    </span>
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

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {medicines.map((medicine) => {
          const isLowStock =
            medicine.currentStock <= medicine.lowStockThreshold;
          const groupName = medicine.group?.name || "Unknown Group";
          return (
            <div key={medicine.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {medicine.genericName}
                  </p>
                  {medicine.brandName && (
                    <p className="text-xs text-gray-500">
                      {medicine.brandName}
                    </p>
                  )}
                </div>
                {isLowStock ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-lg">
                    <AlertTriangle className="w-3 h-3" />
                    Low
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-lg">
                    In Stock
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-gray-500">Group:</span>{" "}
                  {groupName}
                </span>
                {medicine.strength && (
                  <span>
                    <span className="font-semibold text-gray-500">
                      Strength:
                    </span>{" "}
                    {medicine.strength}
                  </span>
                )}
                <span>
                  <span className="font-semibold text-gray-500">Stock:</span>{" "}
                  <span
                    className={`font-bold ${isLowStock ? "text-red-600" : ""}`}
                  >
                    {formatNumber(medicine.currentStock)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicineTable;
