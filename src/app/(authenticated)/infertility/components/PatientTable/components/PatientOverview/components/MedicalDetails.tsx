"use client";
import React from "react";
import {
  History,
  Calendar,
  Dna,
  Baby,
  Weight,
  Maximize2 as Height,
  Activity,
  Scale,
  Clock,
} from "lucide-react";
import { InfertilityPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface MedicalDetailsProps {
  patient: InfertilityPatientData;
}

export const MedicalDetails: React.FC<MedicalDetailsProps> = ({ patient }) => {
  const getBmiCategory = (bmi: number | null) => {
    if (!bmi)
      return {
        label: "N/A",
        color: "text-gray-400",
        bg: "bg-gray-50",
        border: "border-gray-100",
      };
    if (bmi < 18.5)
      return {
        label: "Underweight",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
    if (bmi < 25)
      return {
        label: "Normal",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    if (bmi < 30)
      return {
        label: "Overweight",
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100",
      };
    return {
      label: "Obese",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    };
  };

  const bmiInfo = getBmiCategory(patient.bmi);

  const stats = [
    {
      label: "Fertility Status",
      bg: "bg-indigo-50/50",
      border: "border-indigo-100/50",
      icon: Dna,
      color: "text-indigo-600",
      items: [
        {
          label: "Type",
          value: patient.infertilityType || "Primary",
          icon: History,
        },
        {
          label: "Married",
          value: patient.yearsMarried ? `${patient.yearsMarried} Yrs` : "N/A",
          icon: Calendar,
        },
        {
          label: "Attempting",
          value: patient.yearsTrying ? `${patient.yearsTrying} Yrs` : "N/A",
          icon: Clock,
        },
        {
          label: "Gravida/Para",
          value: `${patient.gravida || "0"} / ${patient.para || "0"}`,
          icon: Baby,
        },
      ],
    },
    {
      label: "Body Composition",
      bg: "bg-emerald-50/50",
      border: "border-emerald-100/50",
      icon: Scale,
      color: "text-emerald-600",
      items: [
        {
          label: "Weight",
          value: patient.weight ? `${patient.weight} kg` : "N/A",
          icon: Weight,
        },
        {
          label: "Height",
          value: patient.height ? `${patient.height} cm` : "N/A",
          icon: Height,
        },
        { label: "BP", value: patient.bloodPressure || "N/A", icon: Activity },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* BMI Card - Prominent */}
      <div
        className={cn(
          "md:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 transition-all hover:shadow-md",
          bmiInfo.bg,
          bmiInfo.border
        )}
      >
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className={cn(
              "p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-sm",
              bmiInfo.color
            )}
          >
            <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-0.5 sm:mb-1">
              Body Mass Index
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <h4 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
                {patient.bmi ? Number(patient.bmi).toFixed(1) : "N/A"}
              </h4>
              <span
                className={cn("text-sm sm:text-lg font-black", bmiInfo.color)}
              >
                {bmiInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-8 rounded-full",
                i <=
                  (patient.bmi ? Math.min(Math.floor(patient.bmi / 7), 5) : 0)
                  ? bmiInfo.bg.replace("50", "200")
                  : "bg-white"
              )}
            />
          ))}
        </div>
      </div>

      {stats.map((group, idx) => (
        <div
          key={idx}
          className={cn(
            "bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm",
            "hover:border-indigo-100 transition-colors"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "p-1.5 sm:p-2 rounded-lg sm:rounded-xl",
                group.bg,
                group.color
              )}
            >
              <group.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h5 className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-gray-400">
              {group.label}
            </h5>
          </div>

          <div className="grid grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-3 sm:gap-x-4">
            {group.items.map((item, i) => (
              <div key={i} className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1 text-gray-400">
                  <item.icon size={10} strokeWidth={2.5} />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
                    {item.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-black text-gray-800 tracking-tight">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
