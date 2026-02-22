/**
 * Medicine by ID API Route
 * PATCH: Update a medicine (excluding stock)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  updateMedicine,
  transformMedicineForResponse,
} from "@/services/medicineInventoryService";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateMedicineSchema = z.object({
  genericName: z.string().min(1, "Generic name is required").max(200),
  brandName: z.string().max(200).optional(),
  groupId: z.number().int().positive("Group is required"),
  strength: z.string().max(50).optional(),
  dosageForm: z.string().max(50).optional(),
  defaultSalePrice: z.number().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const medicineId = parseInt(id, 10);

    if (isNaN(medicineId) || medicineId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid medicine ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = updateMedicineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updated = await updateMedicine(medicineId, validation.data);
    const transformedData = transformMedicineForResponse(updated);

    const response = NextResponse.json(
      {
        success: true,
        data: transformedData,
        message: "Medicine updated successfully",
      },
      { status: 200 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/medicine-inventory/medicines/[id] error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "already exists",
        "Invalid group",
        "Invalid or inactive medicine",
      ];
      if (knownErrors.some((msg) => error.message.includes(msg))) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update medicine",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
