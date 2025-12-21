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
} from "lucide-react";
import { InfertilityPatientData } from "../../../../../types";

interface MedicalDetailsProps {
  patient: InfertilityPatientData;
}

interface MetricItem {
  label: string;
  value: string | React.ReactNode;
  icon: React.ElementType;
  color: string;
  capitalize?: boolean;
  highlight?: boolean;
}

interface MetricGroup {
  label: string;
  bg: string;
  border: string;
  items: MetricItem[];
}

export const MedicalDetails: React.FC<MedicalDetailsProps> = ({ patient }) => {
  const getBmiCategory = (bmi: number | null) => {
    if (!bmi) return { label: "N/A", color: "text-gray-400" };
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Normal", color: "text-green-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  const bmiInfo = getBmiCategory(patient.bmi);

  const metrics: MetricGroup[] = [
    {
      label: "Fertility Info",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      items: [
        {
          label: "Married Since",
          value: patient.yearsMarried ? `${patient.yearsMarried} Years` : "N/A",
          icon: Calendar,
          color: "text-indigo-600",
        },
        {
          label: "Attempting Since",
          value: patient.yearsTrying ? `${patient.yearsTrying} Years` : "N/A",
          icon: History,
          color: "text-indigo-600",
        },
        {
          label: "Infertility Type",
          value: patient.infertilityType || "Not Specified",
          icon: Dna,
          color: "text-indigo-600",
          capitalize: true,
        },
        {
          label: "Status",
          value: patient.status || "Active",
          icon: Activity,
          color: "text-indigo-600",
          highlight: true,
        },
      ],
    },
    {
      label: "Obstetric History",
      bg: "bg-rose-50",
      border: "border-rose-100",
      items: [
        {
          label: "Gravida",
          value: patient.gravida || "0",
          icon: Baby,
          color: "text-rose-600",
        },
        {
          label: "Para",
          value: patient.para || "0",
          icon: Scale,
          color: "text-rose-600",
        },
      ],
    },
    {
      label: "Vitals & Appearance",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      items: [
        {
          label: "Weight",
          value: patient.weight ? `${patient.weight} kg` : "N/A",
          icon: Weight,
          color: "text-emerald-600",
        },
        {
          label: "Height",
          value: patient.height ? `${patient.height} cm` : "N/A",
          icon: Height,
          color: "text-emerald-600",
        },
        {
          label: "Blood Pressure",
          value: patient.bloodPressure || "N/A",
          icon: Activity,
          color: "text-emerald-600",
        },
        {
          label: "BMI",
          value: patient.bmi ? (
            <div className="flex items-center gap-1.5">
              <span>{patient.bmi.toFixed(1)}</span>
              <span className={`text-[10px] font-bold ${bmiInfo.color}`}>
                ({bmiInfo.label})
              </span>
            </div>
          ) : (
            "N/A"
          ),
          icon: Activity,
          color: "text-emerald-600",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {metrics.map((group, idx) => (
        <div
          key={idx}
          className={`${group.bg} border ${group.border} rounded-2xl p-5`}
        >
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {group.label}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {group.items.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <item.icon
                    size={13}
                    strokeWidth={2.5}
                    className={item.color}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {item.label}
                  </span>
                </div>
                <div
                  className={`text-sm font-bold text-gray-900 ${
                    item.capitalize ? "capitalize" : ""
                  } ${item.highlight ? "text-indigo-700" : ""}`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
