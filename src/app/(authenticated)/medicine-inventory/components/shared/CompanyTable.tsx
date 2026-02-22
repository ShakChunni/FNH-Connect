/**
 * Company Table Component
 * Displays pharmaceutical companies and allows quick edit
 */

"use client";

import React, { useEffect, useState } from "react";
import { Building2, Phone } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchPaginatedMedicineCompanies } from "../../hooks";
import { useUIStore } from "../../stores";

interface CompanyTableProps {
  search?: string;
  startDate?: string;
  endDate?: string;
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  search = "",
  startDate,
  endDate,
}) => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } =
    useFetchPaginatedMedicineCompanies({
      activeOnly: true,
      search: search.trim() || undefined,
      startDate,
      endDate,
      page,
      limit: 20,
    });
  const { openModal } = useUIStore();

  const companies = data?.data || [];
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-gray-50"
          >
            <div className="h-8 w-8 bg-emerald-50 rounded-lg animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
        <p className="text-sm text-red-600 font-medium">
          {error instanceof Error ? error.message : "Failed to load companies"}
        </p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Companies Found
        </h3>
        <p className="text-sm text-gray-500">
          {search.trim()
            ? "No companies match your search criteria."
            : 'No companies have been added yet. Click "Manage" to add one.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {total} compan{total !== 1 ? "ies" : "y"}
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() =>
                openModal("editCompany", {
                  companyId: company.id,
                  name: company.name,
                  address: company.address,
                  phoneNumber: company.phoneNumber,
                })
              }
              className="w-full flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {company.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {company.phoneNumber && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {company.phoneNumber}
                    </span>
                  )}
                  {!company.phoneNumber && company.address && (
                    <span className="truncate max-w-[220px]">
                      {company.address}
                    </span>
                  )}
                  {!company.phoneNumber && !company.address && <span>—</span>}
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Edit
              </span>
            </button>
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

export default CompanyTable;
