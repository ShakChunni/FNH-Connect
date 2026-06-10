"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CheckCircle2,
  Layers,
  Loader2,
  Minus,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  X as XIcon,
} from "lucide-react";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
import { api } from "@/lib/axios";
import { AdmissionMedicineChargeItem } from "../../types";

export interface PharmacyMedicineOption {
  id: number;
  genericName: string;
  brandName: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  defaultSalePrice: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  group: {
    id: number;
    name: string;
  };
}

interface MedicineListApiResponse {
  success: boolean;
  data: PharmacyMedicineOption[];
  error?: string;
}

interface AdmissionMedicineItemsTableProps {
  items: AdmissionMedicineChargeItem[];
  isCanceled: boolean;
  refreshing: boolean;
  onUpdate: (
    index: number,
    patch: Partial<AdmissionMedicineChargeItem>,
  ) => void;
  onSelectMedicine: (
    index: number,
    medicine: PharmacyMedicineOption,
  ) => void;
  onRemove: (index: number) => void;
  onAddRow: () => void;
  onRefresh: () => void;
  onClearAll: () => void;
}

const currency = (value: number) => `৳${Number(value || 0).toLocaleString()}`;

const getMedicineDisplayName = (medicine: PharmacyMedicineOption) =>
  medicine.brandName?.trim() || medicine.genericName;

