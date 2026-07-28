/**
 * Medicine Inventory Service Layer
 * Business logic for medicine inventory management
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SessionDeviceInfo } from "@/types/auth";
import { isGynecologyDepartment } from "@/lib/departmentRecognition";
import { isMedicinePackageForDepartment } from "@/lib/medicinePackageDepartments";
import {
  getMedicinePackageDefinitions,
} from "@/services/medicinePackageService";
import {
  calculateMedicinePurchaseGrossTotal,
  calculateMedicinePurchaseLineTotal,
} from "@/lib/medicinePurchaseCalculations";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ActivityLogContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

export interface MedicineSaleLinkContext {
  admissionId?: number;
  admissionMedicineChargeId?: number;
  packageCode?: string;
  operationName?: string;
}

export interface MedicineSaleWithRelations {
  id: number;
  quantity: number;
  unitPrice: number | Prisma.Decimal;
  totalAmount: number | Prisma.Decimal;
  saleDate: Date;
  packageCode: string | null;
  operationName: string | null;
  patient: {
    id: number;
    fullName: string;
    phoneNumber: string | null;
  };
  medicine: {
    id: number;
    genericName: string;
    brandName: string | null;
    group: {
      id: number;
      name: string;
    };
  };
  purchase: {
    id: number;
    invoiceNumber: string;
    batchNumber: string | null;
    company: {
      id: number;
      name: string;
    };
  };
}

export interface MedicineSaleResponse {
  id: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  createdAt: string;
  admissionId: number | null;
  packageCode: string | null;
  operationName: string | null;
  admission: {
    id: number;
    admissionNumber: string;
  } | null;
  patient: {
    id: number;
    fullName: string;
    phoneNumber: string | null;
  };
  medicine: {
    id: number;
    genericName: string;
    brandName: string | null;
    group: {
      id: number;
      name: string;
    };
  };
  purchase: {
    id: number;
    invoiceNumber: string;
    batchNumber: string | null;
    company: {
      id: number;
      name: string;
    };
  };
}

export interface CreateSaleWithTxResult {
  primarySale: MedicineSaleWithRelations;
  sales: MedicineSaleWithRelations[];
  totalAmount: number;
  totalQuantity: number;
}

/**
 * Internal prevalidated context for `createSaleWithTx`. When provided,
 * the function trusts the supplied patient and medicine records and skips
 * the per-call re-fetch, while still performing the full FIFO stock
 * deduction. Used by the multi-item batch flow to avoid N+1 lookups.
 *
 * The context is intentionally not exported through the public API
 * surface — it is only used inside the medicine-inventory service.
 */
