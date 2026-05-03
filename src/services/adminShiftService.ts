import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ShiftFilters {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: "Active" | "Closed";
  search?: string;
  excludeSystemAdmin?: boolean;
}

/**
 * Extracts a registration reference (e.g. GYNE-25-00001, PATH-25-00001)
 * from a refund cash movement description.
 */
function extractRefundReference(description?: string | null): string | null {
  if (!description) return null;
  const match = description.match(/for\s+([A-Z]+-\d{2}-\d{5})/i);
  return match ? match[1].toUpperCase() : null;
}

export async function getAdminShifts(filters: ShiftFilters) {
  const where: any = {};

  if (filters.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    // Parse dates as Bangladesh time (UTC+6). When user selects "2026-01-02",
    // they mean midnight Bangladesh time, not midnight UTC.
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      // Start of day in Bangladesh time, converted to UTC for DB query
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.startTime.gte = startBDT;
    }
    if (filters.endDate) {
      // End of day in Bangladesh time (start of next day), converted to UTC
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      where.startTime.lt = endBDT;
    }
  }

  if (filters.status) {
    where.isActive = filters.status === "Active";
  }

  if (filters.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  // Exclude system-admin shifts if requested
  if (filters.excludeSystemAdmin) {
    where.staff = {
      ...where.staff,
      user: {
        role: {
          not: "system-admin",
        },
      },
    };
  }

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          payments: true,
          cashMovements: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return shifts;
}

export async function getShiftDetails(id: number) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
          phoneNumber: true,
        },
      },
      cashMovements: {
        orderBy: {
          timestamp: "desc",
        },
        include: {
          payment: {
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
                      department: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                      admission: {
                        select: {
                          doctor: {
                            select: {
                              id: true,
                              fullName: true,
                            },
                          },
                        },
                      },
                      pathologyTest: {
                        select: {
                          orderedBy: {
                            select: {
                              id: true,
                              fullName: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!shift) return null;

  // ── Post-process: resolve historical refunds without a linked payment ──
  const unresolvedRefs = new Set<string>();
  for (const movement of shift.cashMovements) {
    if (movement.movementType === "REFUND" && !movement.payment) {
      const ref = extractRefundReference(movement.description);
      if (ref) unresolvedRefs.add(ref);
    }
  }

  const refs = Array.from(unresolvedRefs);
  if (refs.length > 0) {
    const [admissions, pathologyTests] = await Promise.all([
      prisma.admission.findMany({
        where: { admissionNumber: { in: refs } },
        select: {
          admissionNumber: true,
          department: { select: { id: true, name: true } },
          patient: {
            select: { id: true, fullName: true, phoneNumber: true },
          },
        },
      }),
      prisma.pathologyTest.findMany({
        where: { testNumber: { in: refs }, migratedToInfertility: false },
        select: {
          testNumber: true,
          testCategory: true,
          department: { select: { id: true, name: true } },
          patient: {
            select: { id: true, fullName: true, phoneNumber: true },
          },
        },
      }),
    ]);

    const admissionMap = new Map(
      admissions.map((a) => [a.admissionNumber.toUpperCase(), a]),
    );
    const pathologyMap = new Map(
      pathologyTests.map((t) => [t.testNumber.toUpperCase(), t]),
    );

    for (const movement of shift.cashMovements) {
      if (movement.movementType !== "REFUND" || movement.payment) continue;
      const ref = extractRefundReference(movement.description);
      if (!ref) continue;

      const admission = admissionMap.get(ref);
      if (admission) {
        (movement as any)._refundSource = {
          patient: admission.patient,
          department: admission.department,
          serviceName: "Admission",
          serviceType: "ADMISSION",
          registrationId: admission.admissionNumber,
        };
        continue;
      }

      const pathology = pathologyMap.get(ref);
      if (pathology) {
        (movement as any)._refundSource = {
          patient: pathology.patient,
          department: pathology.department,
          serviceName: pathology.testCategory || "Pathology Test",
          serviceType: "PATHOLOGY_TEST",
          registrationId: pathology.testNumber,
        };
      }
    }
  }

  return shift;
}

export async function getCashTrackingSummary(filters?: ShiftFilters) {
  // Build the same filter conditions as getAdminShifts
  const where: any = {};

  if (filters?.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {};
    // Parse dates as Bangladesh time (UTC+6) - same logic as getAdminShifts
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.startTime.gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      where.startTime.lt = endBDT;
    }
  }

  if (filters?.status) {
    where.isActive = filters.status === "Active";
  }

  if (filters?.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  // Exclude system-admin shifts if requested
  if (filters?.excludeSystemAdmin) {
    where.staff = {
      ...where.staff,
      user: {
        role: {
          not: "system-admin",
        },
      },
    };
  }

  // Get shifts matching filters to calculate accurate totals
  const matchingShifts = await prisma.shift.findMany({
    where,
    select: {
      id: true,
      totalCollected: true,
      totalRefunded: true,
      isActive: true,
    },
  });

  // Calculate totals from the filtered shifts
  let totalCollected = 0;
  let totalRefunded = 0;
  let activeShiftsCount = 0;

  matchingShifts.forEach((shift) => {
    const collected = shift.totalCollected?.toNumber() || 0;
    const refunded = shift.totalRefunded?.toNumber() || 0;

    totalCollected += collected;
    totalRefunded += refunded;
    if (shift.isActive) activeShiftsCount++;
  });

  return {
    totalCollected,
    totalRefunded,
    activeShiftsCount,
  };
}
