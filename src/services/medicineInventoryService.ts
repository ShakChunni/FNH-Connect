/**
 * Medicine Inventory Service Layer
 * Business logic for medicine inventory management
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SessionDeviceInfo } from "@/types/auth";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ActivityLogContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

export interface MedicineFilters {
  search?: string;
  groupId?: number;
  lowStockOnly?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PurchaseFilters {
  search?: string;
  companyId?: number;
  medicineId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SaleFilters {
  search?: string;
  patientId?: number;
  medicineId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
// STATS & DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getMedicineInventoryStats(
  startDate?: Date,
  endDate?: Date,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateFrom = startDate || today;
  const dateTo = endDate || tomorrow;

  const [totalMedicines, todaysSales, todaysPurchases, lowStockItems] =
    await Promise.all([
      // Total active medicines count
      prisma.medicine.count({
        where: { isActive: true },
      }),

      // Today's sales total
      prisma.medicineSale.aggregate({
        where: {
          saleDate: {
            gte: dateFrom,
            lt: dateTo,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      // Today's purchases total
      prisma.medicinePurchase.aggregate({
        where: {
          purchaseDate: {
            gte: dateFrom,
            lt: dateTo,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      // Low stock items list (for alerts)
      prisma.medicine.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          genericName: true,
          brandName: true,
          currentStock: true,
          lowStockThreshold: true,
          group: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          currentStock: "asc",
        },
      }),
    ]);

  // Filter low stock items with proper threshold comparison
  const actualLowStockItems = lowStockItems.filter(
    (item) => item.currentStock <= item.lowStockThreshold,
  );

  // Calculate total stock value (sum of current stock × unit price from latest purchases)
  const stockValue = await prisma.$queryRaw<{ total: number }[]>`
    SELECT COALESCE(SUM(m."currentStock" * COALESCE(
      (SELECT mp."unitPrice"::numeric 
       FROM "MedicinePurchase" mp 
       WHERE mp."medicineId" = m.id 
       ORDER BY mp."purchaseDate" DESC 
       LIMIT 1), 0
    )), 0) as total
    FROM "Medicine" m
    WHERE m."isActive" = true
  `;

  return {
    stats: {
      totalMedicines,
      lowStockCount: actualLowStockItems.length,
      todaysSalesAmount: Number(todaysSales._sum.totalAmount || 0),
      todaysSalesCount: todaysSales._count,
      todaysPurchasesAmount: Number(todaysPurchases._sum.totalAmount || 0),
      todaysPurchasesCount: todaysPurchases._count,
      totalStockValue: Number(stockValue[0]?.total || 0),
    },
    lowStockItems: actualLowStockItems.slice(0, 10), // Top 10
  };
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE GROUPS
// ═══════════════════════════════════════════════════════════════

export async function getMedicineGroups(activeOnly: boolean = true) {
  return prisma.medicineGroup.findMany({
    where: activeOnly ? { isActive: true } : {},
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          medicines: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createMedicineGroup(name: string) {
  // Check for duplicate
  const existing = await prisma.medicineGroup.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("A group with this name already exists");
  }

  return prisma.medicineGroup.create({
    data: { name },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE COMPANIES (SUPPLIERS)
// ═══════════════════════════════════════════════════════════════

export async function getMedicineCompanies(
  activeOnly: boolean = true,
  search?: string,
) {
  return prisma.medicineCompany.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      phoneNumber: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createMedicineCompany(data: {
  name: string;
  address?: string;
  phoneNumber?: string;
}) {
  // Check for duplicate
  const existing = await prisma.medicineCompany.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("A company with this name already exists");
  }

  return prisma.medicineCompany.create({
    data: {
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber,
    },
    select: {
      id: true,
      name: true,
      address: true,
      phoneNumber: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MEDICINES
// ═══════════════════════════════════════════════════════════════

export async function getMedicines(filters: MedicineFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicineWhereInput = {
    ...(filters.activeOnly !== false ? { isActive: true } : {}),
    ...(filters.search
      ? {
          OR: [
            { genericName: { contains: filters.search, mode: "insensitive" } },
            { brandName: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.groupId ? { groupId: filters.groupId } : {}),
  };

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        id: true,
        genericName: true,
        brandName: true,
        strength: true,
        dosageForm: true,
        currentStock: true,
        lowStockThreshold: true,
        isActive: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ genericName: "asc" }],
      skip,
      take: limit,
    }),
    prisma.medicine.count({ where }),
  ]);

  // Filter low stock items if needed
  let filteredMedicines = medicines;
  if (filters.lowStockOnly) {
    filteredMedicines = medicines.filter(
      (m) => m.currentStock <= m.lowStockThreshold,
    );
  }

  return {
    medicines: filteredMedicines,
    total: filters.lowStockOnly ? filteredMedicines.length : total,
    page,
    limit,
  };
}

export async function createMedicine(data: {
  genericName: string;
  brandName?: string;
  groupId: number;
  strength?: string;
  dosageForm?: string;
  lowStockThreshold?: number;
}) {
  // Verify group exists
  const group = await prisma.medicineGroup.findUnique({
    where: { id: data.groupId },
  });

  if (!group) {
    throw new Error("Invalid group ID");
  }

  // Check for duplicate
  const existing = await prisma.medicine.findFirst({
    where: {
      genericName: data.genericName,
      groupId: data.groupId,
    },
  });

  if (existing) {
    throw new Error("A medicine with this name already exists in this group");
  }

  return prisma.medicine.create({
    data: {
      genericName: data.genericName,
      brandName: data.brandName,
      groupId: data.groupId,
      strength: data.strength,
      dosageForm: data.dosageForm,
      lowStockThreshold: data.lowStockThreshold || 10,
      currentStock: 0,
    },
    select: {
      id: true,
      genericName: true,
      brandName: true,
      strength: true,
      dosageForm: true,
      currentStock: true,
      lowStockThreshold: true,
      isActive: true,
      createdAt: true,
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PURCHASES
// ═══════════════════════════════════════════════════════════════

export async function getPurchases(filters: PurchaseFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicinePurchaseWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              invoiceNumber: { contains: filters.search, mode: "insensitive" },
            },
            {
              medicine: {
                genericName: { contains: filters.search, mode: "insensitive" },
              },
            },
            {
              company: {
                name: { contains: filters.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
    ...(filters.medicineId ? { medicineId: filters.medicineId } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          purchaseDate: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        }
      : {}),
  };

  const [purchases, total] = await Promise.all([
    prisma.medicinePurchase.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        purchaseDate: true,
        expiryDate: true,
        batchNumber: true,
        remainingQty: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        medicine: {
          select: {
            id: true,
            genericName: true,
            brandName: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.medicinePurchase.count({ where }),
  ]);

  return { purchases, total, page, limit };
}

export async function createPurchase(
  data: {
    invoiceNumber: string;
    companyId: number;
    medicineId: number;
    quantity: number;
    unitPrice: number;
    purchaseDate?: Date;
    expiryDate?: Date;
    batchNumber?: string;
  },
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  const totalAmount = data.quantity * data.unitPrice;

  return prisma.$transaction(async (tx) => {
    // Verify company exists
    const company = await tx.medicineCompany.findUnique({
      where: { id: data.companyId },
    });

    if (!company || !company.isActive) {
      throw new Error("Invalid or inactive company");
    }

    // Verify medicine exists
    const medicine = await tx.medicine.findUnique({
      where: { id: data.medicineId },
    });

    if (!medicine || !medicine.isActive) {
      throw new Error("Invalid or inactive medicine");
    }

    // Create purchase entry
    const purchase = await tx.medicinePurchase.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        companyId: data.companyId,
        medicineId: data.medicineId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: totalAmount,
        purchaseDate: data.purchaseDate || new Date(),
        expiryDate: data.expiryDate || null,
        batchNumber: data.batchNumber,
        remainingQty: data.quantity, // All units available initially
        createdBy: staffId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        purchaseDate: true,
        expiryDate: true,
        batchNumber: true,
        remainingQty: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        medicine: {
          select: {
            id: true,
            genericName: true,
            brandName: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update medicine stock
    await tx.medicine.update({
      where: { id: data.medicineId },
      data: {
        currentStock: {
          increment: data.quantity,
        },
      },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Purchased ${data.quantity} units of ${medicine.genericName} from ${company.name}. Invoice: ${data.invoiceNumber}`,
        entityType: "MedicinePurchase",
        entityId: purchase.id,
        timestamp: new Date(),
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
      },
    });

    return purchase;
  });
}

// ═══════════════════════════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════════════════════════

/**
 * Get the oldest purchase with remaining stock for a medicine (FIFO)
 * This is used to determine the price and company when making a sale
 */
