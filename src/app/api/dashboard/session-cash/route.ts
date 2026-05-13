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
import { getSessionCashUTCDateRange } from "@/lib/timezone";
import { GENERAL_TO_INFERTILITY_TRANSFER_MARKER } from "@/lib/infertilityTransfer";

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

function extractRefundReference(description?: string | null): string | null {
  if (!description) {
    return null;
  }

  const match = description.match(/for\s+([A-Z]+-\d{2}-\d{5})/i);
  if (!match) {
    return null;
  }

  return match[1].toUpperCase();
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
    const parsedDepartmentId =
      departmentId && departmentId !== "all" ? parseInt(departmentId, 10) : null;
    const selectedDepartmentId =
      parsedDepartmentId !== null && Number.isNaN(parsedDepartmentId)
        ? null
        : parsedDepartmentId;

    // 3. Calculate date range based on preset (in Bangladesh Time / UTC+6)
    const { startDate, endDate, periodLabel } = getSessionCashUTCDateRange(
      datePreset,
      customStartDate,
      customEndDate,
    );

    // 4. Get all shifts for this user that are relevant:
    //    - Shifts that started during the date range
    //    - OR active shifts (regardless of when they started)
    //    - OR shifts that have payments made during the date range
    //    - OR shifts that have refunds made during the date range
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: user.staffId,
        OR: [
          // Shifts that started during the date range
          {
            startTime: {
              gte: startDate,
              lt: endDate,
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
                  lt: endDate,
                },
              },
            },
          },
          // Shifts that have refunds made during the date range
          {
            cashMovements: {
              some: {
                movementType: "REFUND",
                timestamp: {
                  gte: startDate,
                  lt: endDate,
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
            AND: [
              {
                paymentDate: {
                  gte: startDate,
                  lt: endDate,
                },
              },
              {
                OR: [
                  { notes: null },
                  {
                    notes: {
                      not: {
                        contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER,
                      },
                    },
                  },
                ],
              },
            ],
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
        // Also fetch cash movements (date-filtered) to accurately calculate refunds
        cashMovements: {
          where: {
            AND: [
              {
                timestamp: {
                  gte: startDate,
                  lt: endDate,
                },
              },
              {
                movementType: "REFUND",
              },
              {
                OR: [
                  { description: null },
                  {
                    description: {
                      not: {
                        contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER,
                      },
                    },
                  },
                ],
              },
            ],
          },
          select: {
            amount: true,
            movementType: true,
            description: true,
            payment: {
              select: {
                paymentAllocations: {
                  include: {
                    serviceCharge: {
                      include: {
                        department: { select: { id: true, name: true } },
                        admission: { select: { admissionNumber: true } },
                        pathologyTest: { select: { testNumber: true } },
                      },
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

    const unresolvedRefundReferences = new Set<string>();
    if (selectedDepartmentId !== null) {
      for (const shift of shifts) {
        for (const movement of shift.cashMovements) {
          if (movement.payment) {
            continue;
          }

          const reference = extractRefundReference(movement.description);
          if (reference) {
            unresolvedRefundReferences.add(reference);
          }
        }
      }
    }

    const unresolvedReferences = Array.from(unresolvedRefundReferences);
    const [admissionsByNumber, pathologyTestsByNumber] = await Promise.all([
      selectedDepartmentId !== null && unresolvedReferences.length > 0
        ? prisma.admission.findMany({
            where: { admissionNumber: { in: unresolvedReferences } },
            select: {
              admissionNumber: true,
              department: { select: { id: true } },
            },
          })
        : Promise.resolve([]),
      selectedDepartmentId !== null && unresolvedReferences.length > 0
        ? prisma.pathologyTest.findMany({
            where: { testNumber: { in: unresolvedReferences }, migratedToInfertility: false },
            select: {
              testNumber: true,
              department: { select: { id: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const admissionByNumber = new Map(
      admissionsByNumber.map((admission) => [
        admission.admissionNumber.toUpperCase(),
        admission.department.id,
      ]),
    );
    const pathologyByNumber = new Map(
      pathologyTestsByNumber.map((test) => [
        test.testNumber.toUpperCase(),
        test.department.id,
      ]),
    );

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
          if (selectedDepartmentId !== null && deptId !== selectedDepartmentId) {
            continue;
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

      // Calculate refunds from date-filtered cash movements.
      // For department-scoped queries, include only refunds linked to that department.
      let shiftRefunded = 0;
      for (const refundMovement of shift.cashMovements) {
        const refundAmount = refundMovement.amount.toNumber();

        if (selectedDepartmentId === null) {
          shiftRefunded += refundAmount;
          continue;
        }

        let refundDepartmentId: number | undefined;
        const firstAllocation =
          refundMovement.payment?.paymentAllocations?.[0]?.serviceCharge;

        if (firstAllocation) {
          refundDepartmentId = firstAllocation.department.id;
        } else {
          const reference = extractRefundReference(refundMovement.description);
          if (reference) {
            refundDepartmentId =
              pathologyByNumber.get(reference) ?? admissionByNumber.get(reference);
          }
        }

        if (refundDepartmentId === selectedDepartmentId) {
          shiftRefunded += refundAmount;
        }
      }

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

      // Include refund-only shifts so cancellation/refund activity is not hidden.
      if (shiftTransactionCount === 0 && shiftRefunded === 0) {
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

    // 8. Return response
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
        shiftsCount: shiftSummaries.length,
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
