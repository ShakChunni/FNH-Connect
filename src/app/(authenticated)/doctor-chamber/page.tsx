"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, FileText, Plus, Search, Stethoscope } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { Pagination } from "@/components/pagination/Pagination";
import { useAuth } from "@/app/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import { buildBDTQueryDateRange } from "@/lib/timezone";
import { DOCTOR_CHAMBER_CONFIG } from "@/lib/doctorChamber";
import DoctorChamberForm from "./components/DoctorChamberForm";
import DoctorChamberOverview from "./components/DoctorChamberOverview";
import DoctorChamberTable from "./components/DoctorChamberTable";
import {
  fetchDoctorChamberReport,
  useDoctorChamberConfig,
  useDoctorChamberVisits,
} from "./hooks/useDoctorChamber";
import { generateDoctorChamberReport } from "./utils/generateReport";
import type { DoctorChamberVisitRecord } from "./types";

type DatePreset = "all" | "today" | "last7days" | "last30days" | "thisMonth" | "custom";

function toLocalDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toInputDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function getToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getPresetRange(preset: Exclude<DatePreset, "all" | "custom">) {
  const end = getToday();
  const start = new Date(end);
  if (preset === "last7days") start.setDate(start.getDate() - 6);
  if (preset === "last30days") start.setDate(start.getDate() - 29);
  if (preset === "thisMonth") start.setDate(1);
  return { start: toInputDate(start), end: toInputDate(end) };
}

function formatPeriod(start: string, end: string): string {
  if (!start || !end) return "All time";
  const startDate = toLocalDate(start);
  const endDate = toLocalDate(end);
  if (!startDate || !endDate) return "Selected period";
  const formatter = new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const first = formatter.format(startDate);
  const last = formatter.format(endDate);
  return first === last ? first : `${first} - ${last}`;
}

