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
import {
  getMedicineDisplayName,
  getMedicineGenericSubtitle,
} from "../../utils/medicineDisplay";

const PurchaseTable: React.FC = () => {
  const { filters, setFilter } = usePurchaseFilterStore();
  const { data, isLoading, isError, error, refetch } = useFetchPurchases(filters);

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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-slate-100">
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-8 bg-slate-100 rounded animate-pulse ml-auto" />
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-slate-50"
          >
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-blue-50 rounded-lg animate-pulse hidden md:block" />
            <div className="h-4 w-8 bg-slate-100 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-emerald-50 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse hidden md:block" />
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
          {error instanceof Error ? error.message : "Failed to load purchases"}
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

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">
          No Purchases Found
        </h3>
        <p className="text-sm text-slate-500">
          {filters.search
            ? "No purchases match your search criteria."
            : 'No purchases recorded yet. Click "Add Purchase" to get started.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {formatNumber(total)} purchase{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-fnh-navy text-white">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Invoice #
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Medicine
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Group
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Qty
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Price
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  VAT + Tax
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Discount
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold text-slate-900">
                      {purchase.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-slate-700 font-medium">
                      {purchase.company?.name || "Unknown Company"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-slate-900">
                      {getMedicineDisplayName(purchase.medicine)}
                    </p>
                    {getMedicineGenericSubtitle(purchase.medicine) && (
                      <p className="text-xs text-slate-500">
                        Generic: {getMedicineGenericSubtitle(purchase.medicine)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                      {purchase.medicine.group?.name || "Unknown Group"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-bold tabular-nums text-slate-900">
                    {formatNumber(purchase.quantity)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-slate-700">
                    {formatCurrency(purchase.unitPrice)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-slate-700">
                    {formatCurrency(purchase.vatTax)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-slate-700">
                    {formatCurrency(purchase.discountAmount)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-sm font-bold tabular-nums text-emerald-700">
                      {formatCurrency(purchase.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {formatDate(purchase.purchaseDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {getMedicineDisplayName(purchase.medicine)}
                  </p>
                  {getMedicineGenericSubtitle(purchase.medicine) && (
                    <p className="text-xs text-slate-500">
                      Generic: {getMedicineGenericSubtitle(purchase.medicine)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Invoice: {purchase.invoiceNumber}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(purchase.totalAmount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                <span>
                  <span className="font-semibold text-slate-500">Company:</span>{" "}
                  {purchase.company?.name || "Unknown Company"}
                </span>
                <span>
                  <span className="font-semibold text-slate-500">Qty:</span>{" "}
                  {formatNumber(purchase.quantity)} ×{" "}
                  {formatCurrency(purchase.unitPrice)}
                </span>
                <span>
                  <span className="font-semibold text-slate-500">VAT + Tax:</span>{" "}
                  {formatCurrency(purchase.vatTax)}
                </span>
                <span>
                  <span className="font-semibold text-slate-500">Discount:</span>{" "}
                  {formatCurrency(purchase.discountAmount)}
                </span>
                <span>
                  <span className="font-semibold text-slate-500">Date:</span>{" "}
                  {formatDate(purchase.purchaseDate)}
                </span>
              </div>
            </div>
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
