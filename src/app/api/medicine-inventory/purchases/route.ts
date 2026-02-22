/**
 * Medicine Purchases API Route
 * GET: List all purchase entries with filtering
 * POST: Create a new purchase entry (with stock update)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getPurchases,
  createPurchase,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const createPurchaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").max(100),
  companyId: z.number().int().positive("Company is required"),
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
});

const purchaseFiltersSchema = z.object({
  search: z.string().optional(),
  companyId: z.coerce.number().int().positive().optional(),
  medicineId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Purchases
// ═══════════════════════════════════════════════════════════════

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
    const rawFilters = Object.fromEntries(searchParams.entries());
    const validation = purchaseFiltersSchema.safeParse(rawFilters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const filters = validation.data;
    const { purchases, total, page, limit } = await getPurchases(filters);

    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/purchases error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchases",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Purchase
// ═══════════════════════════════════════════════════════════════

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

    const body = await request.json();
    const validation = createPurchaseSchema.safeParse(body);

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
    const purchase = await createPurchase(
      {
        invoiceNumber: validated.invoiceNumber,
        companyId: validated.companyId,
        medicineId: validated.medicineId,
        quantity: validated.quantity,
        unitPrice: validated.unitPrice,
        purchaseDate: validated.purchaseDate
          ? new Date(validated.purchaseDate)
          : undefined,
        expiryDate: validated.expiryDate
          ? new Date(validated.expiryDate)
          : undefined,
        batchNumber: validated.batchNumber,
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
        data: purchase,
        message: "Purchase recorded successfully",
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/purchases error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "Invalid or inactive",
        "already exists",
        "cannot be in the future",
        "Expiry date cannot be earlier than purchase date",
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
        error: "Failed to create purchase",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
