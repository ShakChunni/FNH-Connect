"use client";

import { Edit2, Eye, FileText, Printer } from "lucide-react";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { useNotification } from "@/hooks/useNotification";
import type { DoctorChamberVisitRecord } from "../types";
import {
  generateDoctorChamberForm,
  generateDoctorChamberReceipt,
} from "../utils/generateReceipt";

interface DoctorChamberTableProps {
  visits: DoctorChamberVisitRecord[];
  isLoading: boolean;
  startIndex: number;
  printedBy: string;
  onEdit: (visit: DoctorChamberVisitRecord) => void;
  onView: (visit: DoctorChamberVisitRecord) => void;
}

const headings = [
  "#",
  "Visit No.",
  "Patient",
  "Phone",
  "Consulting Doctor",
  "Visit Date",
  "Actions",
];

function formatVisitDate(value: string): string {
  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DoctorChamberTable({
  visits,
  isLoading,
  startIndex,
  printedBy,
  onEdit,
  onView,
}: DoctorChamberTableProps) {
  const { showNotification } = useNotification();
  const dragScroll = useHorizontalDragScroll<HTMLDivElement>();

  const print = async (kind: "form" | "receipt", visit: DoctorChamberVisitRecord) => {
    try {
      if (kind === "form") await generateDoctorChamberForm(visit, printedBy);
      else await generateDoctorChamberReceipt(visit, printedBy);
      showNotification(kind === "form" ? "Chamber form generated." : "Receipt generated.", "success");
    } catch (error) {
      console.error("Doctor chamber print failed:", error);
      showNotification("Unable to generate the document.", "error");
    }
  };

  const tableContainerProps = {
    ref: dragScroll.ref,
    onMouseDown: dragScroll.onMouseDown,
    onMouseUp: dragScroll.onMouseUp,
    onMouseMove: dragScroll.onMouseMove,
    onMouseLeave: dragScroll.onMouseLeave,
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: "600px" }} {...tableContainerProps}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-20 bg-fnh-navy"><tr>{headings.map((heading) => <th key={heading} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white sm:px-3 md:px-4">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100 bg-white">{Array.from({ length: 15 }).map((_, index) => <tr key={index}>{headings.map((heading) => <td key={heading} className="px-2 py-4 sm:px-3 md:px-4"><div className="h-4 animate-pulse rounded bg-gray-100" /></td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 sm:py-16">
        <FileText className="mb-3 h-12 w-12 text-gray-300 sm:mb-4 sm:h-16 sm:w-16" />
        <p className="text-base font-medium sm:text-lg">No chamber patients found</p>
        <p className="mt-1 text-xs sm:text-sm">Click &quot;New Patient&quot; to add a chamber record.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: "600px" }} {...tableContainerProps}>
      <table className="min-w-[900px] divide-y divide-gray-200">
        <thead className="sticky top-0 z-20 bg-fnh-navy">
          <tr>{headings.map((heading) => <th key={heading} className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white sm:px-3 sm:py-3 md:px-4 md:py-4">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {visits.map((visit, index) => (
            <tr key={visit.id} className="group transition-colors hover:bg-gray-50">
              <td className="whitespace-nowrap px-2 py-2 text-[11px] font-semibold text-fnh-navy sm:px-3 sm:py-3 md:px-4 md:py-4">{startIndex + index + 1}</td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] sm:px-3 sm:py-3 md:px-4 md:py-4"><button type="button" onClick={() => onView(visit)} className="cursor-pointer font-mono text-fnh-navy hover:text-fnh-blue hover:underline">{visit.visitNumber}</button></td>
              <td className="px-2 py-2 text-[11px] sm:px-3 sm:py-3 md:px-4 md:py-4"><button type="button" onClick={() => onView(visit)} className="cursor-pointer text-left"><span className="block font-medium text-gray-900 transition-colors hover:text-fnh-blue">{visit.patientFullName}</span><span className="mt-0.5 block text-[10px] leading-none text-gray-500">{visit.patientGender || "Gender not recorded"}</span></button></td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-gray-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{visit.patientPhoneNumber || "N/A"}</td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-gray-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{visit.doctorName}</td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-gray-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{formatVisitDate(visit.visitDate)}</td>
              <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="flex items-center gap-1.5"><button type="button" onClick={() => onView(visit)} className="cursor-pointer rounded-lg bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-all hover:bg-gray-200 hover:shadow-md" title="View chamber patient"><Eye size={16} /></button><button type="button" onClick={() => onEdit(visit)} className="cursor-pointer rounded-lg bg-fnh-navy p-1.5 text-white shadow-sm transition-all hover:bg-fnh-navy-dark hover:shadow-md" title="Edit chamber patient"><Edit2 size={16} /></button><button type="button" onClick={() => void print("form", visit)} className="cursor-pointer rounded-lg bg-purple-100 p-1.5 text-purple-700 shadow-sm transition-all hover:bg-purple-200 hover:shadow-md" title="Print chamber form"><FileText size={16} /></button><button type="button" onClick={() => void print("receipt", visit)} className="cursor-pointer rounded-lg bg-green-100 p-1.5 text-green-700 shadow-sm transition-all hover:bg-green-200 hover:shadow-md" title="Print receipt"><Printer size={16} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
