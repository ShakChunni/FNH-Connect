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
import { resolveMedicinePackage } from "@/services/medicinePackageService";
import { MEDICINE_PACKAGE_TEMPLATES } from "@/lib/medicinePackageTemplates";
import { medicinePackageQuerySchema } from "@/lib/medicinePackageSchemas";

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
    });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid medicine package code" },
        { status: 400 },
      );
    }

    const requestedCode = validation.data.code;
    const fallbackCode = MEDICINE_PACKAGE_TEMPLATES[0]?.code ?? "";
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
