"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
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
import { DropdownPortal } from "@/components/ui/DropdownPortal";
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
  departmentId: number | null;
  departmentName: string;
  items: MedicinePackageItem[];
}

interface DepartmentOption {
  id: number;
  name: string;
}

interface DraftPackageItem {
  clientId: string;
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

const createDraftItemId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `package-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const blankItem = (): DraftPackageItem => ({
  clientId: createDraftItemId(),
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
  departmentId: null,
  departmentName: "",
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
  departmentId: definition.departmentId,
  departmentName: definition.departmentName,
  items: definition.items.map((item) => ({
    clientId: createDraftItemId(),
    templateName: item.templateName,
    aliasesText: item.aliases.join(", "),
    quantity: item.quantity,
  })),
});

const PackageManagerSkeleton: React.FC = () => (
  <div
    className="grid min-h-0 flex-1 animate-pulse grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-cols-[260px_minmax(0,1fr)] md:grid-rows-1"
    aria-busy="true"
    aria-label="Loading medicine packages"
  >
    <aside className="border-b border-gray-100 bg-gray-50/70 p-3 md:border-b-0 md:border-r md:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-2.5 w-28 rounded bg-gray-200/80" />
        </div>
        <div className="h-8 w-14 rounded-lg bg-indigo-100" />
      </div>
      <div className="flex gap-2 overflow-hidden md:block md:space-y-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="min-w-[210px] space-y-2 rounded-xl border border-gray-200 bg-white p-3 md:min-w-0"
          >
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100" />
            <div className="h-2.5 w-5/6 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </aside>

    <section className="min-h-0 overflow-hidden p-3 sm:p-6">
      <div className="mb-5 space-y-2">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-3 w-72 max-w-full rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-2.5 w-20 rounded bg-gray-200" />
            <div className="h-9 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="h-2.5 w-56 max-w-full rounded bg-gray-200/70" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-indigo-100" />
        </div>
        <div className="space-y-3 p-3 sm:p-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[1fr_1.4fr_90px_38px]"
            >
              <div className="h-9 rounded-lg bg-gray-200/80" />
              <div className="h-9 rounded-lg bg-gray-200/70" />
              <div className="h-9 rounded-lg bg-gray-200/70" />
              <div className="h-9 rounded-lg bg-rose-100" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading medicine package editor</span>
    </section>
  </div>
);

const ManageMedicinePackagesModal: React.FC<ManageMedicinePackagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const departmentButtonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [definitions, setDefinitions] = useState<MedicinePackageDefinition[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState(blankPackage);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<MedicinePackageDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const isLucsDraft = draft.code.trim().toUpperCase() === "LUCS_OT_MEDICINE";

  const loadDefinitions = useCallback(
    async (preferredCode?: string) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [response, departmentsResponse] = await Promise.all([
          api.get<PackageApiResponse>(
            "/medicine-inventory/sale-packages?mode=manage",
          ),
          api.get<{ success: boolean; data: DepartmentOption[] }>(
            "/departments",
          ),
        ]);
        if (!response.data.success || !Array.isArray(response.data.data)) {
          throw new Error(
            response.data.error || "Failed to load medicine packages",
          );
        }

        const nextDefinitions = response.data.data;
        setDefinitions(nextDefinitions);
        if (departmentsResponse.data.success) {
          setDepartments(departmentsResponse.data.data);
        }
        const nextCode =
          preferredCode &&
          nextDefinitions.some((item) => item.code === preferredCode)
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
        const message = getErrorMessage(
          error,
          "Failed to load medicine packages",
        );
        setLoadError(message);
        showNotification(message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification],
  );

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
      if (event.key !== "Escape") return;
      if (isDepartmentOpen) {
        setIsDepartmentOpen(false);
        return;
      }
      if (!isSaving && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isDepartmentOpen, isOpen, isSaving, onClose]);

  const selectDefinition = (definition: MedicinePackageDefinition) => {
    if (isSaving || isDeleting) return;
    setIsDepartmentOpen(false);
    setEditingCode(definition.code);
    setDraft(toDraft(definition));
  };

  const startNew = () => {
    if (isSaving || isDeleting) return;
    setIsDepartmentOpen(false);
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
    departmentId: draft.departmentId,
    departmentName: draft.departmentName.trim(),
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
    if (!payload.departmentName) return "Department is required";
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
      await queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "sale-package-summaries"],
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
      await queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "sale-package-summaries"],
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
    <>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          setDefinitions([]);
          setDepartments([]);
          setEditingCode(null);
          setDraft(blankPackage());
          setLoadError(null);
          setIsDepartmentOpen(false);
          setIsLoading(true);
        }}
      >
        {isOpen && (
          <motion.div
            key="manage-medicine-packages-modal"
            className="fixed inset-0 z-100000 flex items-center justify-center bg-slate-900/70 sm:p-6"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !isSaving &&
                !isDeleting
              ) {
                onClose();
              }
            }}
          >
            <motion.div
              ref={popupRef}
              className="flex h-[100dvh] max-h-none w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl"
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

            {isLoading ? (
              <PackageManagerSkeleton />
            ) : loadError ? (
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm rounded-2xl border border-rose-100 bg-rose-50/60 p-5 text-center"
                  role="alert"
                >
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-rose-600 shadow-sm">
                    <CircleAlert className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">
                    Could not load packages
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadDefinitions()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    Try again
                  </button>
                </motion.div>
              </div>
            ) : (
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-cols-[260px_minmax(0,1fr)] md:grid-rows-1">
              <aside className="shrink-0 border-b border-gray-100 bg-gray-50/70 p-3 md:min-h-0 md:border-b-0 md:border-r md:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Packages</p>
                    <p className="text-[11px] text-gray-500">Used by medicine sales</p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={startNew}
                    disabled={isLoading || isSaving || isDeleting}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New
                  </motion.button>
                </div>

                {definitions.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(92vh-190px)] md:space-y-2 md:overflow-y-auto md:pb-0">
                    <AnimatePresence initial={false}>
                      {definitions.map((definition) => (
                        <motion.button
                          layout
                          key={definition.code}
                          type="button"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8, height: 0 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => selectDefinition(definition)}
                          className={`min-w-[210px] rounded-xl border px-3 py-3 text-left transition md:w-full md:min-w-0 ${
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
                            {definition.items.length} medicine items · {definition.departmentName}
                          </span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500">
                    No packages yet.
                  </p>
                )}
              </aside>

              <section className="min-h-0 min-w-0 overflow-y-auto p-3 sm:p-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={editingCode ?? "new-package"}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Package code *</span>
                    <input
                      value={draft.code}
                      onChange={(event) => updateDraft("code", event.target.value)}
                      disabled={Boolean(editingCode) || isSaving || isDeleting}
                      placeholder="LUCS_OT_MEDICINE"
                      className={`${inputClass} font-mono disabled:bg-gray-100 disabled:text-gray-500`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Display name *</span>
                    <input
                      value={draft.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      disabled={isSaving || isDeleting}
                      placeholder="LUCS OT medicine"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">Operation name *</span>
                    <input
                      value={draft.operationName}
                      onChange={(event) => updateDraft("operationName", event.target.value)}
                      disabled={isLucsDraft || isSaving || isDeleting}
                      placeholder="LUCS"
                      className={inputClass}
                    />
                  </label>
                  <div className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-gray-700">
                      Department *
                    </span>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <button
                        ref={departmentButtonRef}
                        type="button"
                        onClick={() =>
                          setIsDepartmentOpen((current) => !current)
                        }
                        disabled={isLucsDraft || isSaving || isDeleting}
                        className={`${inputClass} flex items-center justify-between gap-2 pl-9 text-left disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
                        aria-expanded={isDepartmentOpen}
                        aria-haspopup="listbox"
                      >
                        <span
                          className={
                            draft.departmentName
                              ? "truncate font-medium text-gray-700"
                              : "truncate text-gray-400"
                          }
                        >
                          {draft.departmentName || "Select department"}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                            isDepartmentOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <DropdownPortal
                      isOpen={isDepartmentOpen}
                      onClose={() => setIsDepartmentOpen(false)}
                      buttonRef={departmentButtonRef}
                      className="min-w-[240px]"
                    >
                      <div
                        className="max-h-[min(320px,50vh)] overflow-y-auto p-1.5"
                        role="listbox"
                        aria-label="Package department"
                      >
                        {draft.departmentName &&
                          draft.departmentName !== "All Departments" &&
                          !departments.some(
                            (department) =>
                              department.id === draft.departmentId,
                          ) && (
                            <div className="mb-1 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                              Current legacy department: {draft.departmentName}
                            </div>
                          )}

                        {departments.map((department) => {
                          const isSelected =
                            draft.departmentId === department.id &&
                            draft.departmentName !== "All Departments";
                          return (
                            <button
                              key={department.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setDraft((current) => ({
                                  ...current,
                                  departmentId: department.id,
                                  departmentName: department.name,
                                }));
                                setIsDepartmentOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                                isSelected
                                  ? "bg-indigo-600 font-semibold text-white"
                                  : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-800"
                              }`}
                            >
                              <span className="truncate">{department.name}</span>
                              {isSelected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}

                        <div className="my-1.5 border-t border-gray-100" />
                        <button
                          type="button"
                          role="option"
                          aria-selected={
                            draft.departmentName === "All Departments"
                          }
                          onClick={() => {
                            setDraft((current) => ({
                              ...current,
                              departmentId: null,
                              departmentName: "All Departments",
                            }));
                            setIsDepartmentOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                            draft.departmentName === "All Departments"
                              ? "bg-indigo-600 text-white"
                              : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-800"
                          }`}
                        >
                          <span>
                            <span className="block text-xs font-semibold">
                              All Departments
                            </span>
                            <span
                              className={`block text-[10px] ${
                                draft.departmentName === "All Departments"
                                  ? "text-indigo-100"
                                  : "text-gray-400"
                              }`}
                            >
                              Make this preset available globally
                            </span>
                          </span>
                          {draft.departmentName === "All Departments" && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </DropdownPortal>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Package medicines</p>
                      <p className="text-[11px] text-gray-500">Add the catalog spelling and optional alternate names.</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={addItem}
                      disabled={isSaving || isDeleting}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </motion.button>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    <AnimatePresence initial={false}>
                    {draft.items.map((item, index) => (
                      <motion.div
                        layout
                        key={item.clientId}
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, x: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="grid overflow-hidden gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_90px_auto] sm:items-end"
                      >
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
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {validationError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="mt-3 overflow-hidden rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                      role="status"
                    >
                      {validationError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="sticky bottom-0 z-10 -mx-3 mt-5 flex justify-end gap-2 border-t border-gray-100 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving || isDeleting}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Close
                  </button>
                  <motion.button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={Boolean(validationError) || isLoading || isSaving || isDeleting}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSaving ? "Saving..." : editingCode ? "Save changes" : "Create package"}
                  </motion.button>
                </div>
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    </>
  );
};

export default ManageMedicinePackagesModal;
