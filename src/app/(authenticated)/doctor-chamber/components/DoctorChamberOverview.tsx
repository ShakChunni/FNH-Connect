"use client";

import { FileText, Printer, Stethoscope, X } from "lucide-react";
import { ModalShell } from "@/components/ui";
import type { DoctorChamberVisitRecord } from "../types";
import {
  generateDoctorChamberForm,
  generateDoctorChamberReceipt,
} from "../utils/generateReceipt";

interface DoctorChamberOverviewProps {
  visit: DoctorChamberVisitRecord | null;
  isOpen: boolean;
  onClose: () => void;
  printedBy: string;
}

const money = (value: number) =>
  `BDT ${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DoctorChamberOverview({
  visit,
  isOpen,
  onClose,
  printedBy,
}: DoctorChamberOverviewProps) {
  if (!visit) return null;

  const charges = [
    { name: visit.ultrasoundName, amount: visit.ultrasoundCharge, fixed: true },
    { name: "Visiting charge", amount: visit.visitingCharge, fixed: false },
    ...visit.fees.map((fee) => ({ name: fee.feeName, amount: fee.amount, fixed: false })),
  ];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} className="w-full max-w-3xl max-h-[90vh] rounded-3xl">
      <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white"><Stethoscope className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-bold text-slate-900">Chamber visit overview</h2><p className="text-xs text-slate-500">{visit.visitNumber} · {new Date(visit.visitDate).toLocaleString("en-BD")}</p></div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200" title="Close overview"><X className="h-4 w-4" /></button>
      </div>

      <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Patient</p><p className="mt-1 text-lg font-bold text-slate-900">{visit.patientFullName}</p><p className="mt-1 text-sm text-slate-600">{visit.patientGender || "Gender not recorded"} · {visit.patientPhoneNumber || "No phone"}</p><p className="mt-2 text-sm text-slate-600">{visit.patientAddress || "No address recorded"}</p></div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Consulting doctor</p><p className="mt-1 text-lg font-bold text-indigo-950">{visit.doctorName}</p><p className="mt-1 text-sm text-indigo-800">Private chamber · {visit.departmentName}</p></div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1fr_auto] bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white"><span>Charge</span><span>Amount</span></div>
          {charges.map((charge, index) => <div key={`${charge.name}-${index}`} className="grid grid-cols-[1fr_auto] border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"><span className="text-slate-700">{charge.name}{charge.fixed && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">FIXED</span>}</span><span className="font-semibold text-slate-900">{money(charge.amount)}</span></div>)}
          <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-4 text-base font-bold text-slate-900"><span>Total</span><span>{money(visit.totalAmount)}</span></div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><span className="font-bold">Notes:</span> {visit.notes || "No remarks recorded."}</div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <button type="button" onClick={() => void generateDoctorChamberForm(visit, printedBy)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200"><FileText className="h-4 w-4" /> Print form</button>
        <button type="button" onClick={() => void generateDoctorChamberReceipt(visit, printedBy)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"><Printer className="h-4 w-4" /> Print receipt</button>
      </div>
    </ModalShell>
  );
}