function StockBadge({
  stock,
  isOutOfStock,
  isShort,
}: {
  stock: number;
  isOutOfStock: boolean;
  isShort: boolean;
}) {
  const colorClass = isOutOfStock
    ? "border-red-200 bg-red-50 text-red-700"
    : isShort
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`flex h-9 w-full items-center justify-between rounded-lg border px-2.5 ${colorClass}`}
    >
      <Boxes className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs font-bold">{stock}</span>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max?: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const normalizedMax = max && max > 0 ? max : undefined;

  const setQuantity = (nextValue: number) => {
    const minBounded = Math.max(1, Math.trunc(nextValue || 1));
    const maxBounded =
      normalizedMax === undefined
        ? minBounded
        : Math.min(minBounded, normalizedMax);
    onChange(maxBounded);
  };

  return (
    <div className="flex h-9 w-full max-w-[140px] items-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setQuantity(value - 1)}
        disabled={disabled || value <= 1}
        className="grid h-9 w-8 shrink-0 place-items-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>
      <NumberInput
        min={1}
        max={normalizedMax}
        value={value}
        onChange={(event) => setQuantity(Number(event.target.value))}
        disabled={disabled}
        className="h-9 min-w-0 flex-1 border-x border-gray-200 text-center text-sm font-bold text-gray-900 outline-none disabled:bg-gray-100"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => setQuantity(value + 1)}
        disabled={
          disabled ||
          (normalizedMax !== undefined && value >= normalizedMax)
        }
        className="grid h-9 w-8 shrink-0 place-items-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function MedicineLookupInput({
  item,
  index,
  disabled,
  onSelectMedicine,
}: {
  item: AdmissionMedicineChargeItem;
  index: number;
  disabled: boolean;
  onSelectMedicine: (
    index: number,
    medicine: PharmacyMedicineOption,
  ) => void;
}) {
  const [query, setQuery] = useState(
    item.requestedMedicineName || item.medicineName || "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<PharmacyMedicineOption[]>([]);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(item.requestedMedicineName || item.medicineName || "");
  }, [item.medicineId, item.medicineName, item.requestedMedicineName]);

  useEffect(() => {
    if (!isOpen || disabled) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParam = query.trim()
          ? `search=${encodeURIComponent(query.trim())}&`
          : "";
        const response = await api.get<MedicineListApiResponse>(
          `/medicine-inventory/medicines?${searchParam}limit=20`,
          { signal: controller.signal },
        );

        if (response.data.success) {
          setOptions(response.data.data);
        } else {
          setOptions([]);
          setError(response.data.error || "Could not load medicines.");
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        console.error("Admission medicine search failed:", fetchError);
        setOptions([]);
        setError("Could not load medicines.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [disabled, isOpen, query]);

  return (
    <div className="relative min-w-0">
      <div className="mb-1 flex min-w-0 items-center gap-1 text-[11px]">
        {item.medicineId ? (
          <>
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate font-semibold text-emerald-700">
              {item.medicineName}
            </span>
          </>
        ) : (
          <>
            <TriangleAlert className="h-3 w-3 shrink-0 text-amber-500" />
            <span className="font-semibold text-amber-600">
              Select medicine
            </span>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
            setIsOpen(true);
          }}
          onBlur={() => {
            closeTimerRef.current = setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder="Search pharmacy"
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-7 text-xs font-medium text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-emerald-600" />
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
          {error ? (
            <p className="px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          ) : null}
          {!error && options.length === 0 && !isLoading ? (
            <p className="px-3 py-3 text-xs text-gray-500">
              No matching medicines found.
            </p>
          ) : null}
          {options.map((medicine) => {
            const displayName = getMedicineDisplayName(medicine);
            const isSelected = medicine.id === item.medicineId;

            return (
              <button
                type="button"
                key={medicine.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelectMedicine(index, medicine);
                  setQuery(displayName);
                  setIsOpen(false);
                }}
                className={`w-full border-b border-gray-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-emerald-50 ${
                  isSelected ? "bg-emerald-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-gray-500">
                      {medicine.genericName}
                      {medicine.strength ? ` · ${medicine.strength}` : ""}
                      {medicine.dosageForm ? ` · ${medicine.dosageForm}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-emerald-700">
                      {currency(Number(medicine.defaultSalePrice))}/unit
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        medicine.currentStock > 0
                          ? "text-gray-400"
                          : "text-red-600"
                      }`}
                    >
                      Stock {medicine.currentStock}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RowWarning({ item }: { item: AdmissionMedicineChargeItem }) {
  const isMatched = item.medicineId !== null;
  const stock = item.currentStock ?? 0;
  const messages: string[] = [];

  if (!isMatched) messages.push("Select pharmacy medicine");
  if (isMatched && stock === 0) messages.push("Out of stock");
  if (isMatched && item.quantity > stock) {
    messages.push(`Qty exceeds stock (${stock})`);
  }
  if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
    messages.push("Unit price missing");
  }

  if (messages.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {messages.map((message) => (
        <span
          key={message}
          className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"
        >
          <TriangleAlert className="h-2.5 w-2.5" />
          {message}
        </span>
      ))}
    </div>
  );
}

function UnitPriceField({
  value,
  hasMedicine,
}: {
  value: number;
  hasMedicine: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
        ৳
      </span>
      <NumberInput
        value={value}
        readOnly
        aria-label="Unit price"
        className={`h-9 w-full rounded-lg border pl-6 pr-2 text-right text-xs font-bold outline-none ${
          hasMedicine
            ? "border-gray-200 bg-gray-50 text-gray-800"
            : "border-gray-200 bg-gray-100 text-gray-400"
        }`}
      />
    </div>
  );
}

function TotalField({
  value,
  hasMedicine,
}: {
  value: number;
  hasMedicine: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-500">
        ৳
      </span>
      <NumberInput
        value={value}
        readOnly
        aria-label="Total"
        className={`h-9 w-full rounded-lg border pl-6 pr-2 text-right text-xs font-extrabold outline-none ${
          hasMedicine
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-gray-200 bg-gray-100 text-gray-400"
        }`}
      />
    </div>
  );
}

export const AdmissionMedicineItemsTable: React.FC<
  AdmissionMedicineItemsTableProps
> = ({
  items,
  isCanceled,
  refreshing,
  onUpdate,
  onSelectMedicine,
  onRemove,
  onAddRow,
  onRefresh,
  onClearAll,
}) => {
  const matchedCount = items.filter((item) => item.medicineId !== null).length;
  const unmatchedCount = items.length - matchedCount;
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.totalAmount, 0),
    [items],
  );

  return (
    <div className="mb-5 overflow-visible rounded-xl border border-emerald-200 bg-white shadow-sm">

      {/* Header */}
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm border border-emerald-100">
              <Pill className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-800">
                Gynecology medicines
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-500">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {matchedCount} matched
                </span>
                {unmatchedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                    <TriangleAlert className="h-2.5 w-2.5" />
                    {unmatchedCount} need selection
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isCanceled || refreshing || items.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={onAddRow}
              disabled={isCanceled}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
              Add row
            </button>
            <button
              type="button"
              onClick={onClearAll}
              disabled={isCanceled || items.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-8 text-center"
          >
            <Pill className="mx-auto mb-2 h-8 w-8 text-emerald-200" />
            <p className="text-sm font-medium text-gray-400">No medicines added yet</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Use the package button above or add a single medicine.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
          {/* Desktop table — visible from lg up */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="w-8 px-3 py-2.5 text-left font-semibold uppercase tracking-wider">#</th>
                  <th className="w-[18%] px-3 py-2.5 text-left font-semibold uppercase tracking-wider">PDF name</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Pharmacy match</th>
                  <th className="w-28 px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Stock</th>
                  <th className="w-28 px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Group</th>
                  <th className="w-32 px-3 py-2.5 text-center font-semibold uppercase tracking-wider">Qty</th>
                  <th className="w-28 px-3 py-2.5 text-right font-semibold uppercase tracking-wider">Unit price</th>
                  <th className="w-28 px-3 py-2.5 text-right font-semibold uppercase tracking-wider">Total</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {items.map((item, index) => {
                    const isMatched = item.medicineId !== null;
                    const stock = item.currentStock ?? 0;
                    const outOfStock = isMatched && stock === 0;
                    const stockShort = isMatched && item.quantity > stock;
                    const rowKey = item.id
                      ? `saved-${item.id}`
                      : `${item.packageCode ?? "row"}-${item.requestedMedicineName ?? item.medicineName}-${index}`;

                    return (
                      <motion.tr
                        key={rowKey}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="border-b border-gray-100 align-top last:border-b-0 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-3 text-[11px] font-bold text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <p className="truncate font-semibold text-gray-700">
                            {item.requestedMedicineName ||
                              item.medicineName ||
                              "Manual"}
                          </p>
                          <RowWarning item={item} />
                        </td>
                        <td className="px-3 py-3">
                          <MedicineLookupInput
                            item={item}
                            index={index}
                            disabled={isCanceled}
                            onSelectMedicine={onSelectMedicine}
                          />
                        </td>
                        <td className="px-3 py-3">
                          {isMatched ? (
                            <StockBadge
                              stock={stock}
                              isOutOfStock={outOfStock}
                              isShort={stockShort}
                            />
                          ) : (
                            <div className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-2.5 text-gray-300">
                              <Boxes className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-xs font-bold">—</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {item.groupName ? (
                            <span className="inline-flex h-9 w-full items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-[11px] font-semibold text-blue-700">
                              <Layers className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{item.groupName}</span>
                            </span>
                          ) : (
                            <div className="flex h-9 w-full items-center rounded-lg border border-gray-200 bg-gray-100 px-2.5 text-gray-300">
                              <span className="text-xs font-bold">—</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            <QuantityStepper
                              value={item.quantity}
                              max={isMatched ? stock : undefined}
                              disabled={isCanceled || !isMatched}
                              onChange={(value) =>
                                onUpdate(index, { quantity: value })
                              }
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <UnitPriceField
                            value={item.unitPrice}
                            hasMedicine={isMatched}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <TotalField
                            value={item.totalAmount}
                            hasMedicine={isMatched}
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRemove(index)}
                            disabled={isCanceled}
                            className="rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Remove medicine row"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-200 bg-emerald-50/60">
                  <td colSpan={7} className="px-3 py-2.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total — {items.length} item{items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    <TotalField value={totalAmount} hasMedicine={items.some((i) => i.medicineId !== null)} />
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile / tablet cards — visible below lg */}
          <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const isMatched = item.medicineId !== null;
                const stock = item.currentStock ?? 0;
                const outOfStock = isMatched && stock === 0;
                const stockShort = isMatched && item.quantity > stock;
                const cardKey = item.id
                  ? `mobile-saved-${item.id}`
                  : `mobile-${item.packageCode ?? "row"}-${item.requestedMedicineName ?? item.medicineName}-${index}`;

                return (
                  <motion.div
                    key={cardKey}
                    layout
                    initial={{ opacity: 0, scale: 0.97, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          #{index + 1}
                        </p>
                        <p className="truncate text-sm font-bold text-gray-800">
                          {item.requestedMedicineName ||
                            item.medicineName ||
                            "Manual medicine"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        disabled={isCanceled}
                        className="rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        aria-label="Remove medicine row"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <MedicineLookupInput
                      item={item}
                      index={index}
                      disabled={isCanceled}
                      onSelectMedicine={onSelectMedicine}
                    />

                    <RowWarning item={item} />

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {isMatched ? (
                        <StockBadge
                          stock={stock}
                          isOutOfStock={outOfStock}
                          isShort={stockShort}
                        />
                      ) : null}
                      {item.groupName ? (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                          <Layers className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.groupName}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Qty
                        </p>
                        <QuantityStepper
                          value={item.quantity}
                          max={isMatched ? stock : undefined}
                          disabled={isCanceled || !isMatched}
                          onChange={(value) =>
                            onUpdate(index, { quantity: value })
                          }
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Unit price
                        </p>
                        <UnitPriceField
                          value={item.unitPrice}
                          hasMedicine={isMatched}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Total
                        </p>
                        <TotalField
                          value={item.totalAmount}
                          hasMedicine={isMatched}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Mobile total bar */}
            <motion.div
              layout
              className="flex items-center justify-between rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <p className="text-sm font-bold text-gray-700">
                Total ({items.length} item{items.length !== 1 ? "s" : ""})
              </p>
              <p className="text-lg font-extrabold text-emerald-700">
                {currency(totalAmount)}
              </p>
            </motion.div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <div className="border-t border-emerald-100 bg-emerald-50/40 px-4 py-2">
        <p className="text-[11px] text-gray-500">
          Quantity can be adjusted; unit price is locked from pharmacy inventory and totals update automatically.
        </p>
      </div>
    </div>
  );
};

export default AdmissionMedicineItemsTable;
