"use client";

import React from "react";
import {
  WelcomeHeader,
  StatsGrid,
  QuickActions,
  RecentPatients,
  CashFlowTracker,
} from "./components";
import { useDashboardData } from "./hooks";

const Dashboard = React.memo(() => {
  const { stats, recentPatients, cashSession, isLoading } = useDashboardData();

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

          {/* Bottom Section: Recent Patients & Cash Flow */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Recent Patients - Takes 3 columns on large screens */}
            <div className="lg:col-span-3">
              <RecentPatients patients={recentPatients} isLoading={isLoading} />
            </div>

            {/* Cash Flow Tracker - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <CashFlowTracker session={cashSession} isLoading={isLoading} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
