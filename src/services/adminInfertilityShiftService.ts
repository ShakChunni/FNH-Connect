import { prisma } from "@/lib/prisma";

interface InfertilityShiftFilters {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: "Active" | "Closed";
  search?: string;
}

/**
 * Get shifts that have at least one Infertility-related payment allocation
 */
export async function getAdminInfertilityShifts(filters: InfertilityShiftFilters) {
  const where: any = {
    // Only shifts that have infertility payments
    payments: {
      some: {
        paymentAllocations: {
          some: {
            serviceCharge: {
              serviceType: "INFERTILITY_TEST"
            }
          }
        }
      }
    }
  };

  if (filters.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.startTime.gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS);
      where.startTime.lte = endBDT;
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

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      payments: {
        where: {
          paymentAllocations: {
            some: {
              serviceCharge: {
                serviceType: "INFERTILITY_TEST"
              }
            }
          }
        },
        include: {
          paymentAllocations: {
            where: {
              serviceCharge: {
                serviceType: "INFERTILITY_TEST"
              }
            }
          }
        }
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

  // Transform shifts to show only infertility-related totals
  // Note: variance and closing cash are physical shift-level properties, 
  // but for "Infertility Cash Tracking", we mostly care about collections.
  return shifts.map(shift => {
    let infertilityCollected = 0;
    shift.payments.forEach(payment => {
      payment.paymentAllocations.forEach(alloc => {
        infertilityCollected += Number(alloc.allocatedAmount);
      });
    });

    return {
      ...shift,
      // Overwrite general totals with department-specific ones for this view
      systemCash: infertilityCollected,
      totalCollected: infertilityCollected,
      totalRefunded: 0, // Infertility refunds logic can be added later if implemented
      variance: 0, // Variance is a full-shift property, not department-specific
      infertilityPaymentsCount: shift.payments.length
    };
  });
}

/**
 * Get detailed infertility-specific movements for a shift
 */
export async function getInfertilityShiftDetails(id: number) {
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
        where: {
          payment: {
            paymentAllocations: {
              some: {
                serviceCharge: {
                  serviceType: "INFERTILITY_TEST"
                }
              }
            }
          }
        },
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
                where: {
                  serviceCharge: {
                    serviceType: "INFERTILITY_TEST"
                  }
                },
                include: {
                  serviceCharge: {
                    include: {
                      department: {
                        select: {
                          id: true,
                          name: true,
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

  // Calculate infertility collected for this detail view
  let infertilityCollected = 0;
  // We need to fetch all payments for this shift that are infertility related
  const infertilityPayments = await prisma.payment.findMany({
    where: {
      shiftId: id,
      paymentAllocations: {
        some: {
          serviceCharge: {
            serviceType: "INFERTILITY_TEST"
          }
        }
      }
    },
    include: {
      paymentAllocations: {
        where: {
          serviceCharge: {
            serviceType: "INFERTILITY_TEST"
          }
        }
      }
    }
  });

  infertilityPayments.forEach(p => {
    p.paymentAllocations.forEach(a => {
      infertilityCollected += Number(a.allocatedAmount);
    });
  });

  return {
    ...shift,
    systemCash: infertilityCollected,
    totalCollected: infertilityCollected,
    totalRefunded: 0,
    variance: 0,
  };
}

/**
 * Summary stats for Infertility cash tracking dashboard
 */
export async function getInfertilityCashTrackingSummary(filters?: InfertilityShiftFilters) {
  const where: any = {
    payments: {
      some: {
        paymentAllocations: {
          some: {
            serviceCharge: {
              serviceType: "INFERTILITY_TEST"
            }
          }
        }
      }
    }
  };

  if (filters?.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {};
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.startTime.gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS);
      where.startTime.lte = endBDT;
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

  // Calculate total collected strictly for Infertility across these shifts
  const matchingAllocations = await prisma.paymentAllocation.findMany({
    where: {
      serviceCharge: {
        serviceType: "INFERTILITY_TEST"
      },
      payment: {
        shift: where
      }
    },
    select: {
      allocatedAmount: true,
      payment: {
        select: {
          shiftId: true
        }
      }
    }
  });

  let totalCollected = 0;
  const uniqueShifts = new Set();
  
  matchingAllocations.forEach(alloc => {
    totalCollected += Number(alloc.allocatedAmount);
    uniqueShifts.add(alloc.payment.shiftId);
  });

  // Count active shifts among those that have infertility collections
  const activeShiftsCount = await prisma.shift.count({
    where: {
      ...where,
      isActive: true
    }
  });

  return {
    totalCollected,
    totalRefunded: 0,
    activeShiftsCount,
  };
}
