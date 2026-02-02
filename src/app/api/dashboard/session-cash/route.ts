/**
 * Session Cash API Route
 * GET /api/dashboard/session-cash
 *
 * Fetches cash collection data filtered by:
 * - Date range (today, yesterday, lastWeek, thisMonth, lastMonth, custom)
 * - Department (all or specific departmentId)
 * - Returns shift-level breakdown when multiple shifts exist
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";

interface DepartmentBreakdown {
  departmentId: number;
  departmentName: string;
  totalCollected: number;
  transactionCount: number;
}

interface ShiftSummary {
  shiftId: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalCollected: number;
  totalRefunded: number;
  transactionCount: number;
  departmentBreakdown: DepartmentBreakdown[];
}

/**
 * Helper to calculate Bangladesh Time date ranges properly
 * Bangladesh is UTC+6, so we need to convert between BDT and UTC for DB queries
 */
function getBangladeshDateRange(
  datePreset: string,
  customStartDate?: string,
  customEndDate?: string,
): {
  startDate: Date;
  endDate: Date;
  periodLabel: string;
} {
  const BDT_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6 in milliseconds
  const nowUTC = new Date();
  const nowBDT = new Date(nowUTC.getTime() + BDT_OFFSET_MS);

  // Get Bangladesh "today" components
  const bdtYear = nowBDT.getUTCFullYear();
  const bdtMonth = nowBDT.getUTCMonth();
  const bdtDate = nowBDT.getUTCDate();

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  switch (datePreset) {
    case "yesterday":
      // Yesterday in Bangladesh time
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate - 1) - BDT_OFFSET_MS,
      );
      endDate = new Date(Date.UTC(bdtYear, bdtMonth, bdtDate) - BDT_OFFSET_MS);
      periodLabel = "Yesterday";
      break;

    case "lastWeek":
      // Last 7 days including today in Bangladesh time
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate - 6) - BDT_OFFSET_MS,
      );
      endDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
      );
      periodLabel = "Last Week";
      break;

    case "thisMonth":
      // Current calendar month in Bangladesh time (1st of month to now)
      startDate = new Date(Date.UTC(bdtYear, bdtMonth, 1) - BDT_OFFSET_MS);
      endDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
      );
      periodLabel = "This Month";
      break;

    case "lastCalendarMonth":
      // Previous calendar month (1st to last day of previous month)
      startDate = new Date(Date.UTC(bdtYear, bdtMonth - 1, 1) - BDT_OFFSET_MS);
      endDate = new Date(Date.UTC(bdtYear, bdtMonth, 1) - BDT_OFFSET_MS);
      periodLabel = "Last Month";
      break;

    case "last30Days":
      // Last 30 days including today in Bangladesh time
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate - 29) - BDT_OFFSET_MS,
      );
      endDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
      );
      periodLabel = "Last 30 Days";
      break;

    case "custom":
      // Custom date range provided via query params
      if (customStartDate && customEndDate) {
        // Parse the date strings as BDT dates (YYYY-MM-DD format)
        const [startYear, startMonth, startDay] = customStartDate
          .split("-")
          .map(Number);
        const [endYear, endMonth, endDay] = customEndDate
          .split("-")
          .map(Number);

        // Convert BDT midnight to UTC
        startDate = new Date(
          Date.UTC(startYear, startMonth - 1, startDay) - BDT_OFFSET_MS,
        );
        // End date should be the end of the day (next day midnight)
        endDate = new Date(
          Date.UTC(endYear, endMonth - 1, endDay + 1) - BDT_OFFSET_MS,
        );

        // Format period label for display
        const startFormatted = `${startDay}/${startMonth}/${startYear}`;
        const endFormatted = `${endDay}/${endMonth}/${endYear}`;
        periodLabel = `${startFormatted} - ${endFormatted}`;
      } else {
        // Fallback to today if no custom dates provided
        startDate = new Date(
          Date.UTC(bdtYear, bdtMonth, bdtDate) - BDT_OFFSET_MS,
        );
        endDate = new Date(
          Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
        );
        periodLabel = "Today";
      }
      break;

    case "today":
    default:
      // Today in Bangladesh time (midnight BDT to next midnight BDT)
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate) - BDT_OFFSET_MS,
      );
      endDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
      );
      periodLabel = "Today";
      break;
  }

  return { startDate, endDate, periodLabel };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get("datePreset") || "today";
    const departmentId = searchParams.get("departmentId");
    const customStartDate = searchParams.get("startDate") || undefined;
    const customEndDate = searchParams.get("endDate") || undefined;

    // 3. Calculate date range based on preset (in Bangladesh Time / UTC+6)
    const { startDate, endDate, periodLabel } = getBangladeshDateRange(
      datePreset,
      customStartDate,
      customEndDate,
    );

    // 4. Get all shifts for this user that are relevant:
    //    - Shifts that started during the date range
    //    - OR active shifts (regardless of when they started)
    //    - OR shifts that have payments made during the date range
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: user.staffId,
        OR: [
          // Shifts that started during the date range
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Active shifts (regardless of when they started)
          {
            isActive: true,
          },
          // Shifts that have payments made during the date range
          {
            payments: {
              some: {
                paymentDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        ],
      },
      include: {
        staff: { select: { fullName: true } },
        payments: {
          // Filter payments to only those within the date range
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            paymentAllocations: {
              include: {
                serviceCharge: {
                  include: {
                    department: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    // 5. Get all active departments for the dropdown
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // 6. Process each shift individually
    const shiftSummaries: ShiftSummary[] = [];
    let overallTotalCollected = 0;
    let overallTotalRefunded = 0;
    let overallTransactionCount = 0;
    const overallDepartmentMap = new Map<
      number,
      { name: string; collected: number; count: number }
    >();

    for (const shift of shifts) {
      let shiftCollected = 0;
      let shiftTransactionCount = 0;
      const shiftDepartmentMap = new Map<
        number,
        { name: string; collected: number; count: number }
      >();

      for (const payment of shift.payments) {
        const paymentAmount = payment.amount.toNumber();

        // If no allocations, add as general
        if (payment.paymentAllocations.length === 0) {
          if (departmentId && departmentId !== "all") {
            continue;
          }
          shiftCollected += paymentAmount;
          shiftTransactionCount += 1;
          continue;
        }

        // Process each allocation
        for (const allocation of payment.paymentAllocations) {
          const deptId = allocation.serviceCharge.department.id;
          const deptName = allocation.serviceCharge.department.name;
          const allocatedAmount = allocation.allocatedAmount.toNumber();

          // Department filter
          if (departmentId && departmentId !== "all") {
            if (deptId !== parseInt(departmentId)) {
              continue;
            }
          }

          shiftCollected += allocatedAmount;
          shiftTransactionCount += 1;

          // Update shift department map
          const existing = shiftDepartmentMap.get(deptId);
          if (existing) {
            existing.collected += allocatedAmount;
            existing.count += 1;
          } else {
            shiftDepartmentMap.set(deptId, {
              name: deptName,
              collected: allocatedAmount,
              count: 1,
            });
          }

          // Update overall department map
          const overallExisting = overallDepartmentMap.get(deptId);
          if (overallExisting) {
            overallExisting.collected += allocatedAmount;
            overallExisting.count += 1;
          } else {
            overallDepartmentMap.set(deptId, {
              name: deptName,
              collected: allocatedAmount,
              count: 1,
            });
          }
        }
      }

      const shiftRefunded = shift.totalRefunded.toNumber();

      // Build shift department breakdown
      const shiftDepartmentBreakdown: DepartmentBreakdown[] = [];
      for (const [deptId, data] of shiftDepartmentMap) {
        shiftDepartmentBreakdown.push({
          departmentId: deptId,
          departmentName: data.name,
          totalCollected: data.collected,
          transactionCount: data.count,
        });
      }
      shiftDepartmentBreakdown.sort(
        (a, b) => b.totalCollected - a.totalCollected,
      );

      // Skip shifts that have no payments within the date range
      // This prevents active shifts from appearing when they have no relevant transactions
      if (shift.payments.length === 0) {
        continue;
      }

      shiftSummaries.push({
        shiftId: shift.id,
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime?.toISOString(),
        isActive: shift.isActive,
        totalCollected: shiftCollected,
        totalRefunded: shiftRefunded,
        transactionCount: shiftTransactionCount,
        departmentBreakdown: shiftDepartmentBreakdown,
      });

      overallTotalCollected += shiftCollected;
      overallTotalRefunded += shiftRefunded;
      overallTransactionCount += shiftTransactionCount;
    }

    // 7. Build overall department breakdown
    const departmentBreakdown: DepartmentBreakdown[] = [];
    for (const [deptId, data] of overallDepartmentMap) {
      departmentBreakdown.push({
        departmentId: deptId,
        departmentName: data.name,
        totalCollected: data.collected,
        transactionCount: data.count,
      });
    }
    departmentBreakdown.sort((a, b) => b.totalCollected - a.totalCollected);

    // 8. Return response (periodLabel is already calculated in getBangladeshDateRange)
    return NextResponse.json({
      success: true,
      data: {
        totalCollected: overallTotalCollected,
        totalRefunded: overallTotalRefunded,
        netCash: overallTotalCollected - overallTotalRefunded,
        transactionCount: overallTransactionCount,
        departmentBreakdown,
        shifts: shiftSummaries,
        staffName: user.fullName || "Staff",
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shiftsCount: shifts.length,
        departments,
      },
    });
  } catch (error) {
    console.error("[Session Cash API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session cash data" },
      { status: 500 },
    );
  }
}
