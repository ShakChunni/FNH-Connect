"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  CirclePlus,
  Loader2,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";
import { ModalFooter, ModalHeader, ModalShell } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import { DOCTOR_CHAMBER_CONFIG } from "@/lib/doctorChamber";
import {
  useCreateDoctorChamberVisit,
  useDoctorChamberPatientSearch,
  useUpdateDoctorChamberVisit,
} from "../hooks/useDoctorChamber";
import type {
  DoctorChamberInput,
  DoctorChamberPatientInput,
  DoctorChamberPatientSearchResult,
  DoctorChamberVisitRecord,
} from "../types";
import { EMPTY_PATIENT } from "../types";

interface FeeDraft {
  id?: number;
  feeName: string;
  amountText: string;
}

interface DoctorChamberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingVisit?: DoctorChamberVisitRecord | null;
}

function patientFromVisit(visit: DoctorChamberVisitRecord): DoctorChamberPatientInput {
  return {
    id: visit.patientId,
    firstName: visit.patientFirstName,
    lastName: visit.patientLastName ?? "",
    fullName: visit.patientFullName,
    gender: visit.patientGender,
    dateOfBirth: visit.patientDateOfBirth,
    address: visit.patientAddress ?? "",
    phoneNumber: visit.patientPhoneNumber ?? "",
    email: visit.patientEmail ?? "",
    bloodGroup: visit.patientBloodGroup ?? "",
    guardianName: visit.guardianName ?? "",
    guardianGender: visit.guardianGender ?? "",
    guardianPhone: visit.guardianPhone ?? "",
    guardianAddress: visit.guardianAddress ?? "",
    guardianEmail: visit.guardianEmail ?? "",
  };
}

