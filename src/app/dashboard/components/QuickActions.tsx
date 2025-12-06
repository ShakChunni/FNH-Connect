"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Baby,
  Microscope,
  Shield,
  ClipboardList,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import { isAdminRole } from "@/lib/roles";

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  adminOnly?: boolean;
}

// Only 5 quick actions - removed User Management and Activity Logs
const allQuickActions: QuickActionItem[] = [
  {
    id: "patient-records",
    label: "Patient Records",
    description: "Search patient history",
    href: "/patient-records",
    icon: ClipboardList,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    hoverBgColor: "hover:bg-emerald-100",
  },
  {
    id: "general-admission",
    label: "General Admission",
    description: "Gyne, Surgery, Others",
    href: "/general-admission",
    icon: Building2,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    hoverBgColor: "hover:bg-teal-100",
  },
  {
    id: "infertility",
    label: "Infertility",
    description: "Fertility treatments",
    href: "/infertility",
    icon: Baby,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    hoverBgColor: "hover:bg-pink-100",
  },
  {
    id: "pathology",
    label: "Pathology",
    description: "Lab & test results",
    href: "/pathology",
    icon: Microscope,
    color: "text-fnh-blue",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
  },
  {
    id: "admin-dashboard",
    label: "Admin Dashboard",
    description: "System overview",
    href: "/admin-dashboard",
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    hoverBgColor: "hover:bg-amber-100",
    adminOnly: true,
  },
];

interface QuickActionsProps {
  isLoading?: boolean;
}

const QuickActionSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-gray-50 animate-pulse">
    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-200" />
    <div className="flex-1 space-y-1.5">
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-28 bg-gray-100 rounded" />
    </div>
  </div>
);

export const QuickActions: React.FC<QuickActionsProps> = ({
  isLoading = false,
}) => {
  const { user } = useAuth();

  const filteredActions = useMemo(() => {
    if (!user?.role) {
      return allQuickActions.filter((action) => !action.adminOnly);
    }

    if (isAdminRole(user.role)) {
      return allQuickActions;
    }

    return allQuickActions.filter((action) => !action.adminOnly);
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="mb-4">
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <QuickActionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow duration-300">
      <div className="mb-4">
        <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark">
          Quick Actions
        </h2>
        <p className="text-xs lg:text-sm text-gray-500">
          Access frequently used features
        </p>
      </div>

      {/* Responsive grid: 1 col mobile, 2 cols md, 5 cols lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`group flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 p-3 lg:p-4 rounded-xl ${action.bgColor} ${action.hoverBgColor} transition-all duration-300 hover:shadow-md`}
            >
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm shrink-0`}
              >
                <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${action.color}`} />
              </div>
              <div className="flex-1 lg:flex-none lg:text-center min-w-0">
                <span className="text-sm lg:text-sm font-semibold text-fnh-navy-dark block truncate">
                  {action.label}
                </span>
                <span className="text-xs lg:text-xs text-gray-500 block truncate">
                  {action.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
