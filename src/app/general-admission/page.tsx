"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  UserPlus,
  Search,
  Building2,
  Stethoscope,
  Scissors,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";

// Department cards for general admission
const departments = [
  {
    id: "gynecology",
    name: "Gynecology",
    description: "Women's health & maternity care",
    icon: Stethoscope,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    hoverColor: "hover:border-pink-400",
  },
  {
    id: "surgery",
    name: "Surgery",
    description: "Surgical procedures & operations",
    icon: Scissors,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-400",
  },
  {
    id: "others",
    name: "Others",
    description: "General & miscellaneous admissions",
    icon: MoreHorizontal,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverColor: "hover:border-purple-400",
  },
];

const GeneralAdmission = React.memo(() => {
  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-2 sm:pt-4 lg:pt-2">
        <div className="space-y-5 sm:space-y-6 lg:space-y-8 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-6 pt-14 sm:pt-0">
            <PageHeader
              title="General Admission"
              subtitle="Admit patients to Gynecology, Surgery, or Other departments"
            />
          </div>

          {/* Quick Actions */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Admission Card */}
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UserPlus className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-fnh-navy-dark mb-1 group-hover:text-emerald-600 transition-colors">
                      New Admission
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Register a new patient for admission
                    </p>
                    <div className="flex items-center text-emerald-600 font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Existing Card */}
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-fnh-blue/30 transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-6 h-6 text-fnh-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-fnh-navy-dark mb-1 group-hover:text-fnh-blue transition-colors">
                      Existing Patient
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Admit an existing patient from records
                    </p>
                    <div className="flex items-center text-fnh-blue font-medium text-sm">
                      <span>Search Records</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-fnh-navy-dark">
                  Select Department
                </h2>
                <p className="text-sm text-gray-500">
                  Choose the department for admission
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {departments.map((dept) => {
                  const Icon = dept.icon;
                  return (
                    <div
                      key={dept.id}
                      className={`group relative p-5 rounded-xl border-2 ${dept.borderColor} ${dept.hoverColor} ${dept.bgColor} cursor-pointer transition-all duration-300 hover:shadow-md`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`w-14 h-14 rounded-xl ${dept.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className={`w-7 h-7 ${dept.color}`} />
                        </div>
                        <h3 className="font-semibold text-fnh-navy-dark mb-1">
                          {dept.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {dept.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Note</h3>
                  <p className="text-sm text-amber-700">
                    This page is for general hospital admissions only. For{" "}
                    <strong>Infertility</strong> and <strong>Pathology</strong>{" "}
                    departments, please use their dedicated pages accessible
                    from the sidebar or dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GeneralAdmission.displayName = "GeneralAdmission";

export default GeneralAdmission;
