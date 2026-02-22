/**
 * Medicine Company by ID API Route
 * PATCH: Update medicine company
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { updateMedicineCompany } from "@/services/medicineInventoryService";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  address: z.string().max(500).optional(),
  phoneNumber: z.string().max(50).optional(),
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
    const companyId = parseInt(id, 10);

    if (isNaN(companyId) || companyId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid company ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = updateCompanySchema.safeParse(body);

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

    const company = await updateMedicineCompany(companyId, validation.data);

    const response = NextResponse.json(
      { success: true, data: company, message: "Company updated successfully" },
      { status: 200 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/medicine-inventory/companies/[id] error:", error);

    if (error instanceof Error) {
      const knownErrors = ["already exists", "Invalid or inactive company"];
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
        error: "Failed to update medicine company",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
