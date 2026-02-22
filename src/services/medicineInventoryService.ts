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
  startDate?: string;
  endDate?: string;
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

export interface GroupFilters {
  activeOnly?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CompanyFilters {
  activeOnly?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InventoryActivityFilters {
  search?: string;
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
  const hasDateFilter = Boolean(startDate || endDate);

  const salesDateFilter =
    startDate || endDate
      ? {
          saleDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

  const purchasesDateFilter =
    startDate || endDate
      ? {
          purchaseDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

  let scopedMedicineIds: number[] | undefined;

  if (hasDateFilter) {
    const [purchaseMedicineIds, saleMedicineIds] = await Promise.all([
      prisma.medicinePurchase.findMany({
        where: purchasesDateFilter,
        select: { medicineId: true },
        distinct: ["medicineId"],
      }),
      prisma.medicineSale.findMany({
        where: salesDateFilter,
        select: { medicineId: true },
        distinct: ["medicineId"],
      }),
    ]);

    scopedMedicineIds = Array.from(
      new Set([
        ...purchaseMedicineIds.map((item) => item.medicineId),
        ...saleMedicineIds.map((item) => item.medicineId),
      ]),
    );
  }

  const medicineScopeWhere: Prisma.MedicineWhereInput = {
    isActive: true,
    ...(hasDateFilter
      ? {
          id: {
            in:
              scopedMedicineIds && scopedMedicineIds.length > 0
                ? scopedMedicineIds
                : [-1],
          },
        }
      : {}),
  };

  const [totalMedicines, totalSales, totalPurchases, lowStockItems] =
    await Promise.all([
      // Total medicines in scope (all active by default, date-scoped when range is selected)
      prisma.medicine.count({
        where: medicineScopeWhere,
      }),

      // Total sales (optionally date-filtered)
      prisma.medicineSale.aggregate({
        where: salesDateFilter,
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      // Total purchases (optionally date-filtered)
      prisma.medicinePurchase.aggregate({
        where: purchasesDateFilter,
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      // Low stock items list (for alerts)
      prisma.medicine.findMany({
        where: medicineScopeWhere,
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

  // Calculate stock value for the current scope
  let stockValueTotal = 0;

  if (!(hasDateFilter && scopedMedicineIds && scopedMedicineIds.length === 0)) {
    const stockScopeSql =
      hasDateFilter && scopedMedicineIds
        ? Prisma.sql`AND m.id IN (${Prisma.join(scopedMedicineIds)})`
        : Prisma.empty;

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
      ${stockScopeSql}
    `;

    stockValueTotal = Number(stockValue[0]?.total || 0);
  }

  return {
    stats: {
      totalMedicines,
      lowStockCount: actualLowStockItems.length,
      totalSalesAmount: Number(totalSales._sum.totalAmount || 0),
      totalSalesCount: totalSales._count,
      totalPurchasesAmount: Number(totalPurchases._sum.totalAmount || 0),
      totalPurchasesCount: totalPurchases._count,
      totalStockValue: stockValueTotal,
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

export async function updateMedicineGroup(groupId: number, name: string) {
  const group = await prisma.medicineGroup.findUnique({
    where: { id: groupId },
  });

  if (!group || !group.isActive) {
    throw new Error("Invalid or inactive group");
  }

  const duplicate = await prisma.medicineGroup.findFirst({
    where: {
      id: { not: groupId },
      name,
    },
  });

  if (duplicate) {
    throw new Error("A group with this name already exists");
  }

  return prisma.medicineGroup.update({
    where: { id: groupId },
    data: { name },
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

export async function updateMedicineCompany(
  companyId: number,
  data: {
    name: string;
    address?: string;
    phoneNumber?: string;
  },
) {
  const company = await prisma.medicineCompany.findUnique({
    where: { id: companyId },
  });

  if (!company || !company.isActive) {
    throw new Error("Invalid or inactive company");
  }

  const duplicate = await prisma.medicineCompany.findFirst({
    where: {
      id: { not: companyId },
      name: data.name,
    },
  });

  if (duplicate) {
    throw new Error("A company with this name already exists");
  }

  return prisma.medicineCompany.update({
    where: { id: companyId },
    data: {
      name: data.name,
      address: data.address || null,
      phoneNumber: data.phoneNumber || null,
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
  });
}

// ═══════════════════════════════════════════════════════════════
// MEDICINES
// ═══════════════════════════════════════════════════════════════

export async function getMedicines(filters: MedicineFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
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
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        }
      : {}),
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
        defaultSalePrice: true,
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
  defaultSalePrice?: number;
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
      defaultSalePrice: data.defaultSalePrice || 0,
      lowStockThreshold: data.lowStockThreshold || 10,
      currentStock: 0,
    },
    select: {
      id: true,
      genericName: true,
      brandName: true,
      strength: true,
      dosageForm: true,
      defaultSalePrice: true,
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

export async function updateMedicine(
  medicineId: number,
  data: {
    genericName: string;
    brandName?: string;
    groupId: number;
    strength?: string;
    dosageForm?: string;
    defaultSalePrice?: number;
    lowStockThreshold?: number;
  },
) {
  const existingMedicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!existingMedicine || !existingMedicine.isActive) {
    throw new Error("Invalid or inactive medicine");
  }

  const group = await prisma.medicineGroup.findUnique({
    where: { id: data.groupId },
  });

  if (!group || !group.isActive) {
    throw new Error("Invalid group ID");
  }

  const duplicate = await prisma.medicine.findFirst({
    where: {
      id: { not: medicineId },
      genericName: data.genericName,
      groupId: data.groupId,
    },
  });

  if (duplicate) {
    throw new Error("A medicine with this name already exists in this group");
  }

  return prisma.medicine.update({
    where: { id: medicineId },
    data: {
      genericName: data.genericName,
      brandName: data.brandName || null,
      groupId: data.groupId,
      strength: data.strength || null,
      dosageForm: data.dosageForm || null,
      defaultSalePrice: data.defaultSalePrice || 0,
      lowStockThreshold: data.lowStockThreshold ?? 10,
    },
    select: {
      id: true,
      genericName: true,
      brandName: true,
      strength: true,
      dosageForm: true,
      defaultSalePrice: true,
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
  const limit = filters.limit || 20;
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
  const now = new Date();
  const effectivePurchaseDate = data.purchaseDate || now;

  if (effectivePurchaseDate > now) {
    throw new Error("Purchase date cannot be in the future");
  }

  if (data.expiryDate && data.expiryDate < effectivePurchaseDate) {
    throw new Error("Expiry date cannot be earlier than purchase date");
  }

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
        purchaseDate: effectivePurchaseDate,
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
  const [oldestWithStock, firstPurchase] = await Promise.all([
    prisma.medicinePurchase.findFirst({
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
    }),
    prisma.medicinePurchase.findFirst({
      where: {
        medicineId: medicineId,
      },
      orderBy: {
        purchaseDate: "asc",
      },
      select: {
        purchaseDate: true,
      },
    }),
  ]);

  if (!oldestWithStock) {
    return null;
  }

  return {
    ...oldestWithStock,
    firstPurchaseDate: firstPurchase?.purchaseDate || null,
  };
}

export async function getSales(filters: SaleFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
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
    unitPrice?: number; // Optional override — defaults to FIFO batch price
    saleDate?: Date;
  },
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const effectiveSaleDate = data.saleDate || now;

    if (effectiveSaleDate > now) {
      throw new Error("Sale date cannot be in the future");
    }

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

    const firstPurchase = await tx.medicinePurchase.findFirst({
      where: {
        medicineId: data.medicineId,
      },
      orderBy: {
        purchaseDate: "asc",
      },
      select: {
        purchaseDate: true,
      },
    });

    if (!firstPurchase) {
      throw new Error("No stock purchase history found for this medicine");
    }

    if (effectiveSaleDate < firstPurchase.purchaseDate) {
      throw new Error(
        `Sale date cannot be before first stock purchase date (${firstPurchase.purchaseDate.toISOString()})`,
      );
    }

    // Find ALL purchase batches with remaining stock, ordered oldest first (FIFO)
    const availablePurchases = await tx.medicinePurchase.findMany({
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

    if (availablePurchases.length === 0) {
      throw new Error("No stock available from purchases");
    }

    // Calculate total available across all batches
    const totalAvailable = availablePurchases.reduce(
      (sum, p) => sum + p.remainingQty,
      0,
    );

    if (totalAvailable < data.quantity) {
      throw new Error(
        `Insufficient stock across all batches. Available: ${totalAvailable}, Requested: ${data.quantity}`,
      );
    }

    // Consume stock across batches using FIFO
    let remainingToSell = data.quantity;
    const saleRecords = [];
    let overallTotalAmount = 0;

    for (const purchase of availablePurchases) {
      if (remainingToSell <= 0) break;

      const qtyFromThisBatch = Math.min(remainingToSell, purchase.remainingQty);
      const batchUnitPrice =
        data.unitPrice !== undefined
          ? data.unitPrice
          : Number(purchase.unitPrice);
      const batchTotalAmount = qtyFromThisBatch * batchUnitPrice;

      // Create sale entry for this batch portion
      const sale = await tx.medicineSale.create({
        data: {
          patientId: data.patientId,
          medicineId: data.medicineId,
          purchaseId: purchase.id,
          quantity: qtyFromThisBatch,
          unitPrice: batchUnitPrice,
          totalAmount: batchTotalAmount,
          saleDate: effectiveSaleDate,
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

      // Update this purchase batch's remaining quantity
      await tx.medicinePurchase.update({
        where: { id: purchase.id },
        data: {
          remainingQty: {
            decrement: qtyFromThisBatch,
          },
        },
      });

      saleRecords.push(sale);
      overallTotalAmount += batchTotalAmount;
      remainingToSell -= qtyFromThisBatch;
    }

    // Update medicine stock (total quantity sold)
    await tx.medicine.update({
      where: { id: data.medicineId },
      data: {
        currentStock: {
          decrement: data.quantity,
        },
      },
    });

    // Log activity
    const primarySale = saleRecords[0];
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Sold ${data.quantity} units of ${medicine.genericName} to ${patient.fullName}. Amount: BDT ${overallTotalAmount}${saleRecords.length > 1 ? ` (across ${saleRecords.length} batches)` : ""}`,
        entityType: "MedicineSale",
        entityId: primarySale.id,
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

    // Return the first sale record for backward compatibility
    // The primary sale captures the main transaction details
    return primarySale;
  });
}

// ═══════════════════════════════════════════════════════════════
// PAGINATED GROUPS & COMPANIES
// ═══════════════════════════════════════════════════════════════

export async function getPaginatedMedicineGroups(filters: GroupFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicineGroupWhereInput = {
    ...(filters.activeOnly !== false ? { isActive: true } : {}),
    ...(filters.search
      ? {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        }
      : {}),
  };

  const [groups, total] = await Promise.all([
    prisma.medicineGroup.findMany({
      where,
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
      skip,
      take: limit,
    }),
    prisma.medicineGroup.count({ where }),
  ]);

  return { groups, total, page, limit };
}

export async function getPaginatedMedicineCompanies(filters: CompanyFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicineCompanyWhereInput = {
    ...(filters.activeOnly !== false ? { isActive: true } : {}),
    ...(filters.search
      ? {
          OR: [
            {
              name: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              phoneNumber: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        }
      : {}),
  };

  const [companies, total] = await Promise.all([
    prisma.medicineCompany.findMany({
      where,
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
      skip,
      take: limit,
    }),
    prisma.medicineCompany.count({ where }),
  ]);

  return { companies, total, page, limit };
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY ACTIVITY (PURCHASES + SALES)
// ═══════════════════════════════════════════════════════════════

export async function getInventoryActivity(filters: InventoryActivityFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const searchTerm = filters.search?.trim();
  const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

  const purchaseConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
  if (searchTerm) {
    const likeSearch = `%${searchTerm}%`;
    purchaseConditions.push(
      Prisma.sql`(
        mp."invoiceNumber" ILIKE ${likeSearch}
        OR m."genericName" ILIKE ${likeSearch}
        OR mc."name" ILIKE ${likeSearch}
      )`,
    );
  }
  if (startDate) {
    purchaseConditions.push(Prisma.sql`mp."purchaseDate" >= ${startDate}`);
  }
  if (endDate) {
    purchaseConditions.push(Prisma.sql`mp."purchaseDate" <= ${endDate}`);
  }

  const saleConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
  if (searchTerm) {
    const likeSearch = `%${searchTerm}%`;
    saleConditions.push(
      Prisma.sql`(
        m."genericName" ILIKE ${likeSearch}
        OR p."fullName" ILIKE ${likeSearch}
        OR mc."name" ILIKE ${likeSearch}
      )`,
    );
  }
  if (startDate) {
    saleConditions.push(Prisma.sql`ms."saleDate" >= ${startDate}`);
  }
  if (endDate) {
    saleConditions.push(Prisma.sql`ms."saleDate" <= ${endDate}`);
  }

  const purchaseWhereSql = Prisma.join(purchaseConditions, " AND ");
  const saleWhereSql = Prisma.join(saleConditions, " AND ");

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*)::bigint AS total
      FROM (
        SELECT mp.id
        FROM "MedicinePurchase" mp
        JOIN "Medicine" m ON m.id = mp."medicineId"
        JOIN "MedicineCompany" mc ON mc.id = mp."companyId"
        WHERE ${purchaseWhereSql}

        UNION ALL

        SELECT ms.id
        FROM "MedicineSale" ms
        JOIN "Medicine" m ON m.id = ms."medicineId"
        JOIN "Patient" p ON p.id = ms."patientId"
        JOIN "MedicinePurchase" mp2 ON mp2.id = ms."purchaseId"
        JOIN "MedicineCompany" mc ON mc.id = mp2."companyId"
        WHERE ${saleWhereSql}
      ) AS activity
    `,
    prisma.$queryRaw<
      Array<{
        id: string;
        type: "purchase" | "sale";
        date: Date;
        medicineName: string;
        medicineBrand: string | null;
        groupName: string;
        quantity: number;
        unitPrice: number | Prisma.Decimal;
        totalAmount: number | Prisma.Decimal;
        companyName: string | null;
        invoiceNumber: string | null;
        patientName: string | null;
        patientPhone: string | null;
      }>
    >`
      SELECT *
      FROM (
        SELECT
          CONCAT('purchase-', mp.id::text) AS id,
          'purchase'::text AS type,
          mp."purchaseDate" AS date,
          m."genericName" AS "medicineName",
          m."brandName" AS "medicineBrand",
          COALESCE(mg."name", 'Unknown Group') AS "groupName",
          mp."quantity" AS quantity,
          mp."unitPrice" AS "unitPrice",
          mp."totalAmount" AS "totalAmount",
          mc."name" AS "companyName",
          mp."invoiceNumber" AS "invoiceNumber",
          NULL::text AS "patientName",
          NULL::text AS "patientPhone"
        FROM "MedicinePurchase" mp
        JOIN "Medicine" m ON m.id = mp."medicineId"
        LEFT JOIN "MedicineGroup" mg ON mg.id = m."groupId"
        JOIN "MedicineCompany" mc ON mc.id = mp."companyId"
        WHERE ${purchaseWhereSql}

        UNION ALL

        SELECT
          CONCAT('sale-', ms.id::text) AS id,
          'sale'::text AS type,
          ms."saleDate" AS date,
          m."genericName" AS "medicineName",
          m."brandName" AS "medicineBrand",
          COALESCE(mg."name", 'Unknown Group') AS "groupName",
          ms."quantity" AS quantity,
          ms."unitPrice" AS "unitPrice",
          ms."totalAmount" AS "totalAmount",
          mc."name" AS "companyName",
          NULL::text AS "invoiceNumber",
          p."fullName" AS "patientName",
          p."phoneNumber" AS "patientPhone"
        FROM "MedicineSale" ms
        JOIN "Medicine" m ON m.id = ms."medicineId"
        LEFT JOIN "MedicineGroup" mg ON mg.id = m."groupId"
        JOIN "Patient" p ON p.id = ms."patientId"
        JOIN "MedicinePurchase" mp2 ON mp2.id = ms."purchaseId"
        JOIN "MedicineCompany" mc ON mc.id = mp2."companyId"
        WHERE ${saleWhereSql}
      ) AS activity
      ORDER BY date DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `,
  ]);

  const total = Number(countRows[0]?.total ?? 0);

  return {
    records: rows.map((record) => ({
      ...record,
      unitPrice: Number(record.unitPrice),
      totalAmount: Number(record.totalAmount),
    })),
    total,
    page,
    limit,
  };
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
  defaultSalePrice: Prisma.Decimal;
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
    defaultSalePrice: Number(medicine.defaultSalePrice),
    currentStock: medicine.currentStock,
    lowStockThreshold: medicine.lowStockThreshold,
    isActive: medicine.isActive,
    isLowStock: medicine.currentStock <= medicine.lowStockThreshold,
    createdAt: medicine.createdAt.toISOString(),
    group: {
      id: medicine.group.id,
      name: medicine.group.name,
    },
    groupId: medicine.group.id,
    groupName: medicine.group.name,
  };
}
