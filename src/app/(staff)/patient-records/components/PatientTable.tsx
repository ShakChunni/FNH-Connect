"use client";

import React, { useState, useMemo } from "react";
import { Phone, MapPin, Calendar, Edit3, Users, Search } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { Pagination } from "@/components/pagination/Pagination";
import type { PatientData } from "../types";
import PatientOverview from "./PatientOverview/PatientOverview";

interface PatientTableProps {
  tableData: PatientData[];
  isLoading?: boolean;
  onEdit: (patient: PatientData) => void;
}

type SortKey = "fullName" | "phoneNumber" | "gender" | "createdAt" | "id";
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

const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
const THIRD_COL_WIDTH = "w-[250px] min-w-[250px]";

const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-fnh-navy text-white">
            <th className={`px-4 py-4 ${FIRST_COL_WIDTH}`}>#</th>
            <th
              className={`px-4 py-4 text-left text-xs font-semibold ${SECOND_COL_WIDTH}`}
            >
              ID
            </th>
            <th
              className={`px-4 py-4 text-left text-xs font-semibold ${THIRD_COL_WIDTH}`}
            >
              Patient
            </th>
            <th className="px-4 py-4 text-left text-xs font-semibold hidden sm:table-cell min-w-[150px]">
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
                <div className="h-4 w-4 bg-gray-200 rounded mx-auto" />
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-12 bg-gray-200 rounded" />
              </td>
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

export const PatientTable: React.FC<PatientTableProps> = ({
  tableData,
  isLoading = false,
  onEdit,
}) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(
    null
  );
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  // Horizontal drag-to-scroll for better UX
  const dragScroll = useHorizontalDragScroll<HTMLDivElement>();

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
        case "id":
          aVal = a.id;
          bVal = b.id;
          break;
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

  const handlePatientClick = (patient: PatientData) => {
    setSelectedPatient(patient);
    setIsOverviewOpen(true);
  };

  const getHeaderClasses = (index: number, sortableKey?: SortKey) => {
    const baseClasses = `
      px-4 py-4 text-left text-[10px] sm:text-xs
      font-semibold text-white uppercase tracking-wider
      bg-fnh-navy transition-colors z-20
      ${sortableKey ? "cursor-pointer hover:bg-fnh-navy-dark" : ""}
    `;

    if (index === 0)
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:left-0 lg:z-30 lg:bg-[#111827]`;
    if (index === 1)
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:left-[60px] lg:z-30 lg:bg-[#111827]`;
    if (index === 2)
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:left-[160px] lg:z-30 lg:bg-[#111827]`;

    return baseClasses;
  };

  const getCellClasses = (index: number) => {
    const baseClasses = "px-4 py-4 transition-colors group-hover:bg-slate-50";
    if (index === 0)
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:left-0 lg:z-10 bg-white font-mono font-bold text-gray-400 text-xs text-center`;
    if (index === 1)
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:left-[60px] lg:z-10 bg-white font-mono font-bold text-fnh-blue text-xs`;
    if (index === 2)
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:left-[160px] lg:z-10 bg-white`;
    return baseClasses;
  };

  if (isLoading) return <TableSkeleton />;

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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div
          className="overflow-x-auto overflow-y-auto w-full"
          style={{ maxHeight: "600px" }}
          ref={dragScroll.ref}
          onMouseDown={dragScroll.onMouseDown}
          onMouseUp={dragScroll.onMouseUp}
          onMouseMove={dragScroll.onMouseMove}
          onMouseLeave={dragScroll.onMouseLeave}
        >
          <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
            <thead className="sticky top-0 z-40">
              <tr>
                <th className={getHeaderClasses(0)}>#</th>
                <th
                  className={getHeaderClasses(1, "id")}
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center gap-2">
                    ID
                    {sortKey === "id" && (
                      <span className="text-fnh-yellow font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={getHeaderClasses(2, "fullName")}
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-2">
                    Patient
                    {sortKey === "fullName" && (
                      <span className="text-fnh-yellow font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${getHeaderClasses(
                    3,
                    "phoneNumber"
                  )} hidden sm:table-cell min-w-[150px]`}
                  onClick={() => handleSort("phoneNumber")}
                >
                  <div className="flex items-center gap-2">
                    Phone
                    {sortKey === "phoneNumber" && (
                      <span className="text-fnh-yellow font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${getHeaderClasses(
                    4,
                    "gender"
                  )} hidden md:table-cell min-w-[120px]`}
                  onClick={() => handleSort("gender")}
                >
                  <div className="flex items-center gap-2">
                    Gender
                    {sortKey === "gender" && (
                      <span className="text-fnh-yellow font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`${getHeaderClasses(
                    5
                  )} hidden lg:table-cell min-w-[200px]`}
                >
                  Address
                </th>
                <th
                  className={`${getHeaderClasses(
                    6
                  )} hidden lg:table-cell min-w-[150px]`}
                >
                  DOB
                </th>
                <th className={`${getHeaderClasses(7)} text-center z-10 w-24`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedData.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="group hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handlePatientClick(patient)}
                >
                  <td className={getCellClasses(0)}>
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className={getCellClasses(1)}>
                    #{patient.id.toString().padStart(4, "0")}
                  </td>
                  <td className={getCellClasses(2)}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          patient.gender === "Female"
                            ? "bg-pink-50 text-pink-500"
                            : "bg-blue-50 text-blue-500"
                        }`}
                      >
                        <span className="font-bold text-xs">
                          {patient.firstName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate group-hover:text-fnh-blue transition-colors">
                          {patient.fullName}
                        </p>
                        {patient.guardianName && (
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            G: {patient.guardianName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${getCellClasses(3)} hidden sm:table-cell`}>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-300" />
                      {patient.phoneNumber || "—"}
                    </div>
                  </td>
                  <td className={`${getCellClasses(4)} hidden md:table-cell`}>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        patient.gender === "Female"
                          ? "bg-pink-50 text-pink-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {patient.gender}
                    </span>
                  </td>
                  <td className={`${getCellClasses(5)} hidden lg:table-cell`}>
                    <div className="flex items-center gap-2 text-xs text-slate-500 max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="truncate">{patient.address || "—"}</span>
                    </div>
                  </td>
                  <td className={`${getCellClasses(6)} hidden lg:table-cell`}>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {formatDate(patient.dateOfBirth)}
                    </div>
                  </td>
                  <td className={`${getCellClasses(7)} text-center`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(patient);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-fnh-blue hover:text-white transition-all duration-200 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
                    >
                      <Edit3 className="w-3" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <PatientOverview
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        patient={selectedPatient}
        onEdit={onEdit}
      />
    </>
  );
};

export default PatientTable;
