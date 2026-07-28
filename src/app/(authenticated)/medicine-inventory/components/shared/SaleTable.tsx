/**
 * Sale Table Component
 * Displays all medicine sales with patient, medicine, and FIFO source info
 */

"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Layers3, ShoppingCart } from "lucide-react";
import { Pagination } from "@/components/pagination/Pagination";
import { useFetchSales } from "../../hooks";
import { useSaleFilterStore } from "../../stores";
import type { MedicineSale } from "../../types";
import {
  getMedicineDisplayName,
  getMedicineGenericSubtitle,
} from "../../utils/medicineDisplay";

interface PatientSaleGroup {
  key: string;
  patientId: number | null;
  patientName: string;
  phoneNumber: string | null;
  sales: MedicineSale[];
  totalQuantity: number;
  totalAmount: number;
  latestSaleDate: string;
}

const getPatientGroupKey = (sale: MedicineSale) => {
  return sale.patient?.id ? `patient-${sale.patient.id}` : `unknown-${sale.id}`;
};

const getFiniteNumber = (value: number) => {
  return Number.isFinite(value) ? value : 0;
};

const getSaleQuantity = (sale: MedicineSale) => {
  return getFiniteNumber(sale.quantity);
};

const getSaleUnitPrice = (sale: MedicineSale) => {
  return getFiniteNumber(sale.unitPrice);
};

const getSaleTotalAmount = (sale: MedicineSale) => {
  if (Number.isFinite(sale.totalAmount)) {
    return sale.totalAmount;
  }

  return getSaleQuantity(sale) * getSaleUnitPrice(sale);
};

