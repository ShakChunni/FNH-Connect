/**
 * Admission Medicine Package API
 *
 * Thin wrapper around the shared `resolveMedicinePackage` service that
 * keeps the historical response shape expected by the General Admission
 * client (it includes `unitPrice` and `totalAmount` per item even though
 * the service deliberately does not return those values).
 *
 * GET /api/admissions/medicine-packages?code=LUCS_OT_MEDICINE
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getMedicinePackageDefinitions,
  resolveMedicinePackage,
} from "@/services/medicinePackageService";
import { medicinePackageQuerySchema } from "@/lib/medicinePackageSchemas";

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
  departmentId: number | null;
  departmentName: string;
  items: AdmissionMedicinePackageItemResponse[];
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

    const response: AdmissionMedicinePackageResponse = {
      code: resolved.code,
      name: resolved.name,
      operationName: resolved.operationName,
      departmentId: resolved.departmentId,
      departmentName: resolved.departmentName,
      items: resolved.items.map((item) => {
        const unitPrice = item.defaultSalePrice;
        const totalAmount = item.quantity * unitPrice;
        return {
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
          quantity: item.quantity,
          unitPrice,
          totalAmount,
          matchReason: item.matchReason,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/admissions/medicine-packages error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load admission medicine package",
      },
      { status: 500 },
    );
  }
}
