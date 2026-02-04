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
  createMedicineGroup,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
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
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const groups = await getMedicineGroups(activeOnly);

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
