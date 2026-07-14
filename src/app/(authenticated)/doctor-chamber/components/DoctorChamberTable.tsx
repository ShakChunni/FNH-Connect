"use client";

import { Edit2, FileText, Printer } from "lucide-react";
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

const money = (value: number) =>
  `BDT ${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DoctorChamberTable({
  visits,
  isLoading,
  startIndex,
  printedBy,
  onEdit,
  onView,
}: DoctorChamberTableProps) {
  const { showNotification } = useNotification();

  if (isLoading) {
    return <div className="space-y-3 p-5">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>;
  }

  if (visits.length === 0) {
    return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><FileText className="h-14 w-14 text-slate-300" /><h3 className="mt-4 text-lg font-bold text-slate-700">No chamber visits found</h3><p className="mt-1 text-sm text-slate-500">Create a new chamber visit or clear the active filters.</p></div>;
  }

  const print = async (kind: "form" | "receipt", visit: DoctorChamberVisitRecord) => {
    if (kind === "form") {
      await generateDoctorChamberForm(visit, printedBy);
      showNotification("Chamber form generated.", "success");
    } else {
      await generateDoctorChamberReceipt(visit, printedBy);
      showNotification("Chamber receipt generated.", "success");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full divide-y divide-slate-200">
        <thead className="bg-fnh-navy"><tr>{["#", "Visit no.", "Patient", "Phone", "Consulting doctor", "Total", "Visit date", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {visits.map((visit, index) => <tr key={visit.id} className="group hover:bg-slate-50">
            <td className="px-3 py-3 text-sm font-semibold text-slate-500">{startIndex + index + 1}</td>
            <td className="px-3 py-3"><button type="button" onClick={() => onView(visit)} className="font-mono text-sm font-semibold text-indigo-700 hover:underline">{visit.visitNumber}</button></td>
            <td className="px-3 py-3"><button type="button" onClick={() => onView(visit)} className="text-left"><span className="block text-sm font-semibold text-slate-800 hover:text-indigo-700">{visit.patientFullName}</span><span className="block text-xs text-slate-500">{visit.patientGender || "Gender not recorded"}</span></button></td>
            <td className="px-3 py-3 text-sm text-slate-600">{visit.patientPhoneNumber || "N/A"}</td>
            <td className="px-3 py-3 text-sm text-slate-700">{visit.doctorName}</td>
            <td className="px-3 py-3 text-sm font-bold text-emerald-700">{money(visit.totalAmount)}</td>
            <td className="px-3 py-3 text-sm text-slate-600">{new Date(visit.visitDate).toLocaleString("en-BD")}</td>
            <td className="px-3 py-3"><div className="flex items-center gap-1.5"><button type="button" onClick={() => onView(visit)} className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" title="View chamber visit"><FileText className="h-4 w-4" /></button><button type="button" onClick={() => onEdit(visit)} className="rounded-lg bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200" title="Edit chamber visit"><Edit2 className="h-4 w-4" /></button><button type="button" onClick={() => void print("form", visit)} className="rounded-lg bg-purple-100 p-2 text-purple-700 hover:bg-purple-200" title="Print chamber form"><FileText className="h-4 w-4" /></button><button type="button" onClick={() => void print("receipt", visit)} className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200" title="Print receipt"><Printer className="h-4 w-4" /></button></div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

