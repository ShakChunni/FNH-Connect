/**
 * Purchase Table Component
 * Displays all medicine purchases with company, medicine, and financial info
 */

"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchPurchases } from "../../hooks";
import { usePurchaseFilterStore } from "../../stores";

const PurchaseTable: React.FC = () => {
  const { filters, setFilter } = usePurchaseFilterStore();
  const { data, isLoading, isError, error } = useFetchPurchases(filters);

  const purchases = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || filters.page || 1;
  const limit = data?.limit || filters.limit || 20;
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

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
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
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
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-blue-50 rounded-lg animate-pulse hidden md:block" />
            <div className="h-4 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-emerald-50 rounded animate-pulse" />
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
          {error instanceof Error ? error.message : "Failed to load purchases"}
        </p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Purchases Found
        </h3>
        <p className="text-sm text-gray-500">
          {filters.search
            ? "No purchases match your search criteria."
            : 'No purchases recorded yet. Click "Add Purchase" to get started.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {formatNumber(total)} purchase{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Invoice #
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Medicine
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Group
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
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold text-gray-900">
                      {purchase.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-gray-700 font-medium">
                      {purchase.company?.name || "Unknown Company"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-gray-900">
                      {purchase.medicine.genericName}
                    </p>
                    {purchase.medicine.brandName && (
                      <p className="text-xs text-gray-500">
                        {purchase.medicine.brandName}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                      {purchase.medicine.group?.name || "Unknown Group"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-bold text-gray-900">
                    {formatNumber(purchase.quantity)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-700">
                    {formatCurrency(purchase.unitPrice)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-sm font-bold text-emerald-700">
                      {formatCurrency(purchase.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">
                    {formatDate(purchase.purchaseDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {purchase.medicine.genericName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Invoice: {purchase.invoiceNumber}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(purchase.totalAmount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-gray-500">Company:</span>{" "}
                  {purchase.company?.name || "Unknown Company"}
                </span>
                <span>
                  <span className="font-semibold text-gray-500">Qty:</span>{" "}
                  {formatNumber(purchase.quantity)} ×{" "}
                  {formatCurrency(purchase.unitPrice)}
                </span>
                <span>
                  <span className="font-semibold text-gray-500">Date:</span>{" "}
                  {formatDate(purchase.purchaseDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
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

export default PurchaseTable;
