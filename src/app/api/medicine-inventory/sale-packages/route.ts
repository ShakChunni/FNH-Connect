/**
 * Medicine Inventory — Sale Package Resolver API
 *
 * GET /api/medicine-inventory/sale-packages?code=LUCS_OT_MEDICINE
 *
 * Thin wrapper around the shared `resolveMedicinePackage` service used
 * by the pharmacist-side multi-item sale modal. It returns one row per
 * template item with live medicine match metadata, current stock and
 * default sale price, in the same shape the Admission route uses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isAdminRole, normalizeRole, SystemRole } from "@/lib/roles";
import {
  createMedicinePackage,
  deleteMedicinePackage,
  getMedicinePackageDefinitions,
  resolveMedicinePackage,
  updateMedicinePackage,
} from "@/services/medicinePackageService";
import {
  medicinePackageDefinitionSchema,
  medicinePackageQuerySchema,
} from "@/lib/medicinePackageSchemas";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";

const DEFAULT_QUANTITY = 1;

export interface MedicineInventoryPackageItemResponse {
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

export interface MedicineInventoryPackageResponse {
  code: string;
  name: string;
  operationName: string;
  items: MedicineInventoryPackageItemResponse[];
}

function canManageMedicinePackages(role: string): boolean {
  return (
    isAdminRole(role) ||
    normalizeRole(role) === SystemRole.MEDICINE_PHARMACIST
  );
}

function packageError(error: unknown): string {
  return error instanceof Error ? error.message : "Package operation failed";
}

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
    const validation = medicinePackageQuerySchema.safeParse({
      code: searchParams.get("code") ?? undefined,
      mode: searchParams.get("mode") ?? undefined,
    });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid medicine package code" },
        { status: 400 },
      );
    }

    const requestedCode = validation.data.code;
    if (validation.data.mode === "manage") {
      if (!canManageMedicinePackages(user.role)) {
        return NextResponse.json(
          { success: false, error: "You cannot manage medicine packages" },
          { status: 403 },
        );
      }
      return NextResponse.json({
        success: true,
        data: await getMedicinePackageDefinitions(),
      });
    }

    const definitions = await getMedicinePackageDefinitions();
    const fallbackCode = definitions[0]?.code ?? "";
    const code = requestedCode || fallbackCode;

    const resolved = await resolveMedicinePackage(code);
    if (!resolved) {
      return NextResponse.json(
        {
          success: false,
          error: "Medicine package not found",
        },
        { status: 404 },
      );
    }

    const response: MedicineInventoryPackageResponse = {
      code: resolved.code,
      name: resolved.name,
      operationName: resolved.operationName,
      items: resolved.items.map((item) => ({
        templateName: item.templateName,
        matched: item.matched,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        genericName: item.genericName,
        groupName: item.groupName,
        companyName: item.companyName,
        defaultSalePrice: item.defaultSalePrice,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        quantity: item.quantity || DEFAULT_QUANTITY,
        matchReason: item.matchReason,
      })),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/sale-packages error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load medicine package",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (!canManageMedicinePackages(user.role)) {
      return NextResponse.json(
        { success: false, error: "You cannot manage medicine packages" },
        { status: 403 },
      );
    }

    const validation = medicinePackageDefinitionSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid package definition",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const packageDefinition = await createMedicinePackage(
      validation.data,
      user.id,
    );
    return addCSRFTokenToResponse(
      NextResponse.json({ success: true, data: packageDefinition }, { status: 201 }),
    );
  } catch (error) {
    const message = packageError(error);
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (!canManageMedicinePackages(user.role)) {
      return NextResponse.json(
        { success: false, error: "You cannot manage medicine packages" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const validation = medicinePackageDefinitionSchema.safeParse(body);
    if (!validation.success || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid package definition" },
        { status: 400 },
      );
    }

    const packageDefinition = await updateMedicinePackage(
      code,
      validation.data,
      user.id,
    );
    return addCSRFTokenToResponse(
      NextResponse.json({ success: true, data: packageDefinition }),
    );
  } catch (error) {
    const message = packageError(error);
    const status = message.includes("not found")
      ? 404
      : message.includes("already exists")
        ? 409
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (!canManageMedicinePackages(user.role)) {
      return NextResponse.json(
        { success: false, error: "You cannot manage medicine packages" },
        { status: 403 },
      );
    }

    const code = new URL(request.url).searchParams.get("code") ?? "";
    if (!code.trim()) {
      return NextResponse.json(
        { success: false, error: "Package code is required" },
        { status: 400 },
      );
    }
    await deleteMedicinePackage(code, user.id);
    return addCSRFTokenToResponse(
      NextResponse.json({ success: true, message: "Medicine package deleted" }),
    );
  } catch (error) {
    const message = packageError(error);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
