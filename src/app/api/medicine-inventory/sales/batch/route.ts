/**
 * Medicine Inventory — Multi-Item Batch Sale API
 *
 * POST /api/medicine-inventory/sales/batch
 *
 * Records a pharmacist direct cart against a central patient in one
 * atomic transaction. Each cart item may consume multiple FIFO purchase
 * batches and therefore produce multiple `MedicineSale` rows. Pricing is
 * pharmacist-supplied and re-calculated server-side; the cart total and
 * line totals are never trusted from the client.
 *
 * The endpoint is intentionally kept under the medicine-inventory
 * middleware prefix; no General Admission permission is exposed.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { createSalesBatch } from "@/services/medicineInventoryService";
import { createSaleBatchSchema } from "@/app/(authenticated)/medicine-inventory/types";

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
    const { id: userId, staffId } = user;

    const body: unknown = await request.json();
    const validation = createSaleBatchSchema.safeParse(body);

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

    const validated = validation.data;

    const result = await createSalesBatch(
      {
        patientId: validated.patientId,
        saleDate: validated.saleDate
          ? new Date(validated.saleDate)
          : undefined,
        items: validated.items,
      },
      staffId,
      userId,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      },
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: `Recorded ${result.logicalItemCount} medicine${result.logicalItemCount === 1 ? "" : "s"} (${result.totalQuantity} unit${result.totalQuantity === 1 ? "" : "s"}) for BDT ${result.totalAmount.toLocaleString()}.`,
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/sales/batch error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "Patient not found",
        "Invalid or inactive",
        "Insufficient stock",
        "No stock available",
        "Insufficient batch",
        "cannot be in the future",
        "Sale date is invalid",
        "cannot be before first stock purchase date",
        "No stock purchase history found",
        "Duplicate medicine context in cart",
        "Patient is required",
        "At least one medicine is required",
        "One or more medicines are missing or inactive",
        "Selected medicine is not available",
        "Quantity must be a positive whole number",
        "Unit price must be greater than zero",
        "A single cart can contain up to 100 medicines",
        "Package admission context",
        "Package item context",
        "Invalid medicine package",
        "Medicine package does not match",
        "Invalid medicine package operation",
        "Package item does not belong to the selected package",
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
        error: "Failed to record sale",
      },
      { status: 500 },
    );
  }
}