export async function getOldestPurchaseForMedicine(medicineId: number) {
  const purchase = await prisma.medicinePurchase.findFirst({
    where: {
      medicineId: medicineId,
      remainingQty: {
        gt: 0,
      },
    },
    orderBy: {
      purchaseDate: "asc", // FIFO - oldest first
    },
    select: {
      id: true,
      remainingQty: true,
      unitPrice: true,
      batchNumber: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return purchase;
}

export async function getSales(filters: SaleFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicineSaleWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              medicine: {
                genericName: { contains: filters.search, mode: "insensitive" },
              },
            },
            {
              patient: {
                fullName: { contains: filters.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(filters.patientId ? { patientId: filters.patientId } : {}),
    ...(filters.medicineId ? { medicineId: filters.medicineId } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          saleDate: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        }
      : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.medicineSale.findMany({
      where,
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        saleDate: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        medicine: {
          select: {
            id: true,
            genericName: true,
            brandName: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        purchase: {
          select: {
            id: true,
            invoiceNumber: true,
            batchNumber: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { saleDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.medicineSale.count({ where }),
  ]);

  return { sales, total, page, limit };
}

export async function createSale(
  data: {
    patientId: number;
    medicineId: number;
    quantity: number;
    saleDate?: Date;
  },
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return prisma.$transaction(async (tx) => {
    // Verify patient exists
    const patient = await tx.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Verify medicine exists and has sufficient stock
    const medicine = await tx.medicine.findUnique({
      where: { id: data.medicineId },
    });

    if (!medicine || !medicine.isActive) {
      throw new Error("Invalid or inactive medicine");
    }

    if (medicine.currentStock < data.quantity) {
      throw new Error(
        `Insufficient stock. Available: ${medicine.currentStock}, Requested: ${data.quantity}`,
      );
    }

    // Find the oldest purchase with remaining stock (FIFO)
    const availablePurchase = await tx.medicinePurchase.findFirst({
      where: {
        medicineId: data.medicineId,
        remainingQty: {
          gt: 0,
        },
      },
      orderBy: {
        purchaseDate: "asc", // FIFO - oldest first
      },
    });

    if (!availablePurchase) {
      throw new Error("No stock available from purchases");
    }

    if (availablePurchase.remainingQty < data.quantity) {
      throw new Error(
        `Insufficient batch stock. This batch has ${availablePurchase.remainingQty} units. Consider splitting the sale.`,
      );
    }

    // Calculate total amount using purchase price
    const unitPrice = Number(availablePurchase.unitPrice);
    const totalAmount = data.quantity * unitPrice;

    // Create sale entry
    const sale = await tx.medicineSale.create({
      data: {
        patientId: data.patientId,
        medicineId: data.medicineId,
        purchaseId: availablePurchase.id,
        quantity: data.quantity,
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        saleDate: data.saleDate || new Date(),
        createdBy: staffId,
      },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        saleDate: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        medicine: {
          select: {
            id: true,
            genericName: true,
            brandName: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        purchase: {
          select: {
            id: true,
            invoiceNumber: true,
            batchNumber: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update purchase remaining quantity
    await tx.medicinePurchase.update({
      where: { id: availablePurchase.id },
      data: {
        remainingQty: {
          decrement: data.quantity,
        },
      },
    });

    // Update medicine stock
    await tx.medicine.update({
      where: { id: data.medicineId },
      data: {
        currentStock: {
          decrement: data.quantity,
        },
      },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Sold ${data.quantity} units of ${medicine.genericName} to ${patient.fullName}. Amount: BDT ${totalAmount}`,
        entityType: "MedicineSale",
        entityId: sale.id,
        timestamp: new Date(),
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
      },
    });

    return sale;
  });
}

// ═══════════════════════════════════════════════════════════════
// TRANSFORM HELPERS
// ═══════════════════════════════════════════════════════════════

export function transformMedicineForResponse(medicine: {
  id: number;
  genericName: string;
  brandName?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  group: {
    id: number;
    name: string;
  };
}) {
  return {
    id: medicine.id,
    genericName: medicine.genericName,
    brandName: medicine.brandName,
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
    currentStock: medicine.currentStock,
    lowStockThreshold: medicine.lowStockThreshold,
    isActive: medicine.isActive,
    isLowStock: medicine.currentStock <= medicine.lowStockThreshold,
    createdAt: medicine.createdAt.toISOString(),
    groupId: medicine.group.id,
    groupName: medicine.group.name,
  };
}
