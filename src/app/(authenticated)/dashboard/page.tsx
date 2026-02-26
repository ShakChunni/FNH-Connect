"use client";

import React from "react";
import {
  WelcomeHeader,
  StatsGrid,
  QuickActions,
  RecentPatients,
  SessionCashTracker,
  RecentShifts,
  PatientCreationStats,
} from "./components";
import { useDashboardData } from "./hooks";
import { useAuth } from "@/app/AuthContext";
import { isAdminRole, isSystemAdminRole } from "@/lib/roles";

const Dashboard = React.memo(() => {
  const { stats, recentPatients, patientCreationStats, isLoading } =
    useDashboardData();
  const { user } = useAuth();

  // Check if user is a normal admin (not system-admin)
  // Normal admin: role is 'admin' but NOT 'system-admin'
  const isNormalAdmin =
    user?.role && isAdminRole(user.role) && !isSystemAdminRole(user.role);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-2 sm:pt-4 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Welcome Header - extra padding on mobile to avoid header overlap */}
          <section className="pt-14 sm:pt-0">
            <WelcomeHeader isLoading={isLoading} />
          </section>

          {/* Stats Cards Grid */}
          <section>
            <StatsGrid stats={stats} isLoading={isLoading} />
          </section>

          {/* Quick Actions Bar */}
          <section>
            <QuickActions isLoading={isLoading} />
          </section>

          {/* Patient creation by staff */}
          <section>
            <PatientCreationStats
              data={patientCreationStats}
              isLoading={isLoading}
            />
          </section>

          {/* Bottom Section: Recent Patients & Cash Flow / Recent Shifts */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Recent Patients - Takes 3 columns on large screens */}
            <div className="lg:col-span-3">
              <RecentPatients patients={recentPatients} isLoading={isLoading} />
            </div>

            {/* 
              For Normal Admin: Show Recent Shifts from other users with link to cash-tracking
              For Staff/System-Admin: Show Session Cash Tracker (their own cash session)
            */}
            <div className="lg:col-span-2">
              {isNormalAdmin ? (
                <RecentShifts isLoading={isLoading} />
              ) : (
                <SessionCashTracker
                  staffName={user?.fullName || "Staff"}
                  isLoading={isLoading}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
