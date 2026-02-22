/**
 * Medicine Groups API Route
 * GET: List all medicine groups
 * POST: Create a new medicine group
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getMedicineGroups,
  getPaginatedMedicineGroups,
  createMedicineGroup,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
});

const groupFiltersSchema = z.object({
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Medicine Groups
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
    const validation = groupFiltersSchema.safeParse(rawFilters);

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

    if (filters.page || filters.limit) {
      const { groups, total, page, limit } = await getPaginatedMedicineGroups({
        activeOnly: filters.activeOnly,
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      });

      return NextResponse.json({
        success: true,
        data: groups,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const groups = await getMedicineGroups(filters.activeOnly);

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medicine groups",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Medicine Group
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
    const validation = createGroupSchema.safeParse(body);

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

    const group = await createMedicineGroup(validation.data.name);

    const response = NextResponse.json(
      { success: true, data: group },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/groups error:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create medicine group",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
