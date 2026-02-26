/**
 * Dashboard API Route (RESTful - Single endpoint for all dashboard data)
 * GET /api/dashboard
 *
 * Returns all dashboard data in a single request:
 * - stats: Dashboard statistics
 * - recentPatients: Recently admitted patients
 * - cashSession: Current staff's active cash shift
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const recentPatientsLimit = parseInt(
      searchParams.get("recentLimit") || "5",
    );
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 3. Get today's date range in Bangladesh time (UTC+6)
    // The server runs in UTC, so we need to calculate Bangladesh "today" properly
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6 in milliseconds
    const nowUTC = new Date();
    const nowBDT = new Date(nowUTC.getTime() + BDT_OFFSET_MS);

    // Get start of day in Bangladesh time, then convert back to UTC for DB query
    const bdtYear = nowBDT.getUTCFullYear();
    const bdtMonth = nowBDT.getUTCMonth();
    const bdtDate = nowBDT.getUTCDate();

    // Start of Bangladesh "today" in UTC (midnight BDT = 6 PM previous day UTC)
    const startOfDay = new Date(
      Date.UTC(bdtYear, bdtMonth, bdtDate) - BDT_OFFSET_MS,
    );
    // End of Bangladesh "today" in UTC (midnight next day BDT)
    const endOfDay = new Date(
      Date.UTC(bdtYear, bdtMonth, bdtDate + 1) - BDT_OFFSET_MS,
    );

    // 4. Parallel queries for ALL dashboard data
    const [
      // General Admission counts
      generalActivePatients,
      generalAdmittedToday,
      generalDischargedToday,
      generalDischargedAllTime,

      // Pathology counts
      pathologyCompletedToday,
      pathologyCompletedAllTime,

      // Recent data from all sources
      recentAdmissions,
      recentPathology,

      // Cash session for current user
      activeShift,

      // Patient creation stats by staff
      patientCreatedAllTime,
      patientCreatedLast30Days,
      patientCreatedLast7Days,
    ] = await Promise.all([
      // Stats: General active patients
      prisma.admission.count({
        where: { isDischarged: false },
      }),

      // Stats: General admitted today
      prisma.admission.count({
        where: {
          dateAdmitted: { gte: startOfDay, lt: endOfDay },
        },
      }),

      // Stats: General discharged today
      prisma.admission.count({
        where: {
          isDischarged: true,
          dateDischarged: { gte: startOfDay, lt: endOfDay },
        },
      }),

      // Stats: General discharged all time
      prisma.admission.count({
        where: { isDischarged: true },
      }),

      // Stats: Pathology completed today
      prisma.pathologyTest.count({
        where: {
          isCompleted: true,
          reportDate: { gte: startOfDay, lt: endOfDay },
        },
      }),

      // Stats: Pathology completed all time
      prisma.pathologyTest.count({
        where: { isCompleted: true },
      }),

      // Recent: Admissions
      prisma.admission.findMany({
        take: recentPatientsLimit,
        orderBy: { dateAdmitted: "desc" },
        select: {
          id: true,
          patientId: true,
          dateAdmitted: true,
          dateDischarged: true,
          isDischarged: true,
          seatNumber: true,
          ward: true,
          paidAmount: true,
          patient: { select: { fullName: true, phoneNumber: true } },
          department: { select: { name: true } },
        },
      }),

      // Recent: Pathology
      prisma.pathologyTest.findMany({
        take: recentPatientsLimit,
        orderBy: { testDate: "desc" },
        select: {
          id: true,
          patientId: true,
          testDate: true,
          isCompleted: true,
          testCategory: true,
          patient: { select: { fullName: true, phoneNumber: true } },
        },
      }),

      // Current user's active shift
      prisma.shift.findFirst({
        where: {
          staffId: user.staffId,
          isActive: true,
        },
        include: {
          staff: { select: { fullName: true } },
          payments: { select: { amount: true } },
          cashMovements: { select: { amount: true, movementType: true } },
        },
      }),

      prisma.patient.groupBy({
        by: ["createdBy"],
        _count: {
          _all: true,
        },
      }),

      prisma.patient.groupBy({
        by: ["createdBy"],
        where: {
          createdAt: {
            gte: last30Days,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.patient.groupBy({
        by: ["createdBy"],
        where: {
          createdAt: {
            gte: last7Days,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const staffIds = Array.from(
      new Set([
        ...patientCreatedAllTime.map((item) => item.createdBy),
        ...patientCreatedLast30Days.map((item) => item.createdBy),
        ...patientCreatedLast7Days.map((item) => item.createdBy),
      ]),
    );

    const staffList = staffIds.length
      ? await prisma.staff.findMany({
          where: {
            id: {
              in: staffIds,
            },
          },
          select: {
            id: true,
            fullName: true,
          },
        })
      : [];

    const staffNameMap = new Map(
      staffList.map((staff) => [staff.id, staff.fullName]),
    );
    const allTimeMap = new Map(
      patientCreatedAllTime.map((item) => [item.createdBy, item._count._all]),
    );
    const last30DaysMap = new Map(
      patientCreatedLast30Days.map((item) => [
        item.createdBy,
        item._count._all,
      ]),
    );
    const last7DaysMap = new Map(
      patientCreatedLast7Days.map((item) => [item.createdBy, item._count._all]),
    );

    const patientCreationStats = staffIds
      .map((staffId) => ({
        staffId,
        staffName: staffNameMap.get(staffId) || `Staff #${staffId}`,
        allTime: allTimeMap.get(staffId) || 0,
        last30Days: last30DaysMap.get(staffId) || 0,
        last7Days: last7DaysMap.get(staffId) || 0,
      }))
      .sort((a, b) => b.allTime - a.allTime);

    // 5. Calculate stats
    const totalActivePatients = generalActivePatients;
    const patientsAdmittedToday = generalAdmittedToday;
    const totalBedCapacity = 60;
    const occupancyRate = Math.round(
      (generalActivePatients / totalBedCapacity) * 100,
    );

    // 6. Transform recent patients
    const recentPatients = [
      ...recentAdmissions.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        name: a.patient.fullName,
        phoneNumber: a.patient.phoneNumber,
        admissionDate: a.dateAdmitted.toISOString(),
        department: a.department.name,
        departmentType: "general" as const,
        status: a.isDischarged
          ? ("discharged" as const)
          : a.paidAmount.toNumber() === 0
            ? ("pending" as const)
            : ("admitted" as const),
        roomNumber: a.seatNumber
          ? `${a.ward || ""}${a.seatNumber}`.trim()
          : undefined,
      })),
      ...recentPathology.map((t) => ({
        id: t.id + 20000,
        patientId: t.patientId,
        name: t.patient.fullName,
        phoneNumber: t.patient.phoneNumber,
        admissionDate: t.testDate.toISOString(),
        department: "Pathology",
        departmentType: "pathology" as const,
        status: t.isCompleted ? ("discharged" as const) : ("pending" as const),
        roomNumber: undefined,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.admissionDate).getTime() -
          new Date(a.admissionDate).getTime(),
      )
      .slice(0, recentPatientsLimit);

    // 7. Transform cash session
    let cashSession = null;
    if (activeShift) {
      const totalCollected = activeShift.totalCollected.toNumber();
      const totalRefunded = activeShift.totalRefunded.toNumber();
      const openingCash = activeShift.openingCash.toNumber();
      // System cash should match this calculation if logic is correct
      const currentCash = openingCash + totalCollected - totalRefunded;

      cashSession = {
        shiftId: activeShift.id,
        staffId: activeShift.staffId,
        staffName: activeShift.staff.fullName,
        startTime: activeShift.startTime.toISOString(),
        endTime: activeShift.endTime?.toISOString(),
        openingCash,
        currentCash,
        systemCash: activeShift.systemCash.toNumber(),
        totalCollected,
        totalRefunded,
        paymentsCount: activeShift.payments.length,
        variance: activeShift.variance.toNumber(),
        isActive: activeShift.isActive,
      };
    }

    // 8. Return all dashboard data in one response
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalActivePatients,
          patientsAdmittedToday,
          dischargedToday: generalDischargedToday,
          dischargedAllTime: generalDischargedAllTime,
          occupancyRate: Math.min(occupancyRate, 100),
          pathologyDoneToday: pathologyCompletedToday,
          pathologyDoneAllTime: pathologyCompletedAllTime,
        },
        recentPatients,
        cashSession,
        patientCreationStats,
      },
    });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
