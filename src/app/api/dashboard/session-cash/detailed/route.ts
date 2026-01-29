/**
 * Detailed Session Cash API Route
 * GET /api/dashboard/session-cash/detailed
 *
 * Fetches detailed cash collection data including patient names and payment details
 * for generating detailed PDF reports.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { format } from "date-fns";

interface PaymentDetail {
  paymentId: number;
  registrationId: string; // Patient registration ID (safer than receipt number)
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  serviceName: string;
  serviceType: string;
  departmentName: string;
}

interface DepartmentBreakdown {
  departmentId: number;
  departmentName: string;
  totalCollected: number;
  transactionCount: number;
}

interface ShiftDetailedSummary {
  shiftId: number;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalCollected: number;
  totalRefunded: number;
  transactionCount: number;
  departmentBreakdown: DepartmentBreakdown[];
  payments: PaymentDetail[];
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
  const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;
  const nowUTC = new Date();
  const nowBDT = new Date(nowUTC.getTime() + BDT_OFFSET_MS);

  const bdtYear = nowBDT.getUTCFullYear();
  const bdtMonth = nowBDT.getUTCMonth();
  const bdtDate = nowBDT.getUTCDate();

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  switch (datePreset) {
    case "yesterday":
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate - 1) - BDT_OFFSET_MS,
      );
      endDate = new Date(Date.UTC(bdtYear, bdtMonth, bdtDate) - BDT_OFFSET_MS);
      periodLabel = "Yesterday";
      break;
    case "lastWeek":
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
    case "lastMonth":
      startDate = new Date(
        Date.UTC(bdtYear, bdtMonth - 1, bdtDate) - BDT_OFFSET_MS,
      );
      endDate = new Date(
        Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
      );
      periodLabel = "Last Month";
      break;
    case "custom":
      // Custom date range provided via query params
      if (customStartDate && customEndDate) {
        const [startYear, startMonth, startDay] = customStartDate
          .split("-")
          .map(Number);
        const [endYear, endMonth, endDay] = customEndDate
          .split("-")
          .map(Number);

        startDate = new Date(
          Date.UTC(startYear, startMonth - 1, startDay) - BDT_OFFSET_MS,
        );
        endDate = new Date(
          Date.UTC(endYear, endMonth - 1, endDay + 1) - BDT_OFFSET_MS,
        );

        const startFormatted = `${startDay}/${startMonth}/${startYear}`;
        const endFormatted = `${endDay}/${endMonth}/${endYear}`;
        periodLabel = `${startFormatted} - ${endFormatted}`;
      } else {
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

    // 3. Calculate date range
    const { startDate, endDate, periodLabel } = getBangladeshDateRange(
      datePreset,
      customStartDate,
      customEndDate,
    );

    // 4. Get shifts with FULL payment details including patient info
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: user.staffId,
        OR: [
          { startTime: { gte: startDate, lte: endDate } },
          { isActive: true },
          {
            payments: {
              some: {
                paymentDate: { gte: startDate, lte: endDate },
              },
            },
          },
        ],
      },
      include: {
        staff: { select: { fullName: true } },
        payments: {
          where: {
            paymentDate: { gte: startDate, lte: endDate },
          },
          include: {
            patientAccount: {
              include: {
                patient: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
            paymentAllocations: {
              include: {
                serviceCharge: {
                  include: {
                    department: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { startTime: "desc" },
    });

    // 5. Process shifts with detailed payment data
    const shiftDetailedSummaries: ShiftDetailedSummary[] = [];
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
      const shiftPayments: PaymentDetail[] = [];

      for (const payment of shift.payments) {
        const paymentAmount = payment.amount.toNumber();

        // Get patient info
        const patientId = payment.patientAccount.patient.id;
        const patientName = payment.patientAccount.patient.fullName;
        const patientPhone =
          payment.patientAccount.patient.phoneNumber || undefined;

        // If no allocations, add as general payment
        if (payment.paymentAllocations.length === 0) {
          if (departmentId && departmentId !== "all") {
            continue;
          }

          shiftPayments.push({
            paymentId: payment.id,
            registrationId: `REG-${String(patientId).padStart(6, "0")}`,
            paymentDate: payment.paymentDate.toISOString(),
            amount: paymentAmount,
            paymentMethod: payment.paymentMethod,
            patientId,
            patientName,
            patientPhone,
            serviceName: "General",
            serviceType: "GENERAL",
            departmentName: "Unallocated",
          });

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

          shiftPayments.push({
            paymentId: payment.id,
            registrationId: `REG-${String(patientId).padStart(6, "0")}`,
            paymentDate: payment.paymentDate.toISOString(),
            amount: allocatedAmount,
            paymentMethod: payment.paymentMethod,
            patientId,
            patientName,
            patientPhone,
            serviceName: allocation.serviceCharge.serviceName,
            serviceType: allocation.serviceCharge.serviceType,
            departmentName: deptName,
          });

          shiftCollected += allocatedAmount;
          shiftTransactionCount += 1;

          // Update department maps
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

      // Build department breakdown
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

      // Format shift date in Bangladesh time
      const shiftDateBDT = new Date(
        shift.startTime.getTime() + 6 * 60 * 60 * 1000,
      );
      const shiftDate = format(shiftDateBDT, "MMM dd, yyyy");

      shiftDetailedSummaries.push({
        shiftId: shift.id,
        shiftDate,
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime?.toISOString(),
        isActive: shift.isActive,
        totalCollected: shiftCollected,
        totalRefunded: shiftRefunded,
        transactionCount: shiftTransactionCount,
        departmentBreakdown: shiftDepartmentBreakdown,
        payments: shiftPayments,
      });

      overallTotalCollected += shiftCollected;
      overallTotalRefunded += shiftRefunded;
      overallTransactionCount += shiftTransactionCount;
    }

    // Build overall department breakdown
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

    // periodLabel is already calculated in getBangladeshDateRange

    return NextResponse.json({
      success: true,
      data: {
        totalCollected: overallTotalCollected,
        totalRefunded: overallTotalRefunded,
        netCash: overallTotalCollected - overallTotalRefunded,
        transactionCount: overallTransactionCount,
        departmentBreakdown,
        shifts: shiftDetailedSummaries,
        staffName: user.fullName || "Staff",
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shiftsCount: shifts.length,
      },
    });
  } catch (error) {
    console.error("[Detailed Session Cash API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch detailed cash data" },
      { status: 500 },
    );
  }
}
