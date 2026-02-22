/**
 * Activity Table Component
 * Combined chronological log of all purchases AND sales, sorted by date descending
 */

"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, ShoppingCart } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchActivity } from "../../hooks";

interface ActivityTableProps {
  search?: string;
  startDate?: string;
  endDate?: string;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  search = "",
  startDate,
  endDate,
}) => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useFetchActivity({
    search: search.trim() || undefined,
    startDate,
    endDate,
    page,
    limit: 20,
  });

  const activityRecords = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || page;
  const limit = data?.limit || 20;
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDatePart = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(new Date(dateStr));
  };

  const formatTimePart = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
        {/* Header skeleton */}
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-gray-100">
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-10 bg-gray-100 rounded animate-pulse ml-auto" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-gray-50"
          >
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            <div
              className={`h-5 w-16 rounded-full animate-pulse ${i % 2 === 0 ? "bg-emerald-50" : "bg-blue-50"}`}
            />
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-10 bg-gray-100 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (activityRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Activity Yet
        </h3>
        <p className="text-sm text-gray-500">
          Purchases and sales will appear here as they are recorded.
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
            {formatNumber(total)} activit{total !== 1 ? "ies" : "y"}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Date & Time (BDT)
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Medicine
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Details
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activityRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">
                        {formatDatePart(record.date)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimePart(record.date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {record.type === "purchase" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Purchase
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                        <ShoppingCart className="w-3 h-3" />
                        Sale
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-bold text-gray-900">
                      {record.medicineName}
                    </p>
                    {record.medicineBrand && (
                      <p className="text-xs text-gray-500">
                        {record.medicineBrand}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {record.type === "purchase" ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {record.companyName}
                        </p>
                        {record.invoiceNumber && (
                          <p className="text-xs text-gray-500">
                            Inv: {record.invoiceNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {record.patientName}
                        </p>
                        {record.patientPhone && (
                          <p className="text-xs text-gray-500">
                            {record.patientPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-bold text-gray-900">
                    {formatNumber(record.quantity)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-700">
                    {formatCurrency(record.unitPrice)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`text-sm font-bold ${
                        record.type === "purchase"
                          ? "text-emerald-700"
                          : "text-blue-700"
                      }`}
                    >
                      {formatCurrency(record.totalAmount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {activityRecords.map((record) => (
            <div key={record.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {record.type === "purchase" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      Purchase
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full">
                      <ShoppingCart className="w-3 h-3" />
                      Sale
                    </span>
                  )}
                  <span className="text-xs text-gray-500 flex flex-col leading-tight">
                    <span>{formatDatePart(record.date)}</span>
                    <span>{formatTimePart(record.date)} BDT</span>
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    record.type === "purchase"
                      ? "text-emerald-700"
                      : "text-blue-700"
                  }`}
                >
                  {formatCurrency(record.totalAmount)}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {record.medicineName}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-gray-500">
                    {record.type === "purchase" ? "Company:" : "Patient:"}
                  </span>{" "}
                  {record.type === "purchase"
                    ? record.companyName
                    : record.patientName}
                </span>
                <span>
                  <span className="font-semibold text-gray-500">Qty:</span>{" "}
                  {formatNumber(record.quantity)} ×{" "}
                  {formatCurrency(record.unitPrice)}
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
            onPageChange={setPage}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </div>
      )}
    </>
  );
};

export default ActivityTable;
