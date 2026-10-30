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

const actionButtonClassName =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50";

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

  const renderActions = (visit: DoctorChamberVisitRecord) => (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onView(visit)} className={actionButtonClassName} title="View chamber patient" aria-label="View chamber patient"><Eye size={16} /></button>
      <button type="button" onClick={() => onEdit(visit)} className={actionButtonClassName} title="Edit chamber patient" aria-label="Edit chamber patient"><Edit2 size={16} /></button>
      <button type="button" onClick={() => void print("form", visit)} className={actionButtonClassName} title="Print chamber form" aria-label="Print chamber form"><FileText size={16} /></button>
      <button type="button" onClick={() => void print("receipt", visit)} className={actionButtonClassName} title="Print receipt" aria-label="Print receipt"><Printer size={16} /></button>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="hidden w-full overflow-x-auto overflow-y-auto md:block" style={{ maxHeight: "600px" }} {...tableContainerProps}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="sticky top-0 z-20 bg-fnh-navy"><tr>{headings.map((heading) => <th key={heading} className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white sm:px-3 md:px-4">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">{Array.from({ length: 15 }).map((_, index) => <tr key={index}>{headings.map((heading) => <td key={heading} className="px-2 py-4 sm:px-3 md:px-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td>)}</tr>)}</tbody>
          </table>
        </div>
      </>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 sm:py-16">
        <FileText className="mb-3 h-12 w-12 text-slate-300 sm:mb-4 sm:h-16 sm:w-16" />
        <p className="text-base font-medium sm:text-lg">No chamber patients found</p>
        <p className="mt-1 text-xs sm:text-sm">Click &quot;New Patient&quot; to add a chamber record.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-100 md:hidden">
        {visits.map((visit, index) => (
          <div key={visit.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => onView(visit)} className="min-w-0 cursor-pointer text-left">
                <span className="block text-sm font-semibold text-slate-900">{visit.patientFullName}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{visit.patientGender || "Gender not recorded"}</span>
              </button>
              <button type="button" onClick={() => onView(visit)} className="shrink-0 cursor-pointer font-mono text-xs font-semibold text-fnh-navy tabular-nums hover:text-fnh-blue hover:underline">{visit.visitNumber}</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="font-semibold text-slate-500">Phone</dt>
                <dd className="mt-0.5 text-slate-700">{visit.patientPhoneNumber || "N/A"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Consulting Doctor</dt>
                <dd className="mt-0.5 text-slate-700">{visit.doctorName}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold text-slate-500">Visit Date</dt>
                <dd className="mt-0.5 text-slate-700">{formatVisitDate(visit.visitDate)}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 tabular-nums">#{startIndex + index + 1}</span>
              {renderActions(visit)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-full overflow-x-auto overflow-y-auto md:block" style={{ maxHeight: "600px" }} {...tableContainerProps}>
        <table className="divide-y divide-slate-200 md:min-w-[900px]">
          <thead className="sticky top-0 z-20 bg-fnh-navy">
            <tr>{headings.map((heading) => <th key={heading} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white sm:px-3 sm:py-3 md:px-4 md:py-4">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {visits.map((visit, index) => (
              <tr key={visit.id} className="group transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-2 py-2 text-xs font-semibold text-fnh-navy tabular-nums sm:px-3 sm:py-3 md:px-4 md:py-4">{startIndex + index + 1}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs sm:px-3 sm:py-3 md:px-4 md:py-4"><button type="button" onClick={() => onView(visit)} className="cursor-pointer font-mono text-fnh-navy tabular-nums hover:text-fnh-blue hover:underline">{visit.visitNumber}</button></td>
                <td className="px-2 py-2 text-xs sm:px-3 sm:py-3 md:px-4 md:py-4"><button type="button" onClick={() => onView(visit)} className="cursor-pointer text-left"><span className="block font-medium text-slate-900 transition-colors hover:text-fnh-blue">{visit.patientFullName}</span><span className="mt-0.5 block text-2xs leading-none text-slate-500">{visit.patientGender || "Gender not recorded"}</span></button></td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{visit.patientPhoneNumber || "N/A"}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{visit.doctorName}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-700 sm:px-3 sm:py-3 md:px-4 md:py-4">{formatVisitDate(visit.visitDate)}</td>
                <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">{renderActions(visit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
