/**
 * Medicine Package Resolver Service
 *
 * Resolves a source-controlled template (e.g. "LUCS_OT_MEDICINE") against
 * the live `Medicine` catalog. Returns one row per template item with
 * medicine match metadata, current stock and default sale price.
 *
 * Both the Admission and the Medicine Inventory routes call this service
 * so the matching algorithm cannot drift between modules.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  MEDICINE_PACKAGE_TEMPLATES,
  findMedicinePackageTemplate,
  type MedicinePackageTemplate,
  type MedicinePackageTemplateItem,
} from "@/lib/medicinePackageTemplates";
import {
  medicinePackageDefinitionSchema,
  medicinePackageDefinitionsSchema,
  type MedicinePackageDefinition,
} from "@/lib/medicinePackageSchemas";

export interface ResolvedMedicinePackageItem {
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
  matchReason: string | null;
}

export interface ResolvedMedicinePackage {
  code: string;
  name: string;
  operationName: string;
  items: ResolvedMedicinePackageItem[];
}

const DEFAULT_QUANTITY = 1;
const MEDICINE_PACKAGE_CONFIG_KEY = "MEDICINE_INVENTORY_PACKAGES";

const getStaticMedicinePackageDefinitions = (): MedicinePackageTemplate[] =>
  MEDICINE_PACKAGE_TEMPLATES.map((definition) => ({
    ...definition,
    items: definition.items.map((item) => ({
      ...item,
      quantity: item.quantity ?? DEFAULT_QUANTITY,
    })),
  }));

function normalizePackageDefinition(
  definition: MedicinePackageDefinition,
): MedicinePackageTemplate {
  return {
    code: definition.code.trim().toUpperCase(),
    name: definition.name.trim(),
    operationName: definition.operationName.trim(),
    items: definition.items.map((item) => ({
      templateName: item.templateName.trim(),
      aliases: Array.from(
        new Set([item.templateName, ...item.aliases].map((alias) => alias.trim())),
      ),
      quantity: item.quantity ?? DEFAULT_QUANTITY,
    })),
  };
}

export async function getMedicinePackageDefinitions(): Promise<
  MedicinePackageTemplate[]
> {
  const config = await prisma.hospitalConfig.findUnique({
    where: { key: MEDICINE_PACKAGE_CONFIG_KEY },
    select: { value: true },
  });

  if (!config) return getStaticMedicinePackageDefinitions();

  try {
    const parsed = medicinePackageDefinitionsSchema.safeParse(
      JSON.parse(config.value),
    );
    if (!parsed.success || parsed.data.length === 0) {
      return getStaticMedicinePackageDefinitions();
    }
    return parsed.data.map(normalizePackageDefinition);
  } catch {
    return getStaticMedicinePackageDefinitions();
  }
}

async function persistMedicinePackageDefinitions(
  definitions: MedicinePackageTemplate[],
  userId: number,
  action: string,
): Promise<MedicinePackageTemplate[]> {
  const normalized = definitions.map((definition) =>
    normalizePackageDefinition(
      medicinePackageDefinitionSchema.parse({
        ...definition,
        items: definition.items.map((item) => ({
          ...item,
          quantity: item.quantity ?? DEFAULT_QUANTITY,
        })),
      }),
    ),
  );

  await prisma.$transaction(async (tx) => {
    await tx.hospitalConfig.upsert({
      where: { key: MEDICINE_PACKAGE_CONFIG_KEY },
      create: {
        key: MEDICINE_PACKAGE_CONFIG_KEY,
        value: JSON.stringify(normalized),
        description: "Medicine inventory sale package definitions",
        updatedBy: userId,
      },
      update: {
        value: JSON.stringify(normalized),
        description: "Medicine inventory sale package definitions",
        updatedBy: userId,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action,
        description: `${action} medicine sale package definitions`,
        entityType: "MedicinePackage",
        timestamp: new Date(),
      },
    });
  });

  return normalized;
}

export async function createMedicinePackage(
  definition: MedicinePackageDefinition,
  userId: number,
): Promise<MedicinePackageTemplate> {
  const normalized = normalizePackageDefinition(definition);
  const definitions = await getMedicinePackageDefinitions();
  if (definitions.some((item) => item.code === normalized.code)) {
    throw new Error("A package with this code already exists");
  }
  await persistMedicinePackageDefinitions(
    [...definitions, normalized],
    userId,
    "CREATE",
  );
  return normalized;
}

export async function updateMedicinePackage(
  code: string,
  definition: MedicinePackageDefinition,
  userId: number,
): Promise<MedicinePackageTemplate> {
  const definitions = await getMedicinePackageDefinitions();
  const normalized = normalizePackageDefinition({
    ...definition,
    code,
  });
  const index = definitions.findIndex(
    (item) => item.code === code.trim().toUpperCase(),
  );
  if (index < 0) throw new Error("Medicine package not found");

  const duplicate = definitions.some(
    (item, itemIndex) =>
      itemIndex !== index && item.code === normalized.code,
  );
  if (duplicate) throw new Error("A package with this code already exists");

  const next = [...definitions];
  next[index] = normalized;
  await persistMedicinePackageDefinitions(next, userId, "UPDATE");
  return normalized;
}

export async function deleteMedicinePackage(
  code: string,
  userId: number,
): Promise<void> {
  const definitions = await getMedicinePackageDefinitions();
  const normalizedCode = code.trim().toUpperCase();
  if (!definitions.some((item) => item.code === normalizedCode)) {
    throw new Error("Medicine package not found");
  }
  if (definitions.length === 1) {
    throw new Error("At least one medicine package must remain");
  }
  await persistMedicinePackageDefinitions(
    definitions.filter((item) => item.code !== normalizedCode),
    userId,
    "DELETE",
  );
}

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

const resolveTemplateItem = (
  item: MedicinePackageTemplateItem,
  medicines: ResolvedMedicine[],
  companyByMedicineId: Map<number, string>,
): ResolvedMedicinePackageItem => {
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
      quantity: item.quantity ?? DEFAULT_QUANTITY,
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
    quantity: item.quantity ?? DEFAULT_QUANTITY,
    matchReason: null,
  };
};

/**
 * Look up a template by code. Returns null when the code is unknown so
 * the caller can return a 404 without leaking which templates exist.
 */
export function lookupMedicinePackageTemplate(
  code: string | null | undefined,
): MedicinePackageTemplate | null {
  if (code) {
    const template = findMedicinePackageTemplate(code);
    if (template) return template;
    return null;
  }
  return MEDICINE_PACKAGE_TEMPLATES[0] ?? null;
}

/**
 * Resolve a template against the live `Medicine` catalog. Returns the
 * resolved package (with one row per template item) or `null` when the
 * supplied code does not match any known template.
 */
export async function resolveMedicinePackage(
  code: string | null | undefined,
): Promise<ResolvedMedicinePackage | null> {
  const templates = await getMedicinePackageDefinitions();
  const normalizedCode = code?.trim().toUpperCase();
  const template = code
    ? templates.find((item) => item.code === normalizedCode)
    : templates[0];
  if (!template) return null;

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

  const items = template.items.map((templateItem) =>
    resolveTemplateItem(templateItem, medicines, companyByMedicineId),
  );

  return {
    code: template.code,
    name: template.name,
    operationName: template.operationName,
    items,
  };
}