interface PrevalidatedSaleContext {
  patient: { id: number; fullName: string };
  medicine: {
    id: number;
    genericName: string;
    brandName: string | null;
    isActive: boolean;
    currentStock: number;
    group: { id: number; name: string };
  };
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

export interface CreateSalesBatchItemInput {
  medicineId: number;
  quantity: number;
  unitPrice: number;
  admissionId?: number | null;
  packageCode?: string | null;
  operationName?: string | null;
  packageItemName?: string | null;
}

export interface CreateSalesBatchResult {
  patientId: number;
  logicalItemCount: number;
  fifoSaleRowCount: number;
  totalQuantity: number;
  totalAmount: number;
  sales: MedicineSaleResponse[];
}

export interface PatientPackageAdmissionContext {
  admissionId: number;
  admissionNumber: string;
  status: string;
  dateAdmitted: Date;
  departmentId: number;
  departmentName: string;
  attachedPackageCodes: string[];
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

export interface CreatePurchaseInvoiceItemInput {
  medicineId: number;
  quantity: number;
  unitPrice: number;
  vatTax?: number;
  salePrice?: number;
  discountAmount?: number;
  expiryDate?: Date;
  batchNumber?: string;
}

export interface CreatePurchaseInvoiceInput {
  invoiceNumber: string;
  companyId: number;
  purchaseDate?: Date;
  items: CreatePurchaseInvoiceItemInput[];
}

export interface InventoryActivityFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const normalizeText = (value?: string | null) => value?.trim() || "";

const getMedicineDisplayName = (medicine: {
  genericName: string;
  brandName?: string | null;
}) => normalizeText(medicine.brandName) || medicine.genericName;

const getMedicineDisplayLabel = (medicine: {
  genericName: string;
  brandName?: string | null;
}) => {
  const medicineName = getMedicineDisplayName(medicine);
  const genericName = medicine.genericName.trim();

  if (medicineName.toLowerCase() === genericName.toLowerCase()) {
    return medicineName;
  }

  return `${medicineName} (${genericName})`;
};

const toFiniteMoney = (value: number | Prisma.Decimal, fieldName: string) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid medicine sale ${fieldName}.`);
  }

  return amount;
};

const transformMedicineSaleForResponse = (sale: {
  id: number;
  quantity: number;
  unitPrice: number | Prisma.Decimal;
  totalAmount: number | Prisma.Decimal;
  saleDate: Date;
  createdAt?: Date;
  admissionId?: number | null;
  packageCode?: string | null;
  operationName?: string | null;
  admission?: {
    id: number;
    admissionNumber: string;
  } | null;
  patient: {
    id: number;
    fullName: string;
    phoneNumber: string | null;
  };
  medicine: {
    id: number;
    genericName: string;
    brandName: string | null;
    group: {
      id: number;
      name: string;
    };
  };
  purchase: {
    id: number;
    invoiceNumber: string;
    batchNumber: string | null;
    company: {
      id: number;
      name: string;
    };
  };
}): MedicineSaleResponse => {
  return {
    id: sale.id,
    quantity: sale.quantity,
    unitPrice: toFiniteMoney(sale.unitPrice, "unit price"),
    totalAmount: toFiniteMoney(sale.totalAmount, "total amount"),
    saleDate: sale.saleDate.toISOString(),
    createdAt: (sale.createdAt ?? sale.saleDate).toISOString(),
    admissionId: sale.admissionId ?? null,
    packageCode: sale.packageCode ?? null,
    operationName: sale.operationName ?? null,
    admission: sale.admission ?? null,
    patient: sale.patient,
    medicine: sale.medicine,
    purchase: sale.purchase,
  };
};

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
        (SELECT GREATEST(
          mp."unitPrice" + mp."vatTax" -
            (mp."discountAmount" / NULLIF(mp."quantity", 0)),
          0
        )::numeric
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
// MEDICINE INVENTORY REPORT
// ═══════════════════════════════════════════════════════════════

export interface MedicineInventoryReport {
  stats: {
    totalMedicines: number;
    lowStockCount: number;
    totalSalesAmount: number;
    totalSalesCount: number;
    totalPurchasesAmount: number;
    totalPurchasesCount: number;
    totalStockValue: number;
  };
  availableMedicines: Array<{
    id: number;
    genericName: string;
    brandName: string | null;
    strength: string | null;
    dosageForm: string | null;
    defaultSalePrice: number;
    currentStock: number;
    lowStockThreshold: number;
    purchaseQuantity: number;
    salesQuantity: number;
    group: { id: number; name: string };
  }>;
  lowStockMedicines: Array<{
    id: number;
    genericName: string;
    brandName: string | null;
    strength: string | null;
    dosageForm: string | null;
    defaultSalePrice: number;
    currentStock: number;
    lowStockThreshold: number;
    purchaseQuantity: number;
    salesQuantity: number;
    group: { id: number; name: string };
  }>;
  purchases: Array<{
    id: number;
    invoiceNumber: string;
    quantity: number;
    unitPrice: number;
    vatTax: number;
    discountAmount: number;
    totalAmount: number;
    purchaseDate: Date;
    expiryDate: Date | null;
    batchNumber: string | null;
    remainingQty: number;
    createdAt: Date;
    company: { id: number; name: string };
    medicine: {
      id: number;
      genericName: string;
      brandName: string | null;
      group: { id: number; name: string };
    };
  }>;
  sales: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    saleDate: Date;
    createdAt: Date;
    admissionId: number | null;
    admission: { id: number; admissionNumber: string } | null;
    patient: { id: number; fullName: string; phoneNumber: string | null };
    medicine: {
      id: number;
      genericName: string;
      brandName: string | null;
      group: { id: number; name: string };
    };
    purchase: {
      id: number;
      invoiceNumber: string;
      batchNumber: string | null;
      company: { id: number; name: string };
    };
  }>;
}

export async function getMedicineInventoryReport(
  startDate?: Date,
  endDate?: Date,
): Promise<MedicineInventoryReport> {
  const purchasesDateFilter =
    startDate || endDate
      ? {
          purchaseDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

  const salesDateFilter =
    startDate || endDate
      ? {
          saleDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

  const [
    availableMedicines,
    lowStockMedicineRows,
    purchases,
    sales,
    totalSales,
    totalPurchases,
  ] = await Promise.all([
    prisma.medicine.findMany({
      where: {
        isActive: true,
        currentStock: {
          gt: 0,
        },
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
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ brandName: "asc" }, { genericName: "asc" }],
    }),

    prisma.medicine.findMany({
      where: {
        isActive: true,
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
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { currentStock: "asc" },
        { brandName: "asc" },
        { genericName: "asc" },
      ],
    }),

    prisma.medicinePurchase.findMany({
      where: purchasesDateFilter,
      select: {
        id: true,
        invoiceNumber: true,
        quantity: true,
        unitPrice: true,
        vatTax: true,
        discountAmount: true,
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
    }),

    prisma.medicineSale.findMany({
      where: salesDateFilter,
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        saleDate: true,
        createdAt: true,
        admissionId: true,
        packageCode: true,
        operationName: true,
        admission: {
          select: {
            id: true,
            admissionNumber: true,
          },
        },
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
    }),

    prisma.medicineSale.aggregate({
      where: salesDateFilter,
      _sum: { totalAmount: true },
      _count: true,
    }),

    prisma.medicinePurchase.aggregate({
      where: purchasesDateFilter,
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const normalizedPurchases = purchases.map((purchase) => ({
    ...purchase,
    unitPrice: Number(purchase.unitPrice),
    vatTax: Number(purchase.vatTax),
    discountAmount: Number(purchase.discountAmount),
    totalAmount: Number(purchase.totalAmount),
  }));

  const normalizedSales = sales.map((sale) => ({
    ...sale,
    unitPrice: Number(sale.unitPrice),
    totalAmount: Number(sale.totalAmount),
  }));

  const purchaseQuantityByMedicineId = new Map<number, number>();
  normalizedPurchases.forEach((purchase) => {
    purchaseQuantityByMedicineId.set(
      purchase.medicine.id,
      (purchaseQuantityByMedicineId.get(purchase.medicine.id) ?? 0) +
        purchase.quantity,
    );
  });

  const salesQuantityByMedicineId = new Map<number, number>();
  normalizedSales.forEach((sale) => {
    salesQuantityByMedicineId.set(
      sale.medicine.id,
      (salesQuantityByMedicineId.get(sale.medicine.id) ?? 0) + sale.quantity,
    );
  });

  const addMovementQuantities = <T extends { id: number }>(medicine: T) => ({
    ...medicine,
    purchaseQuantity: purchaseQuantityByMedicineId.get(medicine.id) ?? 0,
    salesQuantity: salesQuantityByMedicineId.get(medicine.id) ?? 0,
  });

  const normalizedMedicines = availableMedicines.map((medicine) => ({
    ...addMovementQuantities(medicine),
    defaultSalePrice: Number(medicine.defaultSalePrice),
  }));

  const lowStockMedicines = lowStockMedicineRows
    .map((medicine) => ({
      ...addMovementQuantities(medicine),
      defaultSalePrice: Number(medicine.defaultSalePrice),
    }))
    .filter(
      (medicine) => medicine.currentStock <= medicine.lowStockThreshold,
    );

  const stockValue = await prisma.$queryRaw<{ total: number }[]>`
    SELECT COALESCE(SUM(m."currentStock" * COALESCE(
      (SELECT GREATEST(
        mp."unitPrice" + mp."vatTax" -
          (mp."discountAmount" / NULLIF(mp."quantity", 0)),
        0
      )::numeric
       FROM "MedicinePurchase" mp
       WHERE mp."medicineId" = m.id
       ORDER BY mp."purchaseDate" DESC
       LIMIT 1), 0
    )), 0) as total
    FROM "Medicine" m
    WHERE m."isActive" = true
      AND m."currentStock" > 0
  `;

  const totalStockValue = Number(stockValue[0]?.total || 0);

  return {
    stats: {
      totalMedicines: normalizedMedicines.length,
      lowStockCount: lowStockMedicines.length,
      totalSalesAmount: Number(totalSales._sum.totalAmount || 0),
      totalSalesCount: totalSales._count,
      totalPurchasesAmount: Number(totalPurchases._sum.totalAmount || 0),
      totalPurchasesCount: totalPurchases._count,
      totalStockValue,
    },
    availableMedicines: normalizedMedicines,
    lowStockMedicines,
    purchases: normalizedPurchases,
    sales: normalizedSales,
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
            { brandName: { contains: filters.search, mode: "insensitive" } },
            { genericName: { contains: filters.search, mode: "insensitive" } },
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
      orderBy: [{ brandName: "asc" }, { genericName: "asc" }],
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
  brandName: string;
  groupId: number;
  strength?: string;
  dosageForm?: string;
  defaultSalePrice?: number;
  lowStockThreshold?: number;
}) {
  const normalizedMedicineName = normalizeText(data.brandName);
  const normalizedGenericName = normalizeText(data.genericName);

  if (!normalizedMedicineName) {
    throw new Error("Medicine name is required");
  }

  if (!normalizedGenericName) {
    throw new Error("Generic name is required");
  }

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
      brandName: {
        equals: normalizedMedicineName,
        mode: "insensitive",
      },
      groupId: data.groupId,
    },
  });

  if (existing) {
    throw new Error(
      "A medicine with this medicine name already exists in this group",
    );
  }

  return prisma.medicine.create({
    data: {
      genericName: normalizedGenericName,
      brandName: normalizedMedicineName,
      groupId: data.groupId,
      strength: normalizeText(data.strength) || null,
      dosageForm: normalizeText(data.dosageForm) || null,
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
    brandName: string;
    groupId: number;
    strength?: string;
    dosageForm?: string;
    defaultSalePrice?: number;
    lowStockThreshold?: number;
  },
) {
  const normalizedMedicineName = normalizeText(data.brandName);
  const normalizedGenericName = normalizeText(data.genericName);

  if (!normalizedMedicineName) {
    throw new Error("Medicine name is required");
  }

  if (!normalizedGenericName) {
    throw new Error("Generic name is required");
  }

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
      brandName: {
        equals: normalizedMedicineName,
        mode: "insensitive",
      },
      groupId: data.groupId,
    },
  });

  if (duplicate) {
    throw new Error(
      "A medicine with this medicine name already exists in this group",
    );
  }

  return prisma.medicine.update({
    where: { id: medicineId },
    data: {
      genericName: normalizedGenericName,
      brandName: normalizedMedicineName,
      groupId: data.groupId,
      strength: normalizeText(data.strength) || null,
      dosageForm: normalizeText(data.dosageForm) || null,
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
                brandName: { contains: filters.search, mode: "insensitive" },
              },
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
        vatTax: true,
        discountAmount: true,
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

  const normalizedPurchases = purchases.map((purchase) => ({
    ...purchase,
    unitPrice: Number(purchase.unitPrice),
    vatTax: Number(purchase.vatTax),
    discountAmount: Number(purchase.discountAmount),
    totalAmount: Number(purchase.totalAmount),
  }));

  return { purchases: normalizedPurchases, total, page, limit };
}

const medicinePurchaseSelect = {
  id: true,
  invoiceNumber: true,
  quantity: true,
  unitPrice: true,
  vatTax: true,
  discountAmount: true,
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
} satisfies Prisma.MedicinePurchaseSelect;

export async function createPurchaseInvoice(
  data: CreatePurchaseInvoiceInput,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  const now = new Date();
  const effectivePurchaseDate = data.purchaseDate || now;

  if (effectivePurchaseDate > now) {
    throw new Error("Purchase date cannot be in the future");
  }

  if (data.items.length === 0) {
    throw new Error("At least one medicine is required");
  }

  for (const item of data.items) {
    const vatTax = item.vatTax ?? 0;
    const discountAmount = item.discountAmount ?? 0;

    if (!Number.isFinite(vatTax) || vatTax < 0) {
      throw new Error("VAT + tax cannot be negative");
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      throw new Error("Discount amount cannot be negative");
    }

    const grossTotal = calculateMedicinePurchaseGrossTotal({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatTax,
    });

    if (discountAmount > grossTotal) {
      throw new Error(
        "Discount cannot exceed the purchase amount including VAT + tax",
      );
    }

    if (item.expiryDate && item.expiryDate < effectivePurchaseDate) {
      throw new Error("Expiry date cannot be earlier than purchase date");
    }
  }

  return prisma.$transaction(async (tx) => {
    // Verify company exists
    const company = await tx.medicineCompany.findUnique({
      where: { id: data.companyId },
    });

    if (!company || !company.isActive) {
      throw new Error("Invalid or inactive company");
    }

    const requestedMedicineIds = Array.from(
      new Set(data.items.map((item) => item.medicineId)),
    );

    const medicines = await tx.medicine.findMany({
      where: {
        id: {
          in: requestedMedicineIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        genericName: true,
        brandName: true,
      },
    });

    if (medicines.length !== requestedMedicineIds.length) {
      throw new Error("Invalid or inactive medicine");
    }

    const medicineById = new Map(
      medicines.map((medicine) => [medicine.id, medicine]),
    );

    const purchaseRows: Prisma.MedicinePurchaseCreateManyInput[] =
      data.items.map((item) => {
        const vatTax = item.vatTax ?? 0;
        const discountAmount = item.discountAmount ?? 0;

        return {
          invoiceNumber: data.invoiceNumber,
          companyId: data.companyId,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatTax,
          discountAmount,
          totalAmount: calculateMedicinePurchaseLineTotal({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatTax,
            discountAmount,
          }),
          purchaseDate: effectivePurchaseDate,
          expiryDate: item.expiryDate || null,
          batchNumber: item.batchNumber,
          remainingQty: item.quantity,
          createdBy: staffId,
        };
      });

    const createdPurchaseIds = await tx.medicinePurchase.createManyAndReturn({
      data: purchaseRows,
      select: {
        id: true,
      },
    });

    const stockAndPriceByMedicineId = data.items.reduce(
      (acc, item) => {
        const existing = acc.get(item.medicineId);

        acc.set(item.medicineId, {
          quantity: (existing?.quantity || 0) + item.quantity,
          salePrice: item.salePrice,
        });

        return acc;
      },
      new Map<number, { quantity: number; salePrice?: number }>(),
    );

    await Promise.all(
      Array.from(stockAndPriceByMedicineId.entries()).map(
        ([medicineId, values]) =>
          tx.medicine.update({
            where: { id: medicineId },
            data: {
              currentStock: {
                increment: values.quantity,
              },
              ...(values.salePrice !== undefined
                ? { defaultSalePrice: values.salePrice }
                : {}),
            },
          }),
      ),
    );

    const createdPurchases = await tx.medicinePurchase.findMany({
      where: {
        id: {
          in: createdPurchaseIds.map((purchase) => purchase.id),
        },
      },
      select: medicinePurchaseSelect,
      orderBy: {
        id: "asc",
      },
    });

    const invoiceTotal = data.items.reduce(
      (total, item) =>
        total +
        calculateMedicinePurchaseLineTotal({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatTax: item.vatTax ?? 0,
          discountAmount: item.discountAmount ?? 0,
        }),
      0,
    );
    const medicineSummary = data.items
      .map((item) => {
        const medicine = medicineById.get(item.medicineId);
        return medicine ? getMedicineDisplayLabel(medicine) : "Unknown";
      })
      .join(", ");

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Purchased ${data.items.length} medicine item${data.items.length === 1 ? "" : "s"} from ${company.name}. Invoice: ${data.invoiceNumber}. Total: ${invoiceTotal}. Medicines: ${medicineSummary}`,
        entityType: "MedicinePurchase",
        entityId: createdPurchases[0]?.id,
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

