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
import { GENERAL_TO_INFERTILITY_TRANSFER_MARKER } from "@/lib/infertilityTransfer";
import { getDepartmentCode, getTwoDigitYear } from "@/lib/registrationNumber";
import { formatBDT, getSessionCashUTCDateRange } from "@/lib/timezone";
import {
  parseSessionCashStaffId,
  resolveSessionCashStaffContext,
} from "@/services/sessionCashAccessService";

interface PaymentDetail {
  paymentId: number;
  registrationId: string; // Service registration ID (PATH-YY-XXXXX, GYNE-YY-XXXXX, etc.)
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

interface RefundDetail {
  paymentId?: number; // Linked payment if available
  registrationId: string;
  refundDate: string;
  amount: number;
  patientId?: number;
  patientName: string;
  patientPhone?: string;
  serviceName: string;
  serviceType: string;
  departmentName: string;
  description?: string;
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
  refunds: RefundDetail[];
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
    const requestedStaffId = parseSessionCashStaffId(searchParams.get("staffId"));
    const parsedDepartmentId =
      departmentId && departmentId !== "all" ? parseInt(departmentId, 10) : null;
    const selectedDepartmentId =
      parsedDepartmentId !== null && Number.isNaN(parsedDepartmentId)
        ? null
        : parsedDepartmentId;

    const staffContext = await resolveSessionCashStaffContext(
      user,
      requestedStaffId,
    );

    if (!staffContext) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    // 3. Calculate date range
    const { startDate, endDate, periodLabel } = getSessionCashUTCDateRange(
      datePreset,
      customStartDate,
      customEndDate,
    );

