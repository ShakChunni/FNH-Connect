"use client";

import React from "react";
import {
  WelcomeHeader,
  StatsGrid,
  QuickActions,
  RecentPatients,
  SessionCashTracker,
  PatientCreationStats,
} from "./components";
import { useDashboardData } from "./hooks";
import { useAuth } from "@/app/AuthContext";

const Dashboard = React.memo(() => {
  const {
    stats,
    recentPatients,
    patientCreationStats,
    isLoading,
    isError,
    refetch,
  } = useDashboardData();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Welcome Header */}
          <section>
            <WelcomeHeader isLoading={isLoading} />
          </section>

          {isError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-sm font-medium text-red-700">
                {stats
                  ? "Could not refresh the dashboard. Showing the last loaded figures."
                  : "Could not load the dashboard figures."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stats Cards Grid */}
          {(stats || !isError) && (
            <section>
              <StatsGrid stats={stats} isLoading={isLoading} />
            </section>
          )}

          {/* Quick Actions Bar */}
          <section>
            <QuickActions isLoading={isLoading} />
          </section>

          {/* Patient creation by staff */}
          {(stats || !isError) && (
            <section>
              <PatientCreationStats
                data={patientCreationStats}
                isLoading={isLoading}
              />
            </section>
          )}

          {/* Bottom Section: Recent Patients & Cash Flow / Recent Shifts */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Recent Patients - Takes 3 columns on large screens */}
            <div className="lg:col-span-3">
              {(stats || !isError) && (
                <RecentPatients
                  patients={recentPatients}
                  isLoading={isLoading}
                />
              )}
            </div>

            <div className="lg:col-span-2">
              <SessionCashTracker
                staffName={user?.fullName || "Staff"}
                isLoading={isLoading}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
