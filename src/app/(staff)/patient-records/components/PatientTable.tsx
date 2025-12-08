"use client";

import React, { useState, useMemo } from "react";
import {
  Phone,
  MapPin,
  Calendar,
  Edit3,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users,
} from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination/Pagination";
import type { PatientData } from "../types";

interface PatientTableProps {
  tableData: PatientData[];
  isLoading?: boolean;
  onEdit: (patient: PatientData) => void;
}

type SortKey = "fullName" | "phoneNumber" | "gender" | "createdAt";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 15;

const formatDate = (date: Date | string | null): string => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Pinned column styles - only on lg+ screens
const pinnedFirstCol = "lg:sticky lg:left-0 lg:z-10 lg:bg-white";
const pinnedSecondCol = "lg:sticky lg:left-[200px] lg:z-10 lg:bg-white";
const pinnedFirstColHeader = "lg:sticky lg:left-0 lg:z-20 lg:bg-fnh-navy";
const pinnedSecondColHeader =
  "lg:sticky lg:left-[200px] lg:z-20 lg:bg-fnh-navy";

const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-fnh-navy text-white">
            <th className="px-4 py-4 text-left text-xs font-semibold min-w-[200px]">
              Patient
            </th>
            <th className="px-4 py-4 text-left text-xs font-semibold hidden sm:table-cell min-w-[120px]">
              Phone
            </th>
            <th className="px-4 py-4 text-left text-xs font-semibold hidden md:table-cell">
              Gender
            </th>
            <th className="px-4 py-4 text-left text-xs font-semibold hidden lg:table-cell">
              Address
            </th>
            <th className="px-4 py-4 text-left text-xs font-semibold hidden lg:table-cell">
              DOB
            </th>
            <th className="px-4 py-4 text-center text-xs font-semibold w-24">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 15 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 animate-pulse">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 hidden sm:table-cell">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-4 hidden md:table-cell">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-4">
                <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SortIcon: React.FC<{ sortOrder: SortOrder | null }> = ({ sortOrder }) => {
  if (!sortOrder) {
    return <ChevronsUpDown className="w-3.5 h-3.5 text-white/50" />;
  }
  return sortOrder === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-fnh-yellow" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-fnh-yellow" />
  );
};

export const PatientTable: React.FC<PatientTableProps> = ({
  tableData,
  isLoading = false,
  onEdit,
}) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return tableData;

    return [...tableData].sort((a, b) => {
      let aVal: string | number | Date | null = null;
      let bVal: string | number | Date | null = null;

      switch (sortKey) {
        case "fullName":
          aVal = a.fullName.toLowerCase();
          bVal = b.fullName.toLowerCase();
          break;
        case "phoneNumber":
          aVal = a.phoneNumber || "";
          bVal = b.phoneNumber || "";
          break;
        case "gender":
          aVal = a.gender.toLowerCase();
          bVal = b.gender.toLowerCase();
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [tableData, sortKey, sortOrder]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginationMeta,
    goToPage,
    goToPrev,
    goToNext,
  } = usePagination({
    totalResults: sortedData.length,
    pageSize: PAGE_SIZE,
    initialPage: 1,
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (tableData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-fnh-navy-dark mb-2">
          No Patients Found
        </h3>
        <p className="text-gray-500 text-sm">
          Try adjusting your search criteria or check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-fnh-navy text-white">
                {/* Patient - Pinned on lg+ */}
                <th
                  className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-fnh-navy-dark transition-colors min-w-[200px] ${pinnedFirstColHeader}`}
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-2">
                    Patient
                    <SortIcon
                      sortOrder={sortKey === "fullName" ? sortOrder : null}
                    />
                  </div>
                </th>
                {/* Phone - Pinned on lg+ */}
                <th
                  className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide hidden sm:table-cell cursor-pointer hover:bg-fnh-navy-dark transition-colors min-w-[120px] ${pinnedSecondColHeader}`}
                  onClick={() => handleSort("phoneNumber")}
                >
                  <div className="flex items-center gap-2">
                    Phone
                    <SortIcon
                      sortOrder={sortKey === "phoneNumber" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell cursor-pointer hover:bg-fnh-navy-dark transition-colors"
                  onClick={() => handleSort("gender")}
                >
                  <div className="flex items-center gap-2">
                    Gender
                    <SortIcon
                      sortOrder={sortKey === "gender" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  Address
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  DOB
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Patient Info - Pinned on lg+ */}
                  <td
                    className={`px-4 py-4 ${pinnedFirstCol} group-hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-fnh-navy to-fnh-navy-dark flex items-center justify-center shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {patient.firstName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-fnh-navy-dark truncate group-hover:text-fnh-blue transition-colors">
                          {patient.fullName}
                        </p>
                        {patient.guardianName && (
                          <p className="text-xs text-gray-500 truncate">
                            Guardian: {patient.guardianName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone - Pinned on lg+ */}
                  <td
                    className={`px-4 py-4 hidden sm:table-cell ${pinnedSecondCol} group-hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {patient.phoneNumber || "—"}
                    </div>
                  </td>

                  {/* Gender */}
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        patient.gender === "Female"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {patient.gender}
                    </span>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600 max-w-xs">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{patient.address || "—"}</span>
                    </div>
                  </td>

                  {/* DOB */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(patient.dateOfBirth)}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => onEdit(patient)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fnh-blue/10 text-fnh-blue hover:bg-fnh-blue hover:text-white transition-all duration-200 text-sm font-medium cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - moved outside table */}
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={sortedData.length}
            startIndex={paginationMeta.startIndex}
            endIndex={paginationMeta.endIndex}
            onPageChange={goToPage}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </div>
      )}
    </>
  );
};

export default PatientTable;
