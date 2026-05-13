"use client";

import React from "react";
import { CheckCircle2, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EditableInvestigationSubjectType,
  InvestigationSubjectCardData,
} from "../../../utils/investigationSubjects";

interface InvestigationSubjectSelectorProps {
  value: EditableInvestigationSubjectType | "UNKNOWN";
  patientOption: InvestigationSubjectCardData;
  spouseOption: InvestigationSubjectCardData;
  onChange: (value: EditableInvestigationSubjectType) => void;
}

const cardStyles: Record<EditableInvestigationSubjectType, string> = {
  PATIENT:
    "border-indigo-200 bg-linear-to-br from-indigo-50 to-white text-indigo-950",
  SPOUSE:
    "border-rose-200 bg-linear-to-br from-rose-50 to-white text-rose-950",
};

const selectedStyles: Record<EditableInvestigationSubjectType, string> = {
  PATIENT: "ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-100/80",
  SPOUSE: "ring-2 ring-rose-500 border-rose-500 shadow-md shadow-rose-100/80",
};

const badgeStyles: Record<EditableInvestigationSubjectType, string> = {
  PATIENT: "bg-indigo-100 text-indigo-700",
  SPOUSE: "bg-rose-100 text-rose-700",
};

function SubjectIcon({
  type,
  className,
}: {
  type: EditableInvestigationSubjectType;
  className?: string;
}) {
  if (type === "PATIENT") {
    return <UserRound className={className} />;
  }

  return <Heart className={className} />;
}

function SubjectCard({
  option,
  isSelected,
  onSelect,
}: {
  option: InvestigationSubjectCardData;
  isSelected: boolean;
  onSelect: (type: EditableInvestigationSubjectType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (option.isAvailable) {
          onSelect(option.type);
        }
      }}
      disabled={!option.isAvailable}
      className={cn(
        "relative flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-200",
        cardStyles[option.type],
        isSelected && selectedStyles[option.type],
        !option.isAvailable && "cursor-not-allowed opacity-60 grayscale-[0.2]",
        option.isAvailable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              badgeStyles[option.type],
            )}
          >
            <SubjectIcon type={option.type} className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              {option.relationLabel}
            </p>
            <p className="text-sm font-bold">{option.title}</p>
          </div>
        </div>
        {isSelected ? (
          <CheckCircle2
            className={cn(
              "h-5 w-5 shrink-0",
              option.type === "PATIENT" ? "text-indigo-600" : "text-rose-600",
            )}
          />
        ) : null}
      </div>

      <p className="text-base font-semibold leading-tight">{option.displayName}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{option.detailLine}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        {option.helperText}
      </p>
    </button>
  );
}

const InvestigationSubjectSelector: React.FC<
  InvestigationSubjectSelectorProps
> = ({ value, patientOption, spouseOption, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <SubjectCard
          option={patientOption}
          isSelected={value === "PATIENT"}
          onSelect={onChange}
        />
        <SubjectCard
          option={spouseOption}
          isSelected={value === "SPOUSE"}
          onSelect={onChange}
        />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <p className="text-xs font-semibold text-emerald-900">
          If both people need tests today, save one investigation for the patient
          and add a second investigation for the spouse under the same case.
        </p>
      </div>
    </div>
  );
};

export default InvestigationSubjectSelector;
