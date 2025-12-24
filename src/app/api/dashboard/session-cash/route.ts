/**
 * Session Cash API Route
 * GET /api/dashboard/session-cash
 *
 * Fetches cash collection data filtered by:
 * - Date range (today, yesterday, lastWeek, lastMonth)
 * - Department (all or specific departmentId)
 * - Returns shift-level breakdown when multiple shifts exist
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";

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

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get("datePreset") || "today";
    const departmentId = searchParams.get("departmentId");

    // 3. Calculate date range based on preset
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (datePreset) {
      case "yesterday":
        const yesterday = subDays(now, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      case "lastWeek":
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        break;
      case "lastMonth":
        startDate = startOfDay(subMonths(now, 1));
        endDate = endOfDay(now);
        break;
      case "today":
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
    }

    // 4. Get all shifts for this user in the date range
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: user.staffId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        staff: { select: { fullName: true } },
        payments: {
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
        (a, b) => b.totalCollected - a.totalCollected
      );

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

    // 8. Build period label
    let periodLabel: string;
    switch (datePreset) {
      case "yesterday":
        periodLabel = "Yesterday";
        break;
      case "lastWeek":
        periodLabel = "Last Week";
        break;
      case "lastMonth":
        periodLabel = "Last Month";
        break;
      default:
        periodLabel = "Today";
    }

    // 9. Return response
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
      { status: 500 }
    );
  }
}
