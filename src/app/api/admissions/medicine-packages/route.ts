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
  strength: string | null;
  dosageForm: string | null;
  defaultSalePrice: Prisma.Decimal;
  currentStock: number;
  lowStockThreshold: number;
  group: { name: string };
};

const normalizeSearchText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[µμ]g/g, "mcg")
    .replace(/(\d+)\s*(mg|mcg|ml|gm|g)\b/g, "$1 $2")
    .replace(/\binj\b/g, "injection")
    .replace(/\binf\b/g, "infusion")
    .replace(/\btab\b/g, "tablet")
    .replace(/\bcap\b/g, "capsule")
    .replace(/\bsyring\b/g, "syringe")
    .replace(/\bcathertar\b/g, "catheter")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeSearchText = (value: string): string[] =>
  normalizeSearchText(value).split(" ").filter(Boolean);

const getMedicineSearchValues = (medicine: ResolvedMedicine): string[] => [
  medicine.brandName ?? "",
  medicine.genericName,
  medicine.strength ?? "",
  medicine.dosageForm ?? "",
  medicine.group.name,
];

const hasDoseClue = (tokens: string[]): boolean =>
  tokens.some((token) =>
    ["mg", "mcg", "ml", "gm", "g", "infusion", "injection"].includes(token),
  );

const hasNumberClue = (tokens: string[]): boolean =>
  tokens.some((token) => /^\d+$/.test(token));

type MedicineMatch = {
  medicine: ResolvedMedicine;
  alias: string;
  score: number;
  matchReason: string;
};

const scoreMedicineForAlias = (
  alias: string,
  medicine: ResolvedMedicine,
): MedicineMatch | null => {
  const normalizedAlias = normalizeSearchText(alias);
  if (!normalizedAlias) return null;

  const aliasTokens = tokenizeSearchText(alias);
  if (aliasTokens.length === 0) return null;

  const normalizedBrand = medicine.brandName
    ? normalizeSearchText(medicine.brandName)
    : null;
  const normalizedGeneric = normalizeSearchText(medicine.genericName);
  const normalizedValues = getMedicineSearchValues(medicine)
    .map(normalizeSearchText)
    .filter(Boolean);
  const candidateText = normalizedValues.join(" ");
  const candidateTokens = new Set(tokenizeSearchText(candidateText));
  const allAliasTokensMatch = aliasTokens.every((token) =>
    candidateTokens.has(token),
  );

  let baseScore = 0;
  let matchType: string | null = null;

  if (normalizedBrand === normalizedAlias) {
    baseScore = 90;
    matchType = "exact medicine name";
  } else if (normalizedGeneric === normalizedAlias) {
    baseScore = 88;
    matchType = "exact generic name";
  } else if (normalizedValues.some((value) => value === normalizedAlias)) {
    baseScore = 86;
    matchType = "exact field";
  } else if (candidateText.includes(normalizedAlias)) {
    baseScore = 82;
    matchType = "full label";
  } else if (
    normalizedBrand !== null &&
    normalizedBrand.includes(normalizedAlias)
  ) {
    baseScore = 72;
    matchType = "medicine name";
  } else if (normalizedGeneric.includes(normalizedAlias)) {
    baseScore = 70;
    matchType = "generic name";
  } else if (allAliasTokensMatch) {
    baseScore = 80;
    matchType = "token match";
  }

  if (baseScore === 0 || matchType === null) return null;

  const score =
    baseScore +
    aliasTokens.length * 4 +
    (hasNumberClue(aliasTokens) ? 18 : 0) +
    (hasDoseClue(aliasTokens) ? 12 : 0) +
    Math.min(Math.max(medicine.currentStock, 0), 100) / 100;

  return {
    medicine,
    alias,
    score,
    matchReason: `Matched via ${matchType} alias "${alias}"`,
  };
};

const findBestMedicineMatch = (
  aliases: string[],
  medicines: ResolvedMedicine[],
): MedicineMatch | null => {
  let bestMatch: MedicineMatch | null = null;

  for (const alias of aliases) {
    for (const medicine of medicines) {
      const match = scoreMedicineForAlias(alias, medicine);
      if (!match) continue;

      if (
        bestMatch === null ||
        match.score > bestMatch.score ||
        (match.score === bestMatch.score &&
          match.medicine.currentStock > bestMatch.medicine.currentStock)
      ) {
        bestMatch = match;
      }
    }
  }

  return bestMatch;
};

const medicineSelect = {
  id: true,
  genericName: true,
  brandName: true,
  strength: true,
  dosageForm: true,
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
  const match = findBestMedicineMatch(item.aliases, medicines);

  if (match) {
    const medicine = match.medicine;
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
      matchReason: match.matchReason,
    };
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
      },
      { status: 500 },
    );
  }
}
