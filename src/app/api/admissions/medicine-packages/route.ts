/**
 * Admission Medicine Package API
 *
 * Resolves a template code (e.g. "LUCS_OT_MEDICINE") against the live
 * pharmacy `Medicine` catalog. Returns one row per template item with
 * medicine match metadata, current stock and default sale price.
 *
 * GET /api/admissions/medicine-packages?code=LUCS_OT_MEDICINE
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import {
  ADMISSION_MEDICINE_PACKAGE_TEMPLATES,
  findAdmissionMedicinePackageTemplate,
  type AdmissionMedicinePackageTemplateItem,
} from "@/lib/admissionMedicinePackageTemplates";
import { Prisma } from "@prisma/client";

export interface AdmissionMedicinePackageItemResponse {
  templateName: string;
  matched: boolean;
  medicineId: number | null;
  medicineName: string;
  genericName: string | null;
  groupName: string | null;
  companyName: string | null;
  defaultSalePrice: number;
  currentStock: number;
  lowStockThreshold: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  matchReason: string | null;
}

export interface AdmissionMedicinePackageResponse {
  code: string;
  name: string;
  operationName: string;
  items: AdmissionMedicinePackageItemResponse[];
}

const DEFAULT_QUANTITY = 1;

type ResolvedMedicine = {
  id: number;
  genericName: string;
  brandName: string | null;
  defaultSalePrice: Prisma.Decimal;
  currentStock: number;
  lowStockThreshold: number;
  group: { name: string };
};

const normalizeSearchText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const findMedicineForAlias = (
  alias: string,
  medicines: ResolvedMedicine[],
): ResolvedMedicine | null => {
  const normalized = alias.trim();
  if (!normalized) return null;
  const normalizedAlias = normalizeSearchText(normalized);

  // 1. Exact brandName match
  const exactBrand = medicines.find(
    (medicine) =>
      medicine.brandName !== null &&
      normalizeSearchText(medicine.brandName) === normalizedAlias,
  );
  if (exactBrand) {
    return exactBrand;
  }

  // 2. Exact genericName match
  const exactGeneric = medicines.find(
    (medicine) => normalizeSearchText(medicine.genericName) === normalizedAlias,
  );
  if (exactGeneric) {
    return exactGeneric;
  }

  // 3. brandName contains alias
  const containsBrand = medicines.find(
    (medicine) =>
      medicine.brandName !== null &&
      normalizeSearchText(medicine.brandName).includes(normalizedAlias),
  );
  if (containsBrand) {
    return containsBrand;
  }

  // 4. genericName contains alias
  const containsGeneric = medicines.find((medicine) =>
    normalizeSearchText(medicine.genericName).includes(normalizedAlias),
  );
  return containsGeneric ?? null;
};

const medicineSelect = {
  id: true,
  genericName: true,
  brandName: true,
  defaultSalePrice: true,
  currentStock: true,
  lowStockThreshold: true,
  group: { select: { name: true } },
} satisfies Prisma.MedicineSelect;

const resolveTemplateItem = async (
  item: AdmissionMedicinePackageTemplateItem,
  medicines: ResolvedMedicine[],
  companyByMedicineId: Map<number, string>,
): Promise<AdmissionMedicinePackageItemResponse> => {
  for (const alias of item.aliases) {
    const medicine = findMedicineForAlias(alias, medicines);
    if (medicine) {
      const unitPrice = Number(medicine.defaultSalePrice);
      const displayName = medicine.brandName?.trim() || medicine.genericName;

      return {
        templateName: item.templateName,
        matched: true,
        medicineId: medicine.id,
        medicineName: displayName,
        genericName: medicine.genericName,
        groupName: medicine.group.name,
        companyName: companyByMedicineId.get(medicine.id) ?? null,
        defaultSalePrice: unitPrice,
        currentStock: medicine.currentStock,
        lowStockThreshold: medicine.lowStockThreshold,
        quantity: DEFAULT_QUANTITY,
        unitPrice,
        totalAmount: DEFAULT_QUANTITY * unitPrice,
        matchReason: `Matched via alias "${alias}"`,
      };
    }
  }

  return {
    templateName: item.templateName,
    matched: false,
    medicineId: null,
    medicineName: item.templateName,
    genericName: null,
    groupName: null,
    companyName: null,
    defaultSalePrice: 0,
    currentStock: 0,
    lowStockThreshold: 0,
    quantity: DEFAULT_QUANTITY,
    unitPrice: 0,
    totalAmount: 0,
    matchReason: null,
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedCode = searchParams.get("code")?.trim();
    const fallbackCode = ADMISSION_MEDICINE_PACKAGE_TEMPLATES[0]?.code ?? "";
    const code = requestedCode || fallbackCode;

    const template = findAdmissionMedicinePackageTemplate(code);
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown admission medicine package code: ${code}`,
        },
        { status: 404 },
      );
    }

    const medicines = await prisma.medicine.findMany({
      where: { isActive: true },
      orderBy: [
        { currentStock: "desc" },
        { brandName: "asc" },
        { genericName: "asc" },
      ],
      select: medicineSelect,
    });

    const purchasesWithStock = await prisma.medicinePurchase.findMany({
      where: {
        remainingQty: { gt: 0 },
        medicineId: { in: medicines.map((medicine) => medicine.id) },
      },
      orderBy: [{ medicineId: "asc" }, { purchaseDate: "asc" }],
      select: {
        medicineId: true,
        company: { select: { name: true } },
      },
    });

    const companyByMedicineId = new Map<number, string>();
    for (const purchase of purchasesWithStock) {
      if (!companyByMedicineId.has(purchase.medicineId)) {
        companyByMedicineId.set(purchase.medicineId, purchase.company.name);
      }
    }

    const items: AdmissionMedicinePackageItemResponse[] = [];
    for (const templateItem of template.items) {
      items.push(
        await resolveTemplateItem(templateItem, medicines, companyByMedicineId),
      );
    }

    const response: AdmissionMedicinePackageResponse = {
      code: template.code,
      name: template.name,
      operationName: template.operationName,
      items,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error(
      "GET /api/admissions/medicine-packages error:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load admission medicine package",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