    // 4. Get shifts with FULL payment details including patient info
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: staffContext.selectedStaffId,
        OR: [
          { startTime: { gte: startDate, lt: endDate } },
          { isActive: true },
          {
            payments: {
              some: {
                paymentDate: { gte: startDate, lt: endDate },
              },
            },
          },
          {
            cashMovements: {
              some: {
                movementType: "REFUND",
                timestamp: { gte: startDate, lt: endDate },
              },
            },
          },
        ],
      },
      include: {
        staff: { select: { fullName: true } },
        payments: {
          where: {
            AND: [
              {
                paymentDate: { gte: startDate, lt: endDate },
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
                    // Include admission and pathologyTest to get proper registration numbers
                    admission: { select: { admissionNumber: true } },
                    pathologyTest: { select: { testNumber: true } },
                  },
                },
              },
            },
          },
          orderBy: { paymentDate: "desc" },
        },
        // Also fetch cash movements (date-filtered) to accurately calculate refunds
        // Include payment details for patient info
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
            id: true,
            amount: true,
            movementType: true,
            description: true,
            timestamp: true,
            payment: {
              select: {
                id: true,
                paymentDate: true,
                patientAccount: {
                  select: {
                    patient: {
                      select: { id: true, fullName: true, phoneNumber: true },
                    },
                  },
                },
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

    // Build lookup maps for refund movements that don't have payment links.
    // Refund descriptions contain admission/test numbers (e.g. "Refund for GYNE-25-00001").
    const unresolvedRefundReferences = new Set<string>();
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

    const unresolvedReferences = Array.from(unresolvedRefundReferences);
    const [admissionsByNumber, pathologyTestsByNumber] = await Promise.all([
      unresolvedReferences.length > 0
        ? prisma.admission.findMany({
            where: { admissionNumber: { in: unresolvedReferences } },
            select: {
              admissionNumber: true,
              department: { select: { id: true, name: true } },
              patient: {
                select: { id: true, fullName: true, phoneNumber: true },
              },
            },
          })
        : Promise.resolve([]),
      unresolvedReferences.length > 0
        ? prisma.pathologyTest.findMany({
            where: { testNumber: { in: unresolvedReferences }, migratedToInfertility: false },
            select: {
              testNumber: true,
              testCategory: true,
              department: { select: { id: true, name: true } },
              patient: {
                select: { id: true, fullName: true, phoneNumber: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const admissionByNumber = new Map(
      admissionsByNumber.map((admission) => [
        admission.admissionNumber.toUpperCase(),
        admission,
      ]),
    );
    const pathologyByNumber = new Map(
      pathologyTestsByNumber.map((test) => [test.testNumber.toUpperCase(), test]),
    );

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

          // For unallocated payments, use a general identifier
          const year = getTwoDigitYear(new Date(payment.paymentDate));
          const generalRegId = `GEN-${year}-${String(patientId).padStart(5, "0")}`;

          shiftPayments.push({
            paymentId: payment.id,
            registrationId: generalRegId,
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
          if (selectedDepartmentId !== null && deptId !== selectedDepartmentId) {
            continue;
          }

          // Determine the registration ID based on service type
          // Priority: pathologyTest > admission > department-based fallback
          let registrationId: string;
          if (allocation.serviceCharge.pathologyTest?.testNumber) {
            // Pathology: Use testNumber (e.g., PATH-25-00001)
            registrationId = allocation.serviceCharge.pathologyTest.testNumber;
          } else if (allocation.serviceCharge.admission?.admissionNumber) {
            // Admission: Use admissionNumber (e.g., GYNE-25-00001)
            registrationId = allocation.serviceCharge.admission.admissionNumber;
          } else {
            // Fallback: Generate a department-based ID
            const deptCode = getDepartmentCode(deptName);
            const year = getTwoDigitYear(new Date(payment.paymentDate));
            registrationId = `${deptCode}-${year}-${String(patientId).padStart(5, "0")}`;
          }

          shiftPayments.push({
            paymentId: payment.id,
            registrationId,
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

      // Calculate refunds and build refund details with patient info
      const shiftRefunds: RefundDetail[] = [];
      let shiftRefunded = 0;

      for (const cm of shift.cashMovements) {
        const refundAmount = cm.amount.toNumber();

        // Build patient info from linked payment (if available)
        let patientId: number | undefined;
        let patientName = "Unknown";
        let patientPhone: string | undefined;
        let registrationId = "N/A";
        let serviceName = "Refund";
        let serviceType = "REFUND";
        let departmentName = "N/A";
        let refundDepartmentId: number | undefined;

        if (cm.payment) {
          patientId = cm.payment.patientAccount.patient.id;
          patientName = cm.payment.patientAccount.patient.fullName;
          patientPhone =
            cm.payment.patientAccount.patient.phoneNumber || undefined;

          // Derive registration ID from the payment's allocations
          if (cm.payment.paymentAllocations.length > 0) {
            const alloc = cm.payment.paymentAllocations[0];
            if (alloc.serviceCharge.pathologyTest?.testNumber) {
              registrationId = alloc.serviceCharge.pathologyTest.testNumber;
            } else if (alloc.serviceCharge.admission?.admissionNumber) {
              registrationId = alloc.serviceCharge.admission.admissionNumber;
            } else {
              const deptCode = getDepartmentCode(
                alloc.serviceCharge.department.name,
              );
              const year = getTwoDigitYear(new Date(cm.payment.paymentDate));
              registrationId = `${deptCode}-${year}-${String(patientId).padStart(5, "0")}`;
            }
            serviceName = alloc.serviceCharge.serviceName;
            serviceType = alloc.serviceCharge.serviceType;
            departmentName = alloc.serviceCharge.department.name;
            refundDepartmentId = alloc.serviceCharge.department.id;
          } else {
            const year = getTwoDigitYear(new Date(cm.payment.paymentDate));
            registrationId = `GEN-${year}-${String(patientId).padStart(5, "0")}`;
          }
        } else {
          const reference = extractRefundReference(cm.description);
          if (reference) {
            const pathology = pathologyByNumber.get(reference);
            if (pathology) {
              patientId = pathology.patient.id;
              patientName = pathology.patient.fullName;
              patientPhone = pathology.patient.phoneNumber || undefined;
              registrationId = pathology.testNumber;
              serviceName = pathology.testCategory || "Pathology Test";
              serviceType = "PATHOLOGY_TEST";
              departmentName = pathology.department.name;
              refundDepartmentId = pathology.department.id;
            } else {
              const admission = admissionByNumber.get(reference);
              if (admission) {
                patientId = admission.patient.id;
                patientName = admission.patient.fullName;
                patientPhone = admission.patient.phoneNumber || undefined;
                registrationId = admission.admissionNumber;
                serviceName = "Admission";
                serviceType = "ADMISSION";
                departmentName = admission.department.name;
                refundDepartmentId = admission.department.id;
              }
            }
          }
        }

        if (
          selectedDepartmentId !== null &&
          refundDepartmentId !== selectedDepartmentId
        ) {
          continue;
        }

        shiftRefunded += refundAmount;

        shiftRefunds.push({
          paymentId: cm.payment?.id,
          registrationId,
          refundDate: cm.timestamp.toISOString(),
          amount: refundAmount,
          patientId,
          patientName,
          patientPhone,
          serviceName,
          serviceType,
          departmentName,
          description: cm.description || undefined,
        });
      }

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

      // Skip shifts that have no payments within the date range
      // Include refund-only shifts so cancellations/refunds still appear in reports.
      if (shiftTransactionCount === 0 && shiftRefunds.length === 0) {
        continue;
      }

      const shiftDate = formatBDT(shift.startTime, "MMM dd, yyyy");

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
        refunds: shiftRefunds,
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

    return NextResponse.json({
      success: true,
      data: {
        totalCollected: overallTotalCollected,
        totalRefunded: overallTotalRefunded,
        netCash: overallTotalCollected - overallTotalRefunded,
        transactionCount: overallTransactionCount,
        departmentBreakdown,
        shifts: shiftDetailedSummaries,
        staffName: staffContext.selectedStaffName,
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shiftsCount: shiftDetailedSummaries.length,
        selectedStaffId: staffContext.selectedStaffId,
        canSelectStaff: staffContext.canSelectStaff,
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
