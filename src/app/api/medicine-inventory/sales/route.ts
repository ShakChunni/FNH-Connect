/**
 * Medicine Sales API Route
 * GET: List all sales entries with filtering
 * POST: Create a new sale entry (FIFO stock deduction)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getSales, createSale } from "@/services/medicineInventoryService";
import { z } from "zod";

const createSaleSchema = z.object({
  patientId: z.number().int().positive("Patient ID is required"),
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive").optional(),
  saleDate: z.string().optional(),
});

const saleFiltersSchema = z.object({
  search: z.string().optional(),
  patientId: z.coerce.number().int().positive().optional(),
  medicineId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Sales
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
    const validation = saleFiltersSchema.safeParse(rawFilters);

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
    const { sales, total, page, limit } = await getSales(filters);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/sales error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sales",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Sale
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
    const validation = createSaleSchema.safeParse(body);

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
    const sale = await createSale(
      {
        patientId: validated.patientId,
        medicineId: validated.medicineId,
        quantity: validated.quantity,
        unitPrice: validated.unitPrice,
        saleDate: validated.saleDate ? new Date(validated.saleDate) : undefined,
      },
      staffId,
      userId,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      },
    );

    const response = NextResponse.json(
      { success: true, data: sale, message: "Sale recorded successfully" },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/sales error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "Patient not found",
        "Invalid or inactive",
        "Insufficient stock",
        "No stock available",
        "Insufficient batch",
        "cannot be in the future",
        "cannot be before first stock purchase date",
        "No stock purchase history found",
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
        error: "Failed to create sale",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
