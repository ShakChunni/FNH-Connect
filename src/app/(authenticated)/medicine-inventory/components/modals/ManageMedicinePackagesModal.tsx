"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ModalHeader } from "@/components/ui/ModalHeader";
import {
  backdropVariants,
  modalVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";

interface MedicinePackageItem {
  templateName: string;
  aliases: string[];
  quantity: number;
}

interface MedicinePackageDefinition {
  code: string;
  name: string;
  operationName: string;
  items: MedicinePackageItem[];
}

interface DraftPackageItem {
  templateName: string;
  aliasesText: string;
  quantity: number;
}

interface ManageMedicinePackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PackageApiResponse {
  success: boolean;
  data: MedicinePackageDefinition[] | MedicinePackageDefinition;
  error?: string;
}

const blankItem = (): DraftPackageItem => ({
  templateName: "",
  aliasesText: "",
  quantity: 1,
});

const blankPackage = (): Omit<MedicinePackageDefinition, "items"> & {
  items: DraftPackageItem[];
} => ({
  code: "",
  name: "",
  operationName: "",
  items: [blankItem()],
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const toDraft = (definition: MedicinePackageDefinition) => ({
  code: definition.code,
  name: definition.name,
  operationName: definition.operationName,
  items: definition.items.map((item) => ({
    templateName: item.templateName,
    aliasesText: item.aliases.join(", "),
    quantity: item.quantity,
  })),
});

const ManageMedicinePackagesModal: React.FC<ManageMedicinePackagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [definitions, setDefinitions] = useState<MedicinePackageDefinition[]>([]);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState(blankPackage);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicinePackageDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDefinitions = useCallback(async (preferredCode?: string) => {
    setIsLoading(true);
    try {
      const response = await api.get<PackageApiResponse>(
        "/medicine-inventory/sale-packages?mode=manage",
      );
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data.error || "Failed to load medicine packages");
      }

      const nextDefinitions = response.data.data;
      setDefinitions(nextDefinitions);
      const nextCode =
        preferredCode && nextDefinitions.some((item) => item.code === preferredCode)
          ? preferredCode
          : nextDefinitions[0]?.code;
      const selected = nextDefinitions.find((item) => item.code === nextCode);
      if (selected) {
        setEditingCode(selected.code);
        setDraft(toDraft(selected));
      } else {
        setEditingCode(null);
        setDraft(blankPackage());
      }
    } catch (error) {
      showNotification(
        getErrorMessage(error, "Failed to load medicine packages"),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      void loadDefinitions();
    } else {
      preserveUnlockBodyScroll();
    }

    return () => preserveUnlockBodyScroll();
  }, [isOpen, loadDefinitions]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isOpen, isSaving, onClose]);

  const selectDefinition = (definition: MedicinePackageDefinition) => {
    if (isSaving || isDeleting) return;
    setEditingCode(definition.code);
    setDraft(toDraft(definition));
  };

  const startNew = () => {
    if (isSaving || isDeleting) return;
    setEditingCode(null);
    setDraft(blankPackage());
  };

  const updateDraft = <K extends keyof typeof draft>(
    field: K,
    value: (typeof draft)[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (
    index: number,
    field: keyof DraftPackageItem,
    value: string | number,
  ) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setDraft((current) => ({ ...current, items: [...current.items, blankItem()] }));
  };

  const removeItem = (index: number) => {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const payload = useMemo(() => ({
    code: draft.code.trim(),
    name: draft.name.trim(),
    operationName: draft.operationName.trim(),
    items: draft.items.map((item) => {
      const aliases = item.aliasesText
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean);
      return {
        templateName: item.templateName.trim(),
        aliases: Array.from(new Set([item.templateName.trim(), ...aliases].filter(Boolean))),
        quantity: Number(item.quantity),
      };
    }),
  }), [draft]);

  const validationError = useMemo(() => {
    if (!payload.code) return "Package code is required";
    if (!/^[A-Za-z0-9_-]+$/.test(payload.code)) {
      return "Package code may contain only letters, numbers, _ and -";
    }
    if (!payload.name) return "Package name is required";
    if (!payload.operationName) return "Operation name is required";
    if (!payload.items.length) return "Add at least one medicine item";
    if (payload.items.some((item) => !item.templateName)) {
      return "Every medicine item needs a template name";
    }
    if (payload.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return "Every medicine item quantity must be at least 1";
    }
    return null;
  }, [payload]);

  const handleSave = async () => {
    if (isSaving || isDeleting) return;
    if (validationError) {
      showNotification(validationError, "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = editingCode
        ? await api.patch<PackageApiResponse>(
            "/medicine-inventory/sale-packages",
            payload,
          )
        : await api.post<PackageApiResponse>(
            "/medicine-inventory/sale-packages",
            payload,
          );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to save medicine package");
      }

      const saved = response.data.data as MedicinePackageDefinition;
      showNotification(
        editingCode ? "Medicine package updated" : "Medicine package created",
        "success",
      );
      await queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "sale-package"],
      });
      await loadDefinitions(saved.code);
    } catch (error) {
      showNotification(
        getErrorMessage(error, "Failed to save medicine package"),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting || isSaving) return;
    setIsDeleting(true);
    try {
      const response = await api.delete<PackageApiResponse>(
        `/medicine-inventory/sale-packages?code=${encodeURIComponent(deleteTarget.code)}`,
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to delete medicine package");
      }

      showNotification("Medicine package deleted", "success");
      setDeleteTarget(null);
      setEditingCode(null);
      await queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "sale-package"],
      });
      await loadDefinitions();
    } catch (error) {
      showNotification(
        getErrorMessage(error, "Failed to delete medicine package"),
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-100000 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving && !isDeleting) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={popupRef}
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ModalHeader
              icon={Package}
              iconColor="indigo"
              title="Manage medicine packages"
              subtitle="Create, edit, or remove reusable medicine bundles"
              onClose={onClose}
              isDisabled={isSaving || isDeleting}
            />

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="border-b border-gray-100 bg-gray-50/70 p-3 md:border-b-0 md:border-r md:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Packages</p>
                    <p className="text-[11px] text-gray-500">Used by medicine sales</p>
                  </div>
                  <button
                    type="button"
                    onClick={startNew}
                    disabled={isLoading || isSaving || isDeleting}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : definitions.length ? (
                  <div className="space-y-2">
                    {definitions.map((definition) => (
                      <button
                        key={definition.code}
                        type="button"
                        onClick={() => selectDefinition(definition)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          editingCode === definition.code
                            ? "border-indigo-300 bg-indigo-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
                        }`}
                      >
                        <span className="block truncate text-xs font-bold text-gray-800">
                          {definition.name}
                        </span>
                        <span className="mt-1 block truncate font-mono text-[10px] text-gray-500">
                          {definition.code}
                        </span>
                        <span className="mt-1 block text-[10px] text-gray-500">
                          {definition.items.length} medicine items
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500">
                    No packages yet.
                  </p>
                )}
              </aside>

              <section className="min-w-0 overflow-y-auto p-4 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {editingCode ? "Edit package" : "Create package"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Aliases help the system match each item to the live medicine catalog.
                    </p>
                  </div>
                  {editingCode && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = definitions.find((item) => item.code === editingCode);
                        if (target) setDeleteTarget(target);
                      }}
                      disabled={isSaving || isDeleting}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block sm:col-span-1">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Package code *</span>
                    <input
                      value={draft.code}
                      onChange={(event) => updateDraft("code", event.target.value)}
                      disabled={Boolean(editingCode) || isSaving || isDeleting}
                      placeholder="LUCS_OT_MEDICINE"
                      className={`${inputClass} font-mono disabled:bg-gray-100 disabled:text-gray-500`}
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Display name *</span>
                    <input
                      value={draft.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      disabled={isSaving || isDeleting}
                      placeholder="LUCS OT medicine"
                      className={inputClass}
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Operation name *</span>
                    <input
                      value={draft.operationName}
                      onChange={(event) => updateDraft("operationName", event.target.value)}
                      disabled={isSaving || isDeleting}
                      placeholder="LUCS"
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Package medicines</p>
                      <p className="text-[11px] text-gray-500">Add the catalog spelling and optional alternate names.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={isSaving || isDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </button>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {draft.items.map((item, index) => (
                      <div key={index} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_90px_auto] sm:items-end">
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold text-gray-600">Template / catalog name *</span>
                          <input
                            value={item.templateName}
                            onChange={(event) => updateItem(index, "templateName", event.target.value)}
                            disabled={isSaving || isDeleting}
                            placeholder="e.g. IV Cannula"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold text-gray-600">Aliases (comma separated)</span>
                          <input
                            value={item.aliasesText}
                            onChange={(event) => updateItem(index, "aliasesText", event.target.value)}
                            disabled={isSaving || isDeleting}
                            placeholder="e.g. IV Cannula, IV Canula"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold text-gray-600">Quantity *</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.quantity}
                            onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                            disabled={isSaving || isDeleting}
                            className={inputClass}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={draft.items.length === 1 || isSaving || isDeleting}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sm:hidden">Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {validationError && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    {validationError}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving || isDeleting}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={Boolean(validationError) || isLoading || isSaving || isDeleting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSaving ? "Saving..." : editingCode ? "Save changes" : "Create package"}
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete medicine package?"
        confirmLabel="Delete package"
        cancelLabel="Keep package"
        variant="destructive"
        isLoading={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        zIndex={100100}
        manageBodyScroll={false}
      >
        This removes <strong>{deleteTarget?.name}</strong> from the reusable sale package list. Existing sale records are not changed.
      </ConfirmModal>
    </AnimatePresence>
  );
};

export default ManageMedicinePackagesModal;
