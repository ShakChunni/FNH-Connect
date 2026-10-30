"use client";

/**
 * Medicine Inventory — Sale Items Table
 *
 * Inventory-owned multi-row cart. Each row carries a stable `clientId`
 * for React keys, live medicine metadata from the catalog, and an
 * editable direct-sale price. The component intentionally does not know
 * anything about admission billing modes.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Layers,
  Loader2,
  Minus,
  Pill,
  Plus,
  Search,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { TONE_BADGE, statusBadgeClass } from "@/lib/statusStyles";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
import { getMedicineDisplayName } from "../../utils/medicineDisplay";
import type { Medicine } from "../../types";
import type { MedicineSaleDraftItem } from "../../stores/saleFormStore";

const currency = (value: number) =>
  `৳${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

interface MedicineListApiResponse {
  success: boolean;
  data: Array<Medicine & { group: { id: number; name: string } }>;
  error?: string;
}

interface MedicineLookupProps {
  item: MedicineSaleDraftItem;
  onSelect: (medicine: Medicine) => void;
  disabled: boolean;
}

function MedicineLookupInput({ item, onSelect, disabled }: MedicineLookupProps) {
  const [query, setQuery] = useState(
    item.requestedMedicineName || item.medicineName || "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Medicine[]>([]);
  const [retryKey, setRetryKey] = useState(0);

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
        setOptions([]);
        setError("Could not load medicines.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [disabled, isOpen, query, retryKey]);

  const isMatched = item.medicineId !== null;
  const needsMatch = !isMatched && item.requestedMedicineName;

  return (
    <div className="relative min-w-0">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Search pharmacy"
          className={cn(
            "h-9 w-full rounded-lg border bg-white pl-8 pr-8 text-xs font-medium outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100",
            isMatched
              ? "border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-100"
              : needsMatch
                ? "border-amber-300 text-amber-900 focus:border-amber-500 focus:ring-amber-100"
                : "border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-blue-100"
          )}
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-600" />
        ) : isMatched ? (
          <CheckCircle2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-700" />
        ) : needsMatch ? (
          <AlertTriangle className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-700" />
        ) : null}
      </div>
      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl sm:min-w-[240px]">
          {error ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <p className="text-xs font-medium text-red-700">{error}</p>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setRetryKey((key) => key + 1)}
                className="h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          ) : null}
          {!error && options.length === 0 && !isLoading ? (
            <p className="px-3 py-3 text-xs text-slate-500">
              No matching medicines found.
            </p>
          ) : null}
          {options.map((medicine) => {
            const displayName = getMedicineDisplayName(medicine);
            const isSelected = medicine.id === item.medicineId;
            return (
              <button
                key={medicine.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(medicine);
                  setQuery(displayName);
                  setIsOpen(false);
                }}
                className={`w-full border-b border-slate-100 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-blue-50 ${
                  isSelected ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {displayName}
                    </p>
                    <p className="truncate text-2xs text-slate-500">
                      {medicine.genericName}
                      {medicine.strength ? ` · ${medicine.strength}` : ""}
                      {medicine.dosageForm
                        ? ` · ${medicine.dosageForm}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold tabular-nums text-blue-700">
                      ৳
                      {Number(medicine.defaultSalePrice || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                      /unit
                    </p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        medicine.currentStock > 0
                          ? "text-slate-500"
                          : "text-red-700"
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

interface StockBadgeProps {
  stock: number;
  isOutOfStock: boolean;
  isShort: boolean;
}

function StockBadge({ stock, isOutOfStock, isShort }: StockBadgeProps) {
  const toneClass = statusBadgeClass(
    isOutOfStock ? "Out of Stock" : isShort ? "Low Stock" : "In Stock",
  );

  return (
    <div
      className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 ring-1 ring-inset ${toneClass}`}
    >
      <Boxes className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs font-bold tabular-nums">{stock}</span>
    </div>
  );
}

interface RowWarningProps {
  item: MedicineSaleDraftItem;
}

function RowWarning({ item }: RowWarningProps) {
  const isMatched = item.medicineId !== null;
  const stock = item.currentStock;
  const messages: string[] = [];

  if (!isMatched) messages.push("Select pharmacy medicine");
  if (isMatched && stock === 0) messages.push("Out of stock");
  if (isMatched && item.quantity > stock) {
    messages.push(`Qty exceeds stock (${stock})`);
  }
  if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
    messages.push("Direct sale price missing");
  }

  if (messages.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {messages.map((message) => (
        <span
          key={message}
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-2xs font-semibold ring-1 ring-inset ${TONE_BADGE.warning}`}
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          {message}
        </span>
      ))}
    </div>
  );
}

interface SaleItemsTableProps {
  items: MedicineSaleDraftItem[];
  isSubmitting: boolean;
  onUpdateRow: (
    clientId: string,
    patch: Partial<MedicineSaleDraftItem>,
  ) => void;
  onSelectMedicine: (clientId: string, medicine: Medicine) => void;
  onRemove: (clientId: string) => void;
}

export const SaleItemsTable: React.FC<SaleItemsTableProps> = ({
  items,
  isSubmitting,
  onUpdateRow,
  onSelectMedicine,
  onRemove,
}) => {
  const matchedCount = items.filter((item) => item.medicineId !== null).length;
  const unmatchedCount = items.length - matchedCount;
  const totalAmount = useMemo(
    () =>
      Math.round(
        items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) *
          100,
      ) / 100,
    [items],
  );
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return (
    <div className="overflow-visible rounded-xl border border-blue-200 bg-white shadow-sm">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm border border-blue-100">
              <Pill className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-800">Cart</h4>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-2xs text-slate-500">
                  {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
                  {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-2xs font-semibold ring-1 ring-inset ${TONE_BADGE.success}`}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {matchedCount} matched
                </span>
                {unmatchedCount > 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-2xs font-semibold ring-1 ring-inset ${TONE_BADGE.warning}`}
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {unmatchedCount} need selection
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? null : (
        <div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[820px] table-fixed text-xs">
              <thead>
                <tr className="bg-fnh-navy text-white">
                  <th className="w-8 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    #
                  </th>
                  <th className="w-[18%] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Medicine
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Stock
                  </th>
                  <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="w-32 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    FIFO Company
                  </th>
                  <th className="w-32 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="w-32 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="w-28 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                    Total
                  </th>
                  <th className="w-12 px-1 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isMatched = item.medicineId !== null;
                  const stock = item.currentStock;
                  const outOfStock = isMatched && stock === 0;
                  const stockShort = isMatched && item.quantity > stock;
                  const lineTotal = roundToTwoDecimals(
                    item.unitPrice * item.quantity,
                  );

                  return (
                    <tr
                      key={item.clientId}
                      className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3 text-2xs font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <MedicineLookupInput
                          item={item}
                          disabled={isSubmitting}
                          onSelect={(medicine) =>
                            onSelectMedicine(item.clientId, medicine)
                          }
                        />
                        <RowWarning item={item} />
                      </td>
                      <td className="px-3 py-3">
                        {isMatched ? (
                          <StockBadge
                            stock={stock}
                            isOutOfStock={outOfStock}
                            isShort={stockShort}
                          />
                        ) : (
                          <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-slate-300">
                            <Boxes className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs font-bold">—</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {item.groupName ? (
                          <span className="inline-flex h-9 w-full items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-2xs font-semibold text-blue-700">
                            <Layers className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.groupName}</span>
                          </span>
                        ) : (
                          <div className="flex h-9 w-full items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-slate-300">
                            <span className="text-xs font-bold">—</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700 font-semibold">
                        {item.companyName || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm h-9">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateRow(item.clientId, {
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            disabled={isSubmitting || item.quantity <= 1}
                            className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <NumberInput
                            min={1}
                            max={isMatched ? stock : undefined}
                            value={item.quantity}
                            onChange={(event) =>
                              onUpdateRow(item.clientId, {
                                quantity: Math.max(
                                  1,
                                  Math.trunc(
                                    Number(event.target.value) || 1,
                                  ),
                                ),
                              })
                            }
                            disabled={isSubmitting}
                            className="h-9 min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none disabled:bg-slate-100"
                            aria-label="Quantity"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateRow(item.clientId, {
                                quantity: item.quantity + 1,
                              })
                            }
                            disabled={
                              isSubmitting ||
                              (isMatched && item.quantity >= stock)
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-500">
                            ৳
                          </span>
                          <NumberInput
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              onUpdateRow(item.clientId, {
                                unitPrice: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              })
                            }
                            disabled={isSubmitting}
                            aria-label="Unit price"
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-right text-xs font-bold tabular-nums text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-blue-700">
                            ৳
                          </span>
                          <div className="h-9 w-full rounded-lg border border-blue-200 bg-blue-50 pl-6 pr-2 text-right text-xs font-extrabold tabular-nums text-blue-700 leading-9">
                            {lineTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemove(item.clientId)}
                          disabled={isSubmitting}
                          className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove medicine row"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-200 bg-blue-50/60">
                  <td
                    colSpan={7}
                    className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider"
                  >
                    Cart total
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-extrabold tabular-nums text-blue-700">
                    {currency(totalAmount)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
            {items.map((item, index) => {
              const isMatched = item.medicineId !== null;
              const stock = item.currentStock;
              const outOfStock = isMatched && stock === 0;
              const stockShort = isMatched && item.quantity > stock;
              const lineTotal = roundToTwoDecimals(
                item.unitPrice * item.quantity,
              );

              return (
                <div
                  key={item.clientId}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                        #{index + 1}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-800">
                        {item.medicineName ||
                          item.requestedMedicineName ||
                          "Select medicine"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.clientId)}
                      disabled={isSubmitting}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label="Remove medicine row"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <MedicineLookupInput
                    item={item}
                    disabled={isSubmitting}
                    onSelect={(medicine) =>
                      onSelectMedicine(item.clientId, medicine)
                    }
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
                      <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-2xs font-semibold text-blue-700">
                        <Layers className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.groupName}</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-slate-500">
                        Qty
                      </p>
                      <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm h-9">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateRow(item.clientId, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          disabled={isSubmitting || item.quantity <= 1}
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <NumberInput
                          min={1}
                          max={isMatched ? stock : undefined}
                          value={item.quantity}
                          onChange={(event) =>
                            onUpdateRow(item.clientId, {
                              quantity: Math.max(
                                1,
                                Math.trunc(
                                  Number(event.target.value) || 1,
                                ),
                              ),
                            })
                          }
                          disabled={isSubmitting}
                          className="h-9 min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none disabled:bg-slate-100"
                          aria-label="Quantity"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateRow(item.clientId, {
                              quantity: item.quantity + 1,
                            })
                          }
                          disabled={
                            isSubmitting ||
                            (isMatched && item.quantity >= stock)
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-slate-500">
                        Unit Price
                      </p>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-500">
                          ৳
                        </span>
                        <NumberInput
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            onUpdateRow(item.clientId, {
                              unitPrice: Math.max(
                                0,
                                Number(event.target.value) || 0,
                              ),
                            })
                          }
                          disabled={isSubmitting}
                          aria-label="Unit price"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-right text-xs font-bold tabular-nums text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-slate-500">
                        Total
                      </p>
                      <div className="h-9 w-full rounded-lg border border-blue-200 bg-blue-50 pl-2 pr-2 text-right text-xs font-extrabold tabular-nums text-blue-700 leading-9">
                        ৳
                        {lineTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-bold text-slate-700">
                Cart total ({items.length} item
                {items.length !== 1 ? "s" : ""} · {totalUnits} unit
                {totalUnits !== 1 ? "s" : ""})
              </p>
              <p className="text-lg font-extrabold tabular-nums text-blue-700">
                {currency(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