const money = (value: number) =>
  `BDT ${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DoctorChamberPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [preset, setPreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<DoctorChamberVisitRecord | null>(null);
  const [overviewVisit, setOverviewVisit] = useState<DoctorChamberVisitRecord | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { data: chamberConfig } = useDoctorChamberConfig();

  const queryDateRange = useMemo(
    () =>
      buildBDTQueryDateRange(toLocalDate(startDate), toLocalDate(endDate)),
    [startDate, endDate],
  );
  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      ...queryDateRange,
      page,
      limit: 15,
    }),
    [debouncedSearch, page, queryDateRange],
  );
  const { data, isLoading, isFetching, error } = useDoctorChamberVisits(filters);
  const visits = data?.data ?? [];
  const totalRecords = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const summary = data?.summary ?? {
    visits: 0,
    totalUltrasoundCharges: 0,
    totalVisitingCharges: 0,
    totalAmount: 0,
  };
  const doctorName = chamberConfig?.doctorName ?? DOCTOR_CHAMBER_CONFIG.doctorDisplayName;
  const ultrasoundName = chamberConfig?.ultrasoundName ?? DOCTOR_CHAMBER_CONFIG.ultrasoundName;
  const ultrasoundCharge = chamberConfig?.ultrasoundCharge ?? DOCTOR_CHAMBER_CONFIG.ultrasoundCharge;

  const openNewVisit = () => {
    setEditingVisit(null);
    setIsFormOpen(true);
  };

  const openEditVisit = (visit: DoctorChamberVisitRecord) => {
    setEditingVisit(visit);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setIsFormOpen(false);
    setEditingVisit(null);
  };

  const selectPreset = (nextPreset: DatePreset) => {
    setPreset(nextPreset);
    setPage(1);
    if (nextPreset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }
    if (nextPreset === "custom") return;
    const range = getPresetRange(nextPreset);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const generateReport = async (type: "summary" | "detailed") => {
    setIsGeneratingReport(true);
    try {
      const report = await fetchDoctorChamberReport({
        search: debouncedSearch.trim() || undefined,
        ...queryDateRange,
      });
      if (report.data.length === 0) {
        showNotification("No chamber visits match the selected filters.", "info");
        return;
      }
      await generateDoctorChamberReport(
        report.data,
        type,
        formatPeriod(startDate, endDate),
      );
      showNotification(
        `${type === "summary" ? "Summary" : "Detailed"} chamber report generated.`,
        "success",
      );
    } catch (reportError) {
      console.error("Doctor chamber report generation failed:", reportError);
      showNotification("Unable to generate chamber report.", "error");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-fnh-porcelain pb-6">
      <div className="mx-auto w-full max-w-[1600px] px-3 pt-16 sm:px-4 sm:pt-12 lg:px-6 lg:pt-3">
        <div className="space-y-5">
          <PageHeader
            title="Dr Sufia Khatun Chamber"
            subtitle={`Private chamber visits · Fixed ${ultrasoundName} charge: ${money(ultrasoundCharge)}`}
            actions={<Button onClick={openNewVisit} className="h-11 rounded-xl bg-indigo-600 px-4 text-white shadow-lg hover:bg-indigo-700"><Plus className="h-4 w-4" /> New chamber visit</Button>}
          />

          <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-slate-50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-600 p-2 text-white"><Stethoscope className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Consulting doctor</p><h2 className="text-lg font-bold text-indigo-950">{doctorName}</h2><p className="text-sm text-slate-600">Only this doctor’s private chamber records appear here.</p></div></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[10px] font-bold uppercase text-slate-400">Visits</p><p className="font-bold text-slate-900">{summary.visits}</p></div><div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[10px] font-bold uppercase text-slate-400">Ultra Sono</p><p className="font-bold text-slate-900">{money(summary.totalUltrasoundCharges)}</p></div><div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[10px] font-bold uppercase text-slate-400">Visiting</p><p className="font-bold text-slate-900">{money(summary.totalVisitingCharges)}</p></div><div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[10px] font-bold uppercase text-slate-400">Page total</p><p className="font-bold text-emerald-700">{money(summary.totalAmount)}</p></div></div>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <label className="relative w-full xl:max-w-md"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Search patient or visit</span><Search className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Patient name, phone, email, or visit number" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:max-w-xl"><label className="sm:col-span-1"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Date preset</span><select value={preset} onChange={(event) => selectPreset(event.target.value as DatePreset)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"><option value="all">All time</option><option value="today">Today</option><option value="last7days">Last 7 days</option><option value="last30days">Last 30 days</option><option value="thisMonth">This month</option><option value="custom">Custom range</option></select></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">From</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPreset("custom"); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-2 text-sm outline-none focus:border-indigo-500" /></span></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">To</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPreset("custom"); setPage(1); }} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-2 text-sm outline-none focus:border-indigo-500" /></span></label></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void generateReport("summary")} disabled={isGeneratingReport || isFetching} className="h-11 rounded-xl"><FileText className="h-4 w-4" /> Summary report</Button><Button variant="outline" onClick={() => void generateReport("detailed")} disabled={isGeneratingReport || isFetching} className="h-11 rounded-xl"><FileText className="h-4 w-4" /> Detailed report</Button></div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Report period: {formatPeriod(startDate, endDate)}</span>{isFetching && <span className="font-semibold text-indigo-600">Refreshing…</span>}</div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Unable to load chamber visits. Please refresh and try again.</div>}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><DoctorChamberTable visits={visits} isLoading={isLoading} startIndex={(page - 1) * 15} printedBy={user?.fullName || "Staff"} onEdit={openEditVisit} onView={setOverviewVisit} /></div>

          {totalPages > 1 && <div className="rounded-2xl border border-slate-100 bg-white shadow-sm"><Pagination currentPage={page} totalPages={totalPages} totalResults={totalRecords} startIndex={totalRecords > 0 ? (page - 1) * 15 + 1 : 0} endIndex={Math.min(page * 15, totalRecords)} onPageChange={setPage} /></div>}
        </div>
      </div>

      <DoctorChamberForm isOpen={isFormOpen} editingVisit={editingVisit} onClose={() => { if (!isGeneratingReport) { setIsFormOpen(false); setEditingVisit(null); } }} onSaved={handleSaved} />
      <DoctorChamberOverview visit={overviewVisit} isOpen={Boolean(overviewVisit)} onClose={() => setOverviewVisit(null)} printedBy={user?.fullName || "Staff"} />
    </div>
  );
}
