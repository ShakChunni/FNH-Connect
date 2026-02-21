/**
 * Sale Table Component
 * Displays all medicine sales with patient, medicine, and FIFO source info
 */

"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { useFetchSales } from "../../hooks";
import { useSaleFilterStore } from "../../stores";

const SaleTable: React.FC = () => {
  const { filters } = useSaleFilterStore();
  const { data, isLoading, isError, error } = useFetchSales(filters);

  const sales = data?.data || [];
  const total = data?.total || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(new Date(dateStr));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-BD").format(num);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-gray-50"
          >
            <div className="space-y-1">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-blue-50 rounded-lg animate-pulse hidden md:block" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-4 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-blue-50 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
        <p className="text-sm text-red-600 font-medium">
          {error instanceof Error ? error.message : "Failed to load sales"}
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Sales Found
        </h3>
        <p className="text-sm text-gray-500">
          {filters.search
            ? "No sales match your search criteria."
            : 'No sales recorded yet. Click "Record Sale" to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {formatNumber(total)} sale{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Patient
              </th>
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Medicine
              </th>
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Group
              </th>
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Company
              </th>
              <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Qty
              </th>
              <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Price
              </th>
              <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Total
              </th>
              <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {sale.patient?.fullName || "Unknown Patient"}
                    </p>
                    {sale.patient.phoneNumber && (
                      <p className="text-xs text-gray-500">
                        {sale.patient.phoneNumber}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-900">
                    {sale.medicine.genericName}
                  </p>
                  {sale.medicine.brandName && (
                    <p className="text-xs text-gray-500">
                      {sale.medicine.brandName}
                    </p>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                    {sale.medicine.group?.name || "Unknown Group"}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">
                  {sale.purchase.company?.name || "Unknown Company"}
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-gray-900">
                  {formatNumber(sale.quantity)}
                </td>
                <td className="px-6 py-3.5 text-right text-sm text-gray-700">
                  {formatCurrency(sale.unitPrice)}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">
                  {formatDate(sale.saleDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {sales.map((sale) => (
          <div key={sale.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {sale.patient?.fullName || "Unknown Patient"}
                </p>
                <p className="text-xs text-gray-500">
                  {sale.medicine.genericName}
                </p>
              </div>
              <span className="text-sm font-bold text-blue-700">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span>
                <span className="font-semibold text-gray-500">Company:</span>{" "}
                {sale.purchase.company?.name || "Unknown Company"}
              </span>
              <span>
                <span className="font-semibold text-gray-500">Qty:</span>{" "}
                {formatNumber(sale.quantity)} × {formatCurrency(sale.unitPrice)}
              </span>
              <span>
                <span className="font-semibold text-gray-500">Date:</span>{" "}
                {formatDate(sale.saleDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaleTable;