const SaleTable: React.FC = () => {
  const { filters, setFilter } = useSaleFilterStore();
  const { data, isLoading, isError, error } = useFetchSales(filters);
  const [expandedPatientKeys, setExpandedPatientKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const sales = useMemo(() => data?.data ?? [], [data?.data]);
  const totalPatients = data?.total || 0;
  const totalSaleLines = data?.totalSaleLines || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || filters.page || 1;
  const limit = data?.limit || filters.limit || 10;
  const startIndex =
    totalPatients === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, totalPatients);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(getFiniteNumber(amount));
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
    return new Intl.NumberFormat("en-BD").format(getFiniteNumber(num));
  };

  const patientGroups = useMemo<PatientSaleGroup[]>(() => {
    const groups = new Map<string, PatientSaleGroup>();

    sales.forEach((sale) => {
      const key = getPatientGroupKey(sale);
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.sales.push(sale);
        existingGroup.totalQuantity += getSaleQuantity(sale);
        existingGroup.totalAmount += getSaleTotalAmount(sale);

        if (new Date(sale.saleDate) > new Date(existingGroup.latestSaleDate)) {
          existingGroup.latestSaleDate = sale.saleDate;
        }

        return;
      }

      groups.set(key, {
        key,
        patientId: sale.patient?.id ?? null,
        patientName: sale.patient?.fullName || "Unknown Patient",
        phoneNumber: sale.patient?.phoneNumber ?? null,
        sales: [sale],
        totalQuantity: getSaleQuantity(sale),
        totalAmount: getSaleTotalAmount(sale),
        latestSaleDate: sale.saleDate,
      });
    });

    return Array.from(groups.values());
  }, [sales]);

  const togglePatientGroup = (groupKey: string) => {
    setExpandedPatientKeys((current) => {
      const next = new Set(current);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  };

  const isPatientGroupExpanded = (groupKey: string) => {
    return expandedPatientKeys.has(groupKey);
  };

  const changePage = (page: number) => {
    setExpandedPatientKeys(new Set());
    setFilter("page", page);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-6 border-b border-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center px-6 py-3.5 gap-4 border-b border-gray-50"
          >
            <div className="space-y-1">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-blue-50 rounded-lg animate-pulse hidden md:block" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-4 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-blue-50 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
        <p className="text-sm text-red-600 font-medium">
          {error instanceof Error ? error.message : "Failed to load sales"}
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          No Sales Found
        </h3>
        <p className="text-sm text-gray-500">
          {filters.search
            ? "No sales match your search criteria."
            : 'No sales recorded yet. Click "Record Sale" to get started.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {formatNumber(totalSaleLines)} sale line
            {totalSaleLines !== 1 ? "s" : ""}
          </p>
          <p className="text-xs font-semibold text-gray-400">
            {formatNumber(patientGroups.length)} shown ·{" "}
            {formatNumber(totalPatients)} patient
            {totalPatients !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Patient
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Lines
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Medicine
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Group
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Company
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
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Source
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patientGroups.map((group) => (
                <React.Fragment key={group.key}>
                  <tr className="bg-gray-50/70 hover:bg-gray-100/70 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => togglePatientGroup(group.key)}
                        className="group inline-flex items-center gap-3 text-left"
                        aria-expanded={isPatientGroupExpanded(group.key)}
                        aria-label={`${isPatientGroupExpanded(group.key) ? "Collapse" : "Expand"} sales for ${group.patientName}`}
                      >
                        <motion.span
                          animate={{
                            rotate: isPatientGroupExpanded(group.key) ? 90 : 0,
                          }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors group-hover:border-blue-200 group-hover:text-blue-700"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.span>
                        <span>
                          <span className="block text-sm font-black text-gray-900">
                            {group.patientName}
                          </span>
                          {group.phoneNumber ? (
                            <span className="block text-xs font-medium text-gray-500">
                              {group.phoneNumber}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        <Layers3 className="h-3.5 w-3.5" />
                        {formatNumber(group.sales.length)} line
                        {group.sales.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                      {formatNumber(group.totalQuantity)} item
                      {group.totalQuantity !== 1 ? "s" : ""}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-500"
                      colSpan={3}
                    >
                      Latest sale {formatDate(group.latestSaleDate)}
                    </td>
                    <td className="px-6 py-4" />
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-blue-700">
                        {formatCurrency(group.totalAmount)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-xs font-semibold text-gray-400"
                      colSpan={2}
                    >
                      Click patient to view sale lines
                    </td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {isPatientGroupExpanded(group.key) ? (
                      <motion.tr
                        key={`${group.key}-details`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={10} className="p-0">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{
                              duration: 0.26,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden bg-slate-50/70"
                          >
                            <div className="border-y border-slate-100 px-6 py-3">
                              <div className="ml-11 grid grid-cols-[minmax(180px,1.35fr)_minmax(130px,1fr)_90px_110px_120px_minmax(150px,1fr)] gap-4 px-4 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <span>Medicine</span>
                                <span>Group & company</span>
                                <span className="text-right">Qty</span>
                                <span className="text-right">Unit price</span>
                                <span className="text-right">Line total</span>
                                <span>Source & date</span>
                              </div>
                              <div className="ml-11 space-y-1.5">
                                {group.sales.map((sale, index) => (
                                  <motion.div
                                    key={sale.id}
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: Math.min(index * 0.025, 0.2),
                                      duration: 0.18,
                                    }}
                                    className="grid grid-cols-[minmax(180px,1.35fr)_minmax(130px,1fr)_90px_110px_120px_minmax(150px,1fr)] items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-blue-100 hover:shadow-sm"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-slate-900">
                                        {getMedicineDisplayName(sale.medicine)}
                                      </p>
                                      {getMedicineGenericSubtitle(
                                        sale.medicine,
                                      ) ? (
                                        <p className="truncate text-[11px] text-slate-500">
                                          {getMedicineGenericSubtitle(
                                            sale.medicine,
                                          )}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-blue-700">
                                        {sale.medicine.group?.name ||
                                          "Unknown Group"}
                                      </p>
                                      <p className="truncate text-[11px] text-slate-500">
                                        {sale.purchase.company?.name ||
                                          "Unknown Company"}
                                      </p>
                                    </div>
                                    <span className="text-right text-sm font-bold text-slate-900">
                                      {formatNumber(getSaleQuantity(sale))}
                                    </span>
                                    <span className="text-right text-xs font-semibold text-slate-600">
                                      {formatCurrency(getSaleUnitPrice(sale))}
                                    </span>
                                    <span className="text-right text-sm font-black text-blue-700">
                                      {formatCurrency(
                                        getSaleTotalAmount(sale),
                                      )}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap gap-1">
                                        {sale.packageCode ? (
                                          <span className="truncate rounded-md border border-pink-100 bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-700">
                                            {sale.operationName ||
                                              sale.packageCode}
                                          </span>
                                        ) : null}
                                        {sale.admission?.admissionNumber ? (
                                          <span className="truncate rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            {sale.admission.admissionNumber}
                                          </span>
                                        ) : !sale.packageCode ? (
                                          <span className="text-[10px] font-semibold text-slate-400">
                                            Walk-in
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                                        {formatDate(sale.saleDate)} · Sale #
                                        {sale.id}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    ) : null}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {patientGroups.map((group) => (
            <motion.div layout key={group.key} className="p-4">
              <button
                type="button"
                onClick={() => togglePatientGroup(group.key)}
                className="flex w-full items-start justify-between gap-3 text-left"
                aria-expanded={isPatientGroupExpanded(group.key)}
                aria-label={`${isPatientGroupExpanded(group.key) ? "Collapse" : "Expand"} sales for ${group.patientName}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{
                        rotate: isPatientGroupExpanded(group.key) ? 90 : 0,
                      }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900">
                        {group.patientName}
                      </p>
                      {group.phoneNumber ? (
                        <p className="text-xs font-medium text-gray-500">
                          {group.phoneNumber}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-700">
                      {formatNumber(group.sales.length)} line
                      {group.sales.length !== 1 ? "s" : ""}
                    </span>
                    <span className="rounded-lg bg-gray-50 px-2 py-1 font-semibold text-gray-600">
                      Qty {formatNumber(group.totalQuantity)}
                    </span>
                    <span className="rounded-lg bg-gray-50 px-2 py-1 font-semibold text-gray-600">
                      Latest {formatDate(group.latestSaleDate)}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black text-blue-700">
                  {formatCurrency(group.totalAmount)}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isPatientGroupExpanded(group.key) ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 border-l border-gray-200 pl-3">
                      {group.sales.map((sale, index) => (
                        <motion.div
                          key={sale.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(index * 0.025, 0.18),
                            duration: 0.18,
                          }}
                          className="rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">
                                {getMedicineDisplayName(sale.medicine)}
                              </p>
                              {getMedicineGenericSubtitle(sale.medicine) ? (
                                <p className="text-xs text-gray-500">
                                  Generic:{" "}
                                  {getMedicineGenericSubtitle(sale.medicine)}
                                </p>
                              ) : null}
                              {sale.packageCode ? (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-pink-100 bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                                  {sale.operationName || sale.packageCode} package
                                </span>
                              ) : null}
                              {sale.admission?.admissionNumber ? (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  Admission: {sale.admission.admissionNumber}
                                </span>
                              ) : null}
                            </div>
                            <span className="shrink-0 text-sm font-bold text-blue-700">
                              {formatCurrency(getSaleTotalAmount(sale))}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>
                              <span className="font-semibold text-gray-500">
                                Company:
                              </span>{" "}
                              {sale.purchase.company?.name ||
                                "Unknown Company"}
                            </span>
                            <span>
                              <span className="font-semibold text-gray-500">
                                Qty:
                              </span>{" "}
                              {formatNumber(getSaleQuantity(sale))} ×{" "}
                              {formatCurrency(getSaleUnitPrice(sale))}
                            </span>
                            <span>
                              <span className="font-semibold text-gray-500">
                                Date:
                              </span>{" "}
                              {formatDate(sale.saleDate)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalPatients}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={changePage}
            onPrev={() => changePage(Math.max(1, currentPage - 1))}
            onNext={() =>
              changePage(Math.min(totalPages, currentPage + 1))
            }
          />
        </div>
      )}
    </>
  );
};

export default SaleTable;
