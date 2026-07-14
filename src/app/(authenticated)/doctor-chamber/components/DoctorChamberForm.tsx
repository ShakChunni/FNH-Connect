"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Calendar,
  Check,
  CirclePlus,
  Droplets,
  FileText,
  Loader2,
  Mail,
  Phone,
  Save,
  Search,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
  Wallet,
} from "lucide-react";
import BloodGroupDropdown from "@/components/form-sections/Fields/BloodGroupDropdown";
import ContactEmailInput from "@/components/form-sections/Fields/ContactEmailInput";
import ContactPhoneInput from "@/components/form-sections/Fields/ContactPhoneInput";
import DobDropdown from "@/components/form-sections/Fields/DobDropdown";
import GenderDropdown from "@/components/form-sections/Fields/GenderDropdown";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
import PatientAddressFields from "@/components/form-sections/Fields/PatientAddressFields";
import {
  backdropVariants,
  modalVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
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
  DoctorChamberDiscountType,
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

type ChamberSection = "patient" | "doctor" | "billing";

const inputClassName =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-xs font-normal text-gray-700 shadow-sm outline-none transition-all duration-300 placeholder:font-light placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-950 hover:shadow-md sm:text-sm md:h-14";

const filledInputClassName = (value: string) =>
  value.trim().length > 0
    ? inputClassName.replace("border-gray-300", "border-green-700")
    : inputClassName;

const labelClassName =
  "mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm";

const sectionHeaderClassNames: Record<
  ChamberSection,
  { wrapper: string; icon: string; text: string }
> = {
  patient: {
    wrapper: "from-indigo-50 to-indigo-100 border-indigo-200",
    icon: "text-indigo-600",
    text: "text-indigo-700",
  },
  doctor: {
    wrapper: "from-purple-50 to-purple-100 border-purple-200",
    icon: "text-purple-600",
    text: "text-purple-700",
  },
  billing: {
    wrapper: "from-green-50 to-emerald-100 border-green-200",
    icon: "text-green-600",
    text: "text-green-700",
  },
};

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

function dateValueAsDate(value: string | null): Date | null {
  if (!value) return null;

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateAsInputValue(value: Date | null): string | null {
  if (!value) return null;

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SectionHeader({ section }: { section: ChamberSection }) {
  const config = sectionHeaderClassNames[section];
  const Icon = section === "patient" ? User : section === "doctor" ? Stethoscope : Wallet;
  const title = section === "patient" ? "Patient Information" : section === "doctor" ? "Consulting Doctor" : "Chamber Billing";
  const description = section === "patient"
    ? "Search for an existing patient or add a new patient record."
    : section === "doctor"
      ? "The consulting doctor is fixed for this private chamber."
      : "Ultra Sono is optional at BDT 800. Add visiting and other charges, then apply an optional discount.";

  return (
    <div className={`mb-4 rounded-lg border bg-gradient-to-r p-4 shadow-sm transition-colors duration-300 sm:mb-5 sm:rounded-xl sm:p-5 md:mb-6 md:p-6 ${config.wrapper}`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 rounded-lg bg-white p-2 shadow-md sm:rounded-xl sm:p-3"><Icon className={config.icon} size={28} /></div>
        <div className="flex flex-col">
          <h3 className="text-base font-bold leading-tight text-gray-800 sm:text-lg md:text-xl">{title}</h3>
          <p className={`mt-1 text-[11px] font-medium leading-tight sm:text-xs ${config.text}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorChamberForm({
  isOpen,
  onClose,
  onSaved,
  editingVisit = null,
}: DoctorChamberFormProps) {
  const isEditing = Boolean(editingVisit);
  const [activeSection, setActiveSection] = useState<ChamberSection>("patient");
  const [patient, setPatient] = useState<DoctorChamberPatientInput>(() => getInitialPatient(editingVisit));
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const patientSearchInputRef = useRef<HTMLInputElement>(null);
  const debouncedPatientSearch = useDebounce(patientSearch, 250);
  const { data: patientResults = [], isFetching: isSearching } = useDoctorChamberPatientSearch(debouncedPatientSearch);
  const [visitingChargeText, setVisitingChargeText] = useState("0");
  const [includeUltrasound, setIncludeUltrasound] = useState(false);
  const [fees, setFees] = useState<FeeDraft[]>([]);
  const [discountType, setDiscountType] = useState<DoctorChamberDiscountType>("value");
  const [discountValueText, setDiscountValueText] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const createMutation = useCreateDoctorChamberVisit();
  const updateMutation = useUpdateDoctorChamberVisit();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isBusy = isSubmitting || isSearching;

  useEffect(() => {
    if (!isOpen) return;
    setActiveSection("patient");
    setPatient(getInitialPatient(editingVisit));
    setPatientSearch("");
    setIsPatientSearchOpen(false);
    setIncludeUltrasound(editingVisit ? editingVisit.ultrasoundCharge > 0 : false);
    setVisitingChargeText(editingVisit ? String(editingVisit.visitingCharge) : "0");
    setFees(editingVisit ? editingVisit.fees.map((fee) => ({ id: fee.id, feeName: fee.feeName, amountText: String(fee.amount) })) : []);
    setDiscountType(editingVisit?.discountType ?? "value");
    setDiscountValueText(editingVisit?.discountValue === null || editingVisit?.discountValue === undefined ? "" : String(editingVisit.discountValue));
    setNotes(editingVisit?.notes ?? "");
    setFormError(null);
  }, [editingVisit, isOpen]);

  useEffect(() => {
    if (isOpen) preserveLockBodyScroll();
    else preserveUnlockBodyScroll();
    return () => preserveUnlockBodyScroll();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isBusy) onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, isOpen, onClose]);

  const numericVisitingCharge = Number(visitingChargeText);
  const numericExtraCharges = fees.reduce((sum, fee) => {
    const amount = Number(fee.amountText);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const subtotal = (includeUltrasound ? DOCTOR_CHAMBER_CONFIG.ultrasoundCharge : 0) +
    (Number.isFinite(numericVisitingCharge) ? numericVisitingCharge : 0) +
    numericExtraCharges;
  const numericDiscountValue = Number(discountValueText);
  const calculatedDiscountAmount = discountValueText.trim() && Number.isFinite(numericDiscountValue)
    ? Math.min(
        discountType === "percentage" ? (subtotal * numericDiscountValue) / 100 : numericDiscountValue,
        subtotal,
      )
    : 0;
  const estimatedTotal = Math.max(0, subtotal - calculatedDiscountAmount);

  const updatePatient = <K extends keyof DoctorChamberPatientInput>(
    key: K,
    value: DoctorChamberPatientInput[K],
  ) => {
    setPatient((current) => {
      const next = { ...current, [key]: value };
      if (key === "firstName" || key === "lastName") {
        next.fullName = [next.firstName.trim(), next.lastName.trim()].filter(Boolean).join(" ");
      }
      return next;
    });
  };

  const selectPatient = (result: DoctorChamberPatientSearchResult) => {
    setPatient({ ...result });
    setPatientSearch("");
    setIsPatientSearchOpen(false);
  };

  const scrollToSection = (section: ChamberSection) => {
    setActiveSection(section);
    document.getElementById(`doctor-chamber-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateFee = (index: number, field: keyof FeeDraft, value: string) => {
    setFees((current) => current.map((fee, feeIndex) => feeIndex === index ? { ...fee, [field]: value } : fee));
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!patient.firstName.trim()) {
      setFormError("Patient first name is required.");
      scrollToSection("patient");
      return;
    }
    if (!patient.gender.trim()) {
      setFormError("Patient gender is required.");
      scrollToSection("patient");
      return;
    }
    if (!visitingChargeText.trim() || !Number.isFinite(numericVisitingCharge) || numericVisitingCharge < 0) {
      setFormError("Visiting charge is required. Enter 0 if there is no charge.");
      scrollToSection("billing");
      return;
    }
    if (fees.some((fee) => !fee.feeName.trim())) {
      setFormError("Every additional charge needs a name.");
      scrollToSection("billing");
      return;
    }
    if (fees.some((fee) => !fee.amountText.trim() || !Number.isFinite(Number(fee.amountText)) || Number(fee.amountText) < 0)) {
      setFormError("Every additional charge needs a valid non-negative BDT amount.");
      scrollToSection("billing");
      return;
    }
    if (discountValueText.trim() && (!Number.isFinite(numericDiscountValue) || numericDiscountValue < 0)) {
      setFormError("Discount must be a valid non-negative amount.");
      scrollToSection("billing");
      return;
    }
    if (discountType === "percentage" && numericDiscountValue > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      scrollToSection("billing");
      return;
    }

    const input: DoctorChamberInput = {
      patient: {
        ...patient,
        fullName: [patient.firstName.trim(), patient.lastName.trim()].filter(Boolean).join(" "),
      },
      includeUltrasound,
      visitingCharge: numericVisitingCharge,
      fees: fees.map((fee) => ({ id: fee.id, feeName: fee.feeName.trim(), amount: Number(fee.amountText) })),
      discountType: discountValueText.trim() ? discountType : null,
      discountValue: discountValueText.trim() ? numericDiscountValue : null,
      notes: notes.trim(),
    };

    try {
      if (editingVisit) await updateMutation.mutateAsync({ id: editingVisit.id, input });
      else await createMutation.mutateAsync(input);

      showNotification(isEditing ? "Doctor chamber visit updated successfully." : "Doctor chamber visit created successfully.", "success");
      onSaved();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save chamber visit.");
    }
  };

  const sections: Array<{ id: ChamberSection; label: string; icon: React.ElementType; color: string }> = [
    { id: "patient", label: "Patient Information", icon: User, color: "indigo" },
    { id: "doctor", label: "Doctor", icon: Stethoscope, color: "purple" },
    { id: "billing", label: "Billing", icon: Wallet, color: "green" },
  ];

  const tabColors: Record<string, { active: string; inactive: string }> = {
    indigo: { active: "bg-indigo-600 text-white shadow-lg", inactive: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    purple: { active: "bg-purple-600 text-white shadow-lg", inactive: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    green: { active: "bg-green-600 text-white shadow-lg", inactive: "bg-green-100 text-green-700 hover:bg-green-200" },
  };

  const formErrorMessage = useMemo(() => formError, [formError]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/70"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ isolation: "isolate", willChange: "opacity", backfaceVisibility: "hidden", perspective: 1000 }}
        >
          <motion.div
            className="popup-content flex h-[95%] w-full max-w-[95%] flex-col rounded-3xl bg-white shadow-lg sm:h-[90%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[80%]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ willChange: "transform, opacity", backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
          >
            <ModalHeader
              icon={isEditing ? Activity : Stethoscope}
              iconColor={isEditing ? "blue" : "green"}
              title={isEditing ? `Edit Chamber Visit: ${editingVisit?.visitNumber ?? ""}` : "New Patient Chamber Visit"}
              subtitle={isEditing ? `Patient: ${editingVisit?.patientFullName ?? ""}` : "Enter patient and private chamber billing details"}
              onClose={onClose}
              isDisabled={isBusy}
            >
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  const color = tabColors[section.color];
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold shadow-sm transition-all duration-300 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm ${isActive ? color.active : color.inactive} ${isActive ? "scale-105" : "hover:shadow-md"}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="hidden whitespace-nowrap sm:inline">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </ModalHeader>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                <section id="doctor-chamber-patient" className="scroll-mt-4">
                  <SectionHeader section="patient" />
                  <div className="space-y-4 sm:space-y-5">
                    <div className="relative">
                      <label htmlFor="chamber-patient-search" className={labelClassName}>Search Existing Patient</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input ref={patientSearchInputRef} id="chamber-patient-search" value={patientSearch} onFocus={() => setIsPatientSearchOpen(patientSearch.trim().length >= 2)} onChange={(event) => { setPatientSearch(event.target.value); setIsPatientSearchOpen(event.target.value.trim().length >= 2); }} placeholder="Search by patient name, phone, or email" className={`${inputClassName} pl-11`} disabled={isBusy} />
                      </div>
                      <DropdownPortal
                        isOpen={isPatientSearchOpen && patientSearch.trim().length >= 2}
                        onClose={() => setIsPatientSearchOpen(false)}
                        buttonRef={patientSearchInputRef}
                        className="max-h-64 overflow-y-auto p-1"
                      >
                          {isSearching ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Searching patients...</div>
                          ) : patientResults.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-gray-500">No matching patient found. Enter new information below.</p>
                          ) : patientResults.map((result) => (
                            <button key={result.id} type="button" onClick={() => selectPatient(result)} className="flex w-full cursor-pointer items-start justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-indigo-50">
                              <span><span className="block text-sm font-semibold text-gray-800">{result.fullName}</span><span className="block text-xs text-gray-500">{result.phoneNumber || "No phone"} · {result.gender || "Gender not recorded"}</span></span>
                              <span className="text-xs font-medium text-indigo-600">Use record</span>
                            </button>
                          ))}
                      </DropdownPortal>
                    </div>

                    {patient.id && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Editing central patient record #{patient.id}. Changes here update the same patient everywhere.</div>}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div><label className={labelClassName}>First Name<span className="text-red-500">*</span></label><input className={filledInputClassName(patient.firstName)} value={patient.firstName} onChange={(event) => updatePatient("firstName", event.target.value)} disabled={isBusy} /></div>
                      <div><label className={labelClassName}>Last Name</label><input className={filledInputClassName(patient.lastName)} value={patient.lastName} onChange={(event) => updatePatient("lastName", event.target.value)} disabled={isBusy} /></div>
                      <div>
                        <label className={labelClassName}>Gender<span className="text-red-500">*</span></label>
                        <GenderDropdown
                          value={patient.gender}
                          onSelect={(value) => updatePatient("gender", value)}
                          disabled={isBusy}
                          noDefaultSelection
                          autofilled={Boolean(patient.id)}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}><Droplets className="mr-1 inline h-3.5 w-3.5 text-red-500" />Blood Group</label>
                        <BloodGroupDropdown
                          value={patient.bloodGroup}
                          onSelect={(value) => updatePatient("bloodGroup", value)}
                          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                          disabled={isBusy}
                          inputClassName={filledInputClassName(patient.bloodGroup)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClassName}><Calendar className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />Date of Birth</label>
                        <div className={isBusy ? "pointer-events-none opacity-60" : undefined}>
                          <DobDropdown
                            value={dateValueAsDate(patient.dateOfBirth)}
                            onChange={(date) => updatePatient("dateOfBirth", dateAsInputValue(date))}
                            placeholder="Select date of birth"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClassName}><Phone className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />Phone Number</label>
                        <div className={isBusy ? "pointer-events-none opacity-60" : undefined}>
                          <ContactPhoneInput
                            value={patient.phoneNumber}
                            onChange={(value) => updatePatient("phoneNumber", value)}
                            defaultCountry="BD"
                            isAutofilled={Boolean(patient.id)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClassName}><Mail className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />Email</label>
                        <div className={isBusy ? "pointer-events-none opacity-60" : undefined}>
                          <ContactEmailInput
                            value={patient.email}
                            onChange={(value) => updatePatient("email", value)}
                            placeholder="Patient email"
                            isAutofilled={Boolean(patient.id)}
                          />
                        </div>
                      </div>
                    </div>

                    <PatientAddressFields
                      value={patient.address}
                      onChange={(value) => updatePatient("address", value)}
                      isAutofilled={Boolean(patient.id)}
                      disabled={isBusy}
                    />

                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800"><UserCheck className="h-4 w-4 text-indigo-500" />Guardian Information</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div><label className={labelClassName}>Guardian Name</label><input className={filledInputClassName(patient.guardianName)} value={patient.guardianName} onChange={(event) => updatePatient("guardianName", event.target.value)} disabled={isBusy} /></div>
                        <div>
                          <label className={labelClassName}><Phone className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />Guardian Phone</label>
                          <div className={isBusy ? "pointer-events-none opacity-60" : undefined}>
                            <ContactPhoneInput
                              value={patient.guardianPhone}
                              onChange={(value) => updatePatient("guardianPhone", value)}
                              defaultCountry="BD"
                              isAutofilled={Boolean(patient.id)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClassName}>Guardian Gender</label>
                          <GenderDropdown
                            value={patient.guardianGender}
                            onSelect={(value) => updatePatient("guardianGender", value)}
                            disabled={isBusy}
                            noDefaultSelection
                            autofilled={Boolean(patient.id)}
                          />
                        </div>
                        <div>
                          <label className={labelClassName}><Mail className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />Guardian Email</label>
                          <div className={isBusy ? "pointer-events-none opacity-60" : undefined}>
                            <ContactEmailInput
                              value={patient.guardianEmail}
                              onChange={(value) => updatePatient("guardianEmail", value)}
                              placeholder="Guardian email"
                              isAutofilled={Boolean(patient.id)}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2"><label className={labelClassName}>Guardian Address</label><textarea className={`${filledInputClassName(patient.guardianAddress)} min-h-14 resize-y`} value={patient.guardianAddress} onChange={(event) => updatePatient("guardianAddress", event.target.value)} disabled={isBusy} /></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="doctor-chamber-doctor" className="scroll-mt-4">
                  <SectionHeader section="doctor" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label className={labelClassName}>Consulting Doctor</label><input className={`${inputClassName} border-2 border-purple-200 bg-purple-50 text-purple-900`} value={DOCTOR_CHAMBER_CONFIG.doctorDisplayName} readOnly /></div>
                    <div><label className={labelClassName}>Department / Chamber</label><input className={`${inputClassName} border-2 border-purple-200 bg-purple-50 text-purple-900`} value={DOCTOR_CHAMBER_CONFIG.departmentName} readOnly /></div>
                  </div>
                </section>

                <section id="doctor-chamber-billing" className="scroll-mt-4">
                  <SectionHeader section="billing" />
                  <div className="space-y-4 sm:space-y-5">
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-3 text-sm sm:grid-cols-[1fr_140px_90px]"><span className="font-semibold text-gray-700">Charge</span><span className="hidden font-semibold text-gray-700 sm:block">Amount (BDT)</span><span className="text-right font-semibold text-gray-700">Status</span></div>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={includeUltrasound}
                        onClick={() => setIncludeUltrasound((current) => !current)}
                        disabled={isBusy}
                        className={`grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-gray-100 px-3 py-3 text-left text-sm transition-colors duration-200 sm:grid-cols-[auto_1fr_140px_90px] ${includeUltrasound ? "bg-emerald-50/70" : "bg-white hover:bg-gray-50"} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${includeUltrasound ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white text-transparent"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>
                          <span className="block font-semibold text-gray-800">{DOCTOR_CHAMBER_CONFIG.ultrasoundName}</span>
                          <span className="block text-xs text-gray-500">{DOCTOR_CHAMBER_CONFIG.ultrasoundCode} · optional</span>
                        </span>
                        <span className="font-semibold text-gray-800">৳ {DOCTOR_CHAMBER_CONFIG.ultrasoundCharge.toLocaleString("en-BD")}</span>
                        <span className={`flex items-center justify-end gap-1 text-xs font-bold ${includeUltrasound ? "text-emerald-600" : "text-gray-400"}`}>
                          {includeUltrasound ? <><Check className="h-4 w-4" /> Selected</> : "Not selected"}
                        </span>
                      </button>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-gray-100 px-3 py-3 sm:grid-cols-[1fr_140px_90px]"><div><p className="font-semibold text-gray-800">Visiting Charge<span className="text-red-500"> *</span></p><p className="text-xs text-gray-500">Manual input; enter 0 when waived.</p></div><NumberInput min="0" step="0.01" value={visitingChargeText} onChange={(event) => setVisitingChargeText(event.target.value)} className={`${inputClassName} w-32 sm:w-full`} disabled={isBusy} aria-label="Visiting charge in BDT" /><span className="hidden text-right text-xs font-bold text-indigo-600 sm:block">Manual</span></div>
                      <AnimatePresence initial={false} mode="popLayout">
                        {fees.map((fee, index) => (
                          <motion.div
                            key={fee.id ?? `new-${index}`}
                            layout
                            initial={{ opacity: 0, height: 0, y: -12 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 overflow-hidden border-b border-gray-100 px-3 py-3 sm:grid-cols-[1fr_140px_90px_36px]"
                          >
                            <input value={fee.feeName} onChange={(event) => updateFee(index, "feeName", event.target.value)} className={inputClassName} placeholder="Charge name" disabled={isBusy} aria-label="Additional charge name" />
                            <NumberInput min="0" step="0.01" value={fee.amountText} onChange={(event) => updateFee(index, "amountText", event.target.value)} className={`${inputClassName} w-32 sm:w-full`} placeholder="0" disabled={isBusy} aria-label="Additional charge amount in BDT" />
                            <span className="hidden text-right text-xs font-bold text-indigo-600 sm:block">Manual</span>
                            <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setFees((current) => current.filter((_, feeIndex) => feeIndex !== index))} className="cursor-pointer rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50" title="Remove charge" disabled={isBusy}><Trash2 className="h-4 w-4" /></motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setFees((current) => [...current, { feeName: "", amountText: "0" }])} disabled={isBusy || fees.length >= 20} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-green-300 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"><CirclePlus className="h-4 w-4" />Add another charge</motion.button>
                    <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4">
                      <label className={labelClassName}>Discount from total charge</label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <NumberInput
                          min="0"
                          max={discountType === "percentage" ? "100" : String(Math.max(0, subtotal))}
                          step="0.01"
                          value={discountValueText}
                          onChange={(event) => setDiscountValueText(event.target.value)}
                          className={`${inputClassName} flex-1`}
                          placeholder={discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                          disabled={isBusy}
                          aria-label="Discount value"
                        />
                        <div className="flex h-12 overflow-hidden rounded-lg border-2 border-gray-300 bg-white sm:h-14">
                          <button type="button" onClick={() => setDiscountType("percentage")} disabled={isBusy} className={`min-w-16 cursor-pointer px-3 text-xs font-bold transition-colors sm:text-sm ${discountType === "percentage" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>%</button>
                          <button type="button" onClick={() => setDiscountType("value")} disabled={isBusy} className={`min-w-16 cursor-pointer border-l border-gray-200 px-3 text-xs font-bold transition-colors sm:text-sm ${discountType === "value" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>৳</button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600">Patient saves: <strong className="text-green-700">৳ {calculatedDiscountAmount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                        <span className="text-gray-500">Discount is capped at the subtotal.</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]"><label><span className={labelClassName}><FileText className="mr-1 inline h-3.5 w-3.5 text-green-600" />Notes / Report Remarks</span><textarea className={`${inputClassName} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={isBusy} placeholder="Optional notes for the printed chamber form" /></label><div className="rounded-2xl bg-green-900 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-green-200">Subtotal</p><p className="mt-1 text-lg font-semibold text-green-100">৳ {subtotal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 text-xs text-green-200">Discount: − ৳ {calculatedDiscountAmount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 border-t border-green-700 pt-2 text-xs font-bold uppercase tracking-wider text-green-200">Grand Total</p><p className="mt-1 text-2xl font-bold">৳ {estimatedTotal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 text-xs text-green-200">Fixed Ultra Sono + visiting charge + additional charges − discount</p></div></div>
                  </div>
                </section>

                {formErrorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formErrorMessage}</div>}
              </div>
            </div>

            <ModalFooter
              onCancel={onClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!patient.firstName.trim() || !patient.gender.trim() || !visitingChargeText.trim()}
              cancelText="Cancel"
              submitText={isEditing ? "Update Chamber Visit" : "Save Chamber Visit"}
              loadingText="Saving..."
              submitIcon={isEditing ? Save : Check}
              theme={isEditing ? "blue" : "green"}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
