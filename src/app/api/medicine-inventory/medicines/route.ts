/**
 * Medicines API Route
 * GET: List all medicines with filtering
 * POST: Create a new medicine
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getMedicines,
  createMedicine,
  transformMedicineForResponse,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const createMedicineSchema = z.object({
  genericName: z.string().min(1, "Generic name is required").max(200),
  brandName: z.string().max(200).optional(),
  groupId: z.number().int().positive("Group is required"),
  strength: z.string().max(50).optional(),
  dosageForm: z.string().max(50).optional(),
  defaultSalePrice: z.number().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

const medicineFiltersSchema = z.object({
  search: z.string().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  lowStockOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Medicines
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
    const validation = medicineFiltersSchema.safeParse(rawFilters);

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
    const { medicines, total, page, limit } = await getMedicines(filters);

    // Transform data for response
    const transformedData = medicines.map(transformMedicineForResponse);

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/medicines error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medicines",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Medicine
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

    const body = await request.json();
    const validation = createMedicineSchema.safeParse(body);

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

    const medicine = await createMedicine(validation.data);
    const transformedData = transformMedicineForResponse(medicine);

    const response = NextResponse.json(
      { success: true, data: transformedData },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/medicines error:", error);

    if (error instanceof Error) {
      const knownErrors = ["already exists", "Invalid group"];
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
        error: "Failed to create medicine",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
