/**
 * Medicine Group by ID API Route
 * PATCH: Update medicine group
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { updateMedicineGroup } from "@/services/medicineInventoryService";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
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
    const groupId = parseInt(id, 10);

    if (isNaN(groupId) || groupId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = updateGroupSchema.safeParse(body);

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

    const group = await updateMedicineGroup(groupId, validation.data.name);

    const response = NextResponse.json(
      { success: true, data: group, message: "Group updated successfully" },
      { status: 200 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/medicine-inventory/groups/[id] error:", error);

    if (error instanceof Error) {
      const knownErrors = ["already exists", "Invalid or inactive group"];
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
        error: "Failed to update medicine group",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