    return createdPurchases;
  });
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
  const purchases = await createPurchaseInvoice(
    {
      invoiceNumber: data.invoiceNumber,
      companyId: data.companyId,
      purchaseDate: data.purchaseDate,
      items: [
        {
          medicineId: data.medicineId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          expiryDate: data.expiryDate,
          batchNumber: data.batchNumber,
        },
      ],
    },
    staffId,
    userId,
    activityLogContext,
  );

  return purchases[0];
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
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicineSaleWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              medicine: {
                brandName: { contains: filters.search, mode: "insensitive" },
              },
            },
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
            {
              patient: {
                phoneNumber: { contains: filters.search },
              },
            },
            {
              admission: {
                admissionNumber: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            },
            {
              patient: {
                admissions: {
                  some: {
                    admissionNumber: {
                      contains: filters.search,
                      mode: "insensitive",
                    },
                  },
                },
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

  const [patientPage, allPatientGroups, totalSaleLines] = await Promise.all([
    prisma.medicineSale.groupBy({
      by: ["patientId"],
      where,
      _max: {
        saleDate: true,
      },
      orderBy: [
        {
          _max: {
            saleDate: "desc",
          },
        },
        {
          patientId: "desc",
        },
      ],
      skip,
      take: limit,
    }),
    prisma.medicineSale.groupBy({
      by: ["patientId"],
      where,
    }),
    prisma.medicineSale.count({ where }),
  ]);

  const patientIds = patientPage.map((group) => group.patientId);
  const sales =
    patientIds.length === 0
      ? []
      : await prisma.medicineSale.findMany({
          where: {
            AND: [where, { patientId: { in: patientIds } }],
          },
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalAmount: true,
            saleDate: true,
            createdAt: true,
            admissionId: true,
            packageCode: true,
            operationName: true,
            admission: {
              select: {
                id: true,
                admissionNumber: true,
              },
            },
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
          orderBy: [{ saleDate: "desc" }, { id: "desc" }],
        });

  return {
    sales: sales.map(transformMedicineSaleForResponse),
    total: allPatientGroups.length,
    totalSaleLines,
    page,
    limit,
  };
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
  linkContext?: MedicineSaleLinkContext,
) {
  const result = await prisma.$transaction(async (tx) =>
    createSaleWithTx(tx, data, staffId, userId, activityLogContext, linkContext),
  );

  // Return the first sale record for backward compatibility
  return transformMedicineSaleForResponse(result.primarySale);
}

/**
 * Transaction-aware sale creator.
 *
 * Performs FIFO stock deduction against `MedicinePurchase` batches and
 * creates one `MedicineSale` per batch consumed. When called from inside
 * an existing transaction (e.g. admission create/update), the caller's
 * transaction is used so all-or-nothing semantics are preserved.
 */
export async function createSaleWithTx(
  tx: Prisma.TransactionClient,
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
  linkContext?: MedicineSaleLinkContext,
  prevalidated?: PrevalidatedSaleContext,
): Promise<CreateSaleWithTxResult> {
  const now = new Date();
  const effectiveSaleDate = data.saleDate || now;

  if (Number.isNaN(effectiveSaleDate.getTime())) {
    throw new Error("Sale date is invalid");
  }

  if (effectiveSaleDate > now) {
    throw new Error("Sale date cannot be in the future");
  }

  // Verify patient exists (or trust prevalidated context)
  const patient = prevalidated
    ? prevalidated.patient.id === data.patientId
      ? {
          id: prevalidated.patient.id,
          fullName: prevalidated.patient.fullName,
        }
      : null
    : await tx.patient.findUnique({ where: { id: data.patientId } });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify medicine exists and has sufficient stock (or trust prevalidated context)
  let medicine: {
    id: number;
    genericName: string;
    brandName: string | null;
    isActive: boolean;
    currentStock: number;
    group: { id: number; name: string };
  };

  if (prevalidated && prevalidated.medicine.id === data.medicineId) {
    medicine = prevalidated.medicine;
  } else {
    const found = await tx.medicine.findUnique({
      where: { id: data.medicineId },
      select: {
        id: true,
        genericName: true,
        brandName: true,
        isActive: true,
        currentStock: true,
        group: { select: { id: true, name: true } },
      },
    });
    if (!found || !found.isActive) {
      throw new Error("Invalid or inactive medicine");
    }
    medicine = found;
  }

  if (!medicine.isActive) {
    throw new Error("Invalid or inactive medicine");
  }

  if (medicine.currentStock < data.quantity) {
    throw new Error(
      `Insufficient stock. Available: ${medicine.currentStock}, Requested: ${data.quantity}`,
    );
  }

  if (data.unitPrice !== undefined) {
    if (!Number.isFinite(data.unitPrice) || data.unitPrice <= 0) {
      throw new Error("Unit price must be greater than zero.");
    }
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
  const saleRecords: MedicineSaleWithRelations[] = [];
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
        admissionId: linkContext?.admissionId ?? null,
        admissionMedicineChargeId:
          linkContext?.admissionMedicineChargeId ?? null,
        packageCode: linkContext?.packageCode ?? null,
        operationName: linkContext?.operationName ?? null,
      },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        saleDate: true,
        createdAt: true,
        admissionId: true,
        packageCode: true,
        operationName: true,
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
  const isAdmissionSale = Boolean(linkContext?.admissionId);
  const saleDescriptionSuffix = isAdmissionSale
    ? ` (linked to admission${linkContext?.admissionId ? ` #${linkContext.admissionId}` : ""})`
    : "";

  await tx.activityLog.create({
    data: {
      userId,
      action: "CREATE",
      description: `Sold ${data.quantity} units of ${getMedicineDisplayLabel(medicine)} to ${patient.fullName}. Amount: BDT ${overallTotalAmount}${saleRecords.length > 1 ? ` (across ${saleRecords.length} batches)` : ""}${saleDescriptionSuffix}`,
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

  return {
    primarySale,
    sales: saleRecords,
    totalAmount: overallTotalAmount,
    totalQuantity: data.quantity,
  };
}

/**
 * Atomic multi-item direct pharmacy sale.
 *
 * Validates the patient, all referenced medicines, and combined stock in
 * one pass, then runs the existing `createSaleWithTx` primitive for each
 * item using a shared transaction. The cart succeeds or fails as a
 * whole: any failure rolls back every FIFO deduction, `Medicine.currentStock`
 * decrement, and `MedicineSale` insert.
 *
 * Pricing: the pharmacist's per-item `unitPrice` is multiplied by the
 * actual FIFO quantity at the server. The client never submits a line
 * total or a cart total.
 */
export async function createSalesBatch(
  data: {
    patientId: number;
    saleDate?: Date;
    items: CreateSalesBatchItemInput[];
  },
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
): Promise<CreateSalesBatchResult> {
  const now = new Date();
  const effectiveSaleDate = data.saleDate || now;

  if (Number.isNaN(effectiveSaleDate.getTime())) {
    throw new Error("Sale date is invalid");
  }

  if (effectiveSaleDate > now) {
    throw new Error("Sale date cannot be in the future");
  }

  if (!Number.isFinite(data.patientId) || data.patientId <= 0) {
    throw new Error("Patient is required.");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("At least one medicine is required.");
  }

  if (data.items.length > 100) {
    throw new Error("A single cart can contain up to 100 medicines.");
  }

  // Reject only duplicate logical rows. The same medicine can legitimately
  // appear under different department packages/admissions in one cart.
  const seenLogicalItems = new Set<string>();
  for (const item of data.items) {
    if (!Number.isInteger(item.medicineId) || item.medicineId <= 0) {
      throw new Error("Selected medicine is not available.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Quantity must be a positive whole number.");
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
      throw new Error("Unit price must be greater than zero.");
    }
    const packageCode = item.packageCode?.trim().toUpperCase() || null;
    const packageItemName = item.packageItemName?.trim() || null;
    const admissionId = item.admissionId ?? null;
    if (item.packageCode && !packageCode) {
      throw new Error("Invalid medicine package.");
    }
    if (packageCode && !admissionId) {
      throw new Error("Package admission context is required.");
    }
    if (packageCode && !packageItemName) {
      throw new Error("Package item context is required.");
    }
    if (admissionId && !packageCode) {
      throw new Error("Package admission context is invalid.");
    }
    if (!packageCode && packageItemName) {
      throw new Error("Package item context is invalid.");
    }
    const logicalKey = [
      item.medicineId,
      packageCode ?? "manual",
      admissionId ?? "none",
      packageItemName?.toLowerCase() ?? "manual",
    ].join(":");
    if (seenLogicalItems.has(logicalKey)) {
      throw new Error(
        `Duplicate medicine context in cart: ${item.medicineId}. Merge quantities before submitting.`,
      );
    }
    seenLogicalItems.add(logicalKey);
  }

  const packageDefinitions = await getMedicinePackageDefinitions();
  const packageByCode = new Map(
    packageDefinitions.map((definition) => [definition.code, definition]),
  );
  const packageTemplateNames = new Map(
    packageDefinitions.map((definition) => [
      definition.code,
      new Set(
        definition.items.map((item) => item.templateName.trim().toLowerCase()),
      ),
    ]),
  );
  const packageAdmissionIds = Array.from(
    new Set(
      data.items
        .filter((item) => item.packageCode)
        .map((item) => item.admissionId)
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  return prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: data.patientId },
      select: { id: true, fullName: true },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    const admissions = packageAdmissionIds.length
      ? await tx.admission.findMany({
          where: {
            id: { in: packageAdmissionIds },
            patientId: data.patientId,
            status: { not: "Canceled" },
          },
          select: {
            id: true,
            departmentId: true,
            department: { select: { name: true } },
          },
        })
      : [];
    const admissionById = new Map(admissions.map((admission) => [admission.id, admission]));

    for (const item of data.items) {
      const packageCode = item.packageCode?.trim().toUpperCase() || null;
      if (!packageCode) continue;

      const definition = packageByCode.get(packageCode);
      if (!definition) {
        throw new Error("Invalid medicine package.");
      }
      const packageItemName = item.packageItemName?.trim().toLowerCase();
      if (
        !packageItemName ||
        !packageTemplateNames.get(packageCode)?.has(packageItemName)
      ) {
        throw new Error("Package item does not belong to the selected package.");
      }
      const admission = item.admissionId
        ? admissionById.get(item.admissionId)
        : null;
      if (!admission) {
        throw new Error("Package admission context is invalid.");
      }
      if (
        !isMedicinePackageForDepartment(
          definition.departmentName,
          admission.department.name,
          definition.departmentId,
          admission.departmentId,
        )
      ) {
        throw new Error("Medicine package does not match the admission department.");
      }
      if (
        item.operationName?.trim().toLowerCase() !==
        definition.operationName.trim().toLowerCase()
      ) {
        throw new Error("Invalid medicine package operation.");
      }
    }

    const medicineIds = Array.from(
      new Set(data.items.map((item) => item.medicineId)),
    );
    const medicines = await tx.medicine.findMany({
      where: { id: { in: medicineIds }, isActive: true },
      select: {
        id: true,
        genericName: true,
        brandName: true,
        isActive: true,
        currentStock: true,
        group: { select: { id: true, name: true } },
      },
    });

    if (medicines.length !== medicineIds.length) {
      const foundIds = new Set(medicines.map((m) => m.id));
      const missing = medicineIds.find((id) => !foundIds.has(id));
      throw new Error(
        `One or more medicines are missing or inactive (id: ${missing ?? "?"})`,
      );
    }

    const medicineById = new Map(medicines.map((m) => [m.id, m]));

    const requiredQuantityByMedicine = new Map<number, number>();
    for (const item of data.items) {
      requiredQuantityByMedicine.set(
        item.medicineId,
        (requiredQuantityByMedicine.get(item.medicineId) ?? 0) + item.quantity,
      );
    }
    for (const [medicineId, requiredQuantity] of requiredQuantityByMedicine) {
      const medicine = medicineById.get(medicineId);
      if (!medicine || medicine.currentStock < requiredQuantity) {
        throw new Error(
          `Insufficient stock. Available: ${medicine?.currentStock ?? 0}, Requested: ${requiredQuantity}`,
        );
      }
    }

    // Combined stock was validated above; each logical row is still recorded
    // independently so its package/admission provenance remains accurate.
    const aggregated: MedicineSaleWithRelations[] = [];
    let fifoRowCount = 0;
    let totalQuantity = 0;
    let totalAmount = 0;
    for (const item of data.items) {
      const medicine = medicineById.get(item.medicineId);
      if (!medicine || !medicine.isActive) {
        throw new Error(
          `Selected medicine is not available (id: ${item.medicineId}).`,
        );
      }

      const result = await createSaleWithTx(
        tx,
        {
          patientId: data.patientId,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          saleDate: effectiveSaleDate,
        },
        staffId,
        userId,
        activityLogContext,
        item.packageCode?.trim()
          ? {
              admissionId: item.admissionId ?? undefined,
              packageCode: item.packageCode.trim().toUpperCase(),
              operationName:
                packageByCode.get(item.packageCode.trim().toUpperCase())
                  ?.operationName ?? item.operationName ?? undefined,
            }
          : undefined,
        {
          patient: { id: patient.id, fullName: patient.fullName },
          medicine,
        },
      );

      aggregated.push(...result.sales);
      fifoRowCount += result.sales.length;
      totalQuantity += result.totalQuantity;
      totalAmount += result.totalAmount;
    }

    return {
      patientId: data.patientId,
      logicalItemCount: data.items.length,
      fifoSaleRowCount: fifoRowCount,
      totalQuantity,
      totalAmount,
      sales: aggregated.map(transformMedicineSaleForResponse),
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export interface PatientGyneContextResult {
  admissionId: number;
  admissionNumber: string;
  status: string;
  dateAdmitted: Date;
  departmentId: number;
  departmentName: string;
  hasLucsPackage: boolean;
}

/**
 * Return the latest non-canceled Gynecology admission for
 * a central patient, plus a flag indicating whether a LUCS admission
 * package is already attached.
 *
 * Discharged admissions remain eligible because Medicine Inventory uses
 * the LUCS package as a dispensing template rather than an admission write.
 * Returns `null` when no eligible Gynecology admission exists. Used by the
 * Medicine Inventory multi-item sale modal to enable the LUCS quick-fill
 * action and to render a compact gynecology badge in the cart header.
 */
export async function getPatientGyneContext(
  patientId: number,
): Promise<PatientGyneContextResult | null> {
  if (!Number.isFinite(patientId) || patientId <= 0) return null;

  const eligibleAdmissions = await prisma.admission.findMany({
    where: {
      patientId,
      status: { not: "Canceled" },
    },
    orderBy: { dateAdmitted: "desc" },
    select: {
      id: true,
      admissionNumber: true,
      status: true,
      dateAdmitted: true,
      departmentId: true,
      department: { select: { name: true } },
      medicineChargeItems: {
        where: { packageCode: "LUCS_OT_MEDICINE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  const admission = eligibleAdmissions.find((candidate) =>
    isGynecologyDepartment(candidate.department.name),
  );

  if (!admission) return null;

  return {
    admissionId: admission.id,
    admissionNumber: admission.admissionNumber,
    status: admission.status,
    dateAdmitted: admission.dateAdmitted,
    departmentId: admission.departmentId,
    departmentName: admission.department.name,
    hasLucsPackage: admission.medicineChargeItems.length > 0,
  };
}

/**
 * Return all non-canceled admissions that can provide a department context
 * for medicine inventory package actions. Discharged admissions remain
 * visible because dispensing a package is a separate pharmacy transaction.
 */
export async function getPatientPackageContext(
  patientId: number,
): Promise<PatientPackageAdmissionContext[]> {
  if (!Number.isFinite(patientId) || patientId <= 0) return [];

  const admissions = await prisma.admission.findMany({
    where: {
      patientId,
      status: { not: "Canceled" },
    },
    orderBy: { dateAdmitted: "desc" },
    select: {
      id: true,
      admissionNumber: true,
      status: true,
      dateAdmitted: true,
      departmentId: true,
      department: { select: { name: true } },
      medicineChargeItems: {
        where: { packageCode: { not: null } },
        select: { packageCode: true },
      },
    },
  });

  return admissions.map((admission) => ({
    admissionId: admission.id,
    admissionNumber: admission.admissionNumber,
    status: admission.status,
    dateAdmitted: admission.dateAdmitted,
    departmentId: admission.departmentId,
    departmentName: admission.department.name,
    attachedPackageCodes: Array.from(
      new Set(
        admission.medicineChargeItems
          .map((item) => item.packageCode)
          .filter((code): code is string => Boolean(code)),
      ),
    ),
  }));
}

/**
 * Reverse (delete) all `MedicineSale` rows linked to a given admission and
 * restore stock back to the source purchase batches.
 *
 * Defensive predicate: only rows with a non-null `admissionMedicineChargeId`
 * are considered admission-linked. Direct pharmacist sales (which this
 * plan explicitly does not link to admissions) are never touched even if
 * a future caller happened to set `admissionId` for some other reason.
 *
 * Must be called from inside an existing Prisma transaction. The caller is
 * responsible for deleting `AdmissionMedicineCharge` rows and any other
 * admission-scoped data after this runs.
 */
export async function reverseAdmissionMedicineSales(
  tx: Prisma.TransactionClient,
  admissionId: number,
): Promise<{ reversed: number }> {
  const sales = await tx.medicineSale.findMany({
    where: {
      admissionId,
      admissionMedicineChargeId: { not: null },
    },
    select: {
      id: true,
      medicineId: true,
      purchaseId: true,
      quantity: true,
    },
  });

  if (sales.length === 0) {
    return { reversed: 0 };
  }

  for (const sale of sales) {
    await tx.medicinePurchase.update({
      where: { id: sale.purchaseId },
      data: {
        remainingQty: { increment: sale.quantity },
      },
    });

    await tx.medicine.update({
      where: { id: sale.medicineId },
      data: {
        currentStock: { increment: sale.quantity },
      },
    });
  }

  await tx.medicineSale.deleteMany({
    where: {
      id: { in: sales.map((sale) => sale.id) },
    },
  });

  return { reversed: sales.length };
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
        OR m."brandName" ILIKE ${likeSearch}
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
        m."brandName" ILIKE ${likeSearch}
        OR
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
        vatTax: number | Prisma.Decimal | null;
        discountAmount: number | Prisma.Decimal | null;
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
          COALESCE(NULLIF(m."brandName", ''), m."genericName") AS "medicineName",
          m."genericName" AS "medicineBrand",
          COALESCE(mg."name", 'Unknown Group') AS "groupName",
          mp."quantity" AS quantity,
          mp."unitPrice" AS "unitPrice",
          mp."vatTax" AS "vatTax",
          mp."discountAmount" AS "discountAmount",
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
          COALESCE(NULLIF(m."brandName", ''), m."genericName") AS "medicineName",
          m."genericName" AS "medicineBrand",
          COALESCE(mg."name", 'Unknown Group') AS "groupName",
          ms."quantity" AS quantity,
          ms."unitPrice" AS "unitPrice",
          NULL::numeric AS "vatTax",
          NULL::numeric AS "discountAmount",
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
      vatTax: record.vatTax === null ? null : Number(record.vatTax),
      discountAmount:
        record.discountAmount === null ? null : Number(record.discountAmount),
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
    medicineName: getMedicineDisplayName(medicine),
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