function getInitialPatient(
  editingVisit?: DoctorChamberVisitRecord | null,
): DoctorChamberPatientInput {
  return editingVisit ? patientFromVisit(editingVisit) : { ...EMPTY_PATIENT };
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-fnh-blue focus:ring-2 focus:ring-fnh-blue/15";

const labelClassName = "text-xs font-bold uppercase tracking-wide text-slate-500";

export default function DoctorChamberForm({
  isOpen,
  onClose,
  onSaved,
  editingVisit = null,
}: DoctorChamberFormProps) {
  const isEditing = Boolean(editingVisit);
  const [patient, setPatient] = useState<DoctorChamberPatientInput>(() =>
    getInitialPatient(editingVisit),
  );
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedPatientSearch = useDebounce(patientSearch, 250);
  const { data: patientResults = [], isFetching: isSearching } =
    useDoctorChamberPatientSearch(debouncedPatientSearch);
  const [visitingChargeText, setVisitingChargeText] = useState("0");
  const [fees, setFees] = useState<FeeDraft[]>([]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const createMutation = useCreateDoctorChamberVisit();
  const updateMutation = useUpdateDoctorChamberVisit();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    setPatient(getInitialPatient(editingVisit));
    setPatientSearch("");
    setVisitingChargeText(
      editingVisit ? String(editingVisit.visitingCharge) : "0",
    );
    setFees(
      editingVisit
        ? editingVisit.fees.map((fee) => ({
            id: fee.id,
            feeName: fee.feeName,
            amountText: String(fee.amount),
          }))
        : [],
    );
    setNotes(editingVisit?.notes ?? "");
    setFormError(null);
  }, [editingVisit, isOpen]);

  const numericVisitingCharge = Number(visitingChargeText);
  const numericExtraCharges = fees.reduce((sum, fee) => {
    const amount = Number(fee.amountText);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const estimatedTotal =
    DOCTOR_CHAMBER_CONFIG.ultrasoundCharge +
    (Number.isFinite(numericVisitingCharge) ? numericVisitingCharge : 0) +
    numericExtraCharges;

  const isBusy = isSubmitting || isSearching;

  const updatePatient = <K extends keyof DoctorChamberPatientInput>(
    key: K,
    value: DoctorChamberPatientInput[K],
  ) => {
    setPatient((current) => {
      const next = { ...current, [key]: value };
      if (key === "firstName" || key === "lastName") {
        next.fullName = [next.firstName.trim(), next.lastName.trim()]
          .filter(Boolean)
          .join(" ");
      }
      return next;
    });
  };

  const selectPatient = (result: DoctorChamberPatientSearchResult) => {
    setPatient({ ...result });
    setPatientSearch("");
  };

  const updateFee = (index: number, field: keyof FeeDraft, value: string) => {
    setFees((current) =>
      current.map((fee, feeIndex) =>
        feeIndex === index ? { ...fee, [field]: value } : fee,
      ),
    );
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!patient.firstName.trim()) {
      setFormError("Patient first name is required.");
      return;
    }

    if (!patient.gender.trim()) {
      setFormError("Patient gender is required.");
      return;
    }

    if (!visitingChargeText.trim() || !Number.isFinite(numericVisitingCharge)) {
      setFormError("Visiting charge is required. Enter 0 if there is no charge.");
      return;
    }

    if (fees.some((fee) => !fee.feeName.trim())) {
      setFormError("Every additional charge needs a name.");
      return;
    }

    if (
      fees.some(
        (fee) => !fee.amountText.trim() || !Number.isFinite(Number(fee.amountText)),
      )
    ) {
      setFormError("Every additional charge needs a valid BDT amount.");
      return;
    }

    const input: DoctorChamberInput = {
      patient: {
        ...patient,
        fullName: [patient.firstName.trim(), patient.lastName.trim()]
          .filter(Boolean)
          .join(" "),
      },
      visitingCharge: numericVisitingCharge,
      fees: fees.map((fee) => ({
        id: fee.id,
        feeName: fee.feeName.trim(),
        amount: Number(fee.amountText),
      })),
      notes: notes.trim(),
    };

    try {
      if (editingVisit) {
        await updateMutation.mutateAsync({ id: editingVisit.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }

      showNotification(
        isEditing
          ? "Doctor chamber visit updated successfully."
          : "Doctor chamber visit created successfully.",
        "success",
      );
      onSaved();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save chamber visit.";
      setFormError(message);
    }
  };

  const formTitle = isEditing ? "Edit Chamber Visit" : "New Chamber Visit";
  const formSubtitle = `Private chamber of ${DOCTOR_CHAMBER_CONFIG.doctorDisplayName}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={isBusy ? () => undefined : onClose}
      className="w-full max-w-6xl h-[94vh] rounded-3xl"
    >
      <ModalHeader
        icon={Stethoscope}
        iconColor="indigo"
        title={formTitle}
        subtitle={formSubtitle}
        onClose={onClose}
        isDisabled={isBusy}
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-5 md:px-7">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800">Patient Information</h3>
                <p className="text-xs text-slate-500">
                  Search a central patient record or enter a new patient.
                </p>
              </div>
            </div>

            <div className="relative mb-4">
              <label className={`${labelClassName} mb-1.5 block`} htmlFor="chamber-patient-search">
                Find existing patient
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="chamber-patient-search"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Search by patient name, phone, or email"
                  className={`${inputClassName} pl-10`}
                  disabled={isBusy}
                />
              </div>
              {patientSearch.trim().length >= 2 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {isSearching ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching patients...
                    </div>
                  ) : patientResults.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">No matching patient found. Enter new information below.</p>
                  ) : (
                    patientResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectPatient(result)}
                        className="flex w-full items-start justify-between rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">{result.fullName}</span>
                          <span className="block text-xs text-slate-500">
                            {result.phoneNumber || "No phone"} · {result.gender || "Gender not recorded"}
                          </span>
                        </span>
                        <span className="text-xs font-medium text-indigo-600">Use record</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {patient.id && (
              <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                Editing central patient record #{patient.id}. Changes here update the same patient everywhere.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5">
                <span className={labelClassName}>First name *</span>
                <input className={inputClassName} value={patient.firstName} onChange={(event) => updatePatient("firstName", event.target.value)} disabled={isBusy} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Last name</span>
                <input className={inputClassName} value={patient.lastName} onChange={(event) => updatePatient("lastName", event.target.value)} disabled={isBusy} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Gender *</span>
                <select className={inputClassName} value={patient.gender} onChange={(event) => updatePatient("gender", event.target.value)} disabled={isBusy}>
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Date of birth</span>
                <input type="date" className={inputClassName} value={patient.dateOfBirth ?? ""} onChange={(event) => updatePatient("dateOfBirth", event.target.value || null)} disabled={isBusy} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Phone number</span>
                <input type="tel" className={inputClassName} value={patient.phoneNumber} onChange={(event) => updatePatient("phoneNumber", event.target.value)} disabled={isBusy} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Email</span>
                <input type="email" className={inputClassName} value={patient.email} onChange={(event) => updatePatient("email", event.target.value)} disabled={isBusy} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClassName}>Blood group</span>
                <select className={inputClassName} value={patient.bloodGroup} onChange={(event) => updatePatient("bloodGroup", event.target.value)} disabled={isBusy}>
                  <option value="">Not recorded</option>
                  {[
                    "A+",
                    "A-",
                    "B+",
                    "B-",
                    "AB+",
                    "AB-",
                    "O+",
                    "O-",
                  ].map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <span className={labelClassName}>Address</span>
                <textarea className={`${inputClassName} min-h-11 resize-y`} value={patient.address} onChange={(event) => updatePatient("address", event.target.value)} disabled={isBusy} />
              </label>
            </div>

            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Guardian information (optional)</summary>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1.5"><span className={labelClassName}>Guardian name</span><input className={inputClassName} value={patient.guardianName} onChange={(event) => updatePatient("guardianName", event.target.value)} disabled={isBusy} /></label>
                <label className="space-y-1.5"><span className={labelClassName}>Guardian gender</span><input className={inputClassName} value={patient.guardianGender} onChange={(event) => updatePatient("guardianGender", event.target.value)} disabled={isBusy} /></label>
                <label className="space-y-1.5"><span className={labelClassName}>Guardian phone</span><input className={inputClassName} value={patient.guardianPhone} onChange={(event) => updatePatient("guardianPhone", event.target.value)} disabled={isBusy} /></label>
                <label className="space-y-1.5"><span className={labelClassName}>Guardian email</span><input className={inputClassName} value={patient.guardianEmail} onChange={(event) => updatePatient("guardianEmail", event.target.value)} disabled={isBusy} /></label>
                <label className="space-y-1.5 sm:col-span-2 lg:col-span-4"><span className={labelClassName}>Guardian address</span><textarea className={`${inputClassName} min-h-11 resize-y`} value={patient.guardianAddress} onChange={(event) => updatePatient("guardianAddress", event.target.value)} disabled={isBusy} /></label>
              </div>
            </details>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-800">Chamber and billing information</h3>
                  <p className="text-xs text-slate-500">Consulting doctor is fixed by the server.</p>
                </div>
              </div>
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800">Consulting doctor: {DOCTOR_CHAMBER_CONFIG.doctorDisplayName}</div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 bg-slate-50 px-3 py-3 text-sm sm:grid-cols-[1fr_140px_90px]">
                <span className="font-semibold text-slate-700">Charge</span>
                <span className="hidden font-semibold text-slate-700 sm:block">Amount (BDT)</span>
                <span className="text-right font-semibold text-slate-700">Status</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 text-sm sm:grid-cols-[1fr_140px_90px]">
                <div><p className="font-semibold text-slate-800">{DOCTOR_CHAMBER_CONFIG.ultrasoundName}</p><p className="text-xs text-slate-500">{DOCTOR_CHAMBER_CONFIG.ultrasoundCode}</p></div>
                <span className="font-semibold text-slate-800 sm:text-left">৳ {DOCTOR_CHAMBER_CONFIG.ultrasoundCharge.toLocaleString("en-BD")}</span>
                <span className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600"><Check className="h-4 w-4" /> Fixed</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 sm:grid-cols-[1fr_140px_90px]">
                <div><p className="font-semibold text-slate-800">Visiting charge *</p><p className="text-xs text-slate-500">Manual input; enter 0 when waived.</p></div>
                <input type="number" min="0" step="0.01" value={visitingChargeText} onChange={(event) => setVisitingChargeText(event.target.value)} className={`${inputClassName} w-32 sm:w-full`} disabled={isBusy} aria-label="Visiting charge in BDT" />
                <span className="hidden text-right text-xs font-bold text-indigo-600 sm:block">Manual</span>
              </div>

              {fees.map((fee, index) => (
                <div key={fee.id ?? `new-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 sm:grid-cols-[1fr_140px_90px_36px]">
                  <input value={fee.feeName} onChange={(event) => updateFee(index, "feeName", event.target.value)} className={inputClassName} placeholder="Charge name" disabled={isBusy} aria-label="Additional charge name" />
                  <input type="number" min="0" step="0.01" value={fee.amountText} onChange={(event) => updateFee(index, "amountText", event.target.value)} className={`${inputClassName} w-32 sm:w-full`} placeholder="0" disabled={isBusy} aria-label="Additional charge amount in BDT" />
                  <span className="hidden text-right text-xs font-bold text-indigo-600 sm:block">Manual</span>
                  <button type="button" onClick={() => setFees((current) => current.filter((_, feeIndex) => feeIndex !== index))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Remove charge" disabled={isBusy}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setFees((current) => [...current, { feeName: "", amountText: "0" }])} disabled={isBusy || fees.length >= 20} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"><CirclePlus className="h-4 w-4" /> Add another charge</button>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
              <label className="space-y-1.5"><span className={labelClassName}>Notes / report remarks</span><textarea className={`${inputClassName} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={isBusy} placeholder="Optional notes for the printed chamber form" /></label>
              <div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-slate-300">Estimated total</p><p className="mt-1 text-2xl font-bold">৳ {estimatedTotal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 text-xs text-slate-300">Fixed ultrasound + visiting charge + additional charges</p></div>
            </div>
          </section>

          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</div>}
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isDisabled={!patient.firstName.trim() || !patient.gender.trim()}
        submitText={isEditing ? "Update Chamber Visit" : "Save Chamber Visit"}
        loadingText="Saving chamber visit..."
        submitIcon={Check}
        theme="indigo"
      />
    </ModalShell>
  );
}
