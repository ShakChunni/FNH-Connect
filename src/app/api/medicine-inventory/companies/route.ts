/**
 * Medicine Companies API Route
 * GET: List all pharmaceutical companies/suppliers
 * POST: Create a new company
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getMedicineCompanies,
  createMedicineCompany,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  address: z.string().max(500).optional(),
  phoneNumber: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Medicine Companies
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
    const search = searchParams.get("search") || undefined;

    const companies = await getMedicineCompanies(activeOnly, search);

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/companies error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medicine companies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Medicine Company
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
    const validation = createCompanySchema.safeParse(body);

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

    const company = await createMedicineCompany(validation.data);

    const response = NextResponse.json(
      { success: true, data: company },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/companies error:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create medicine company",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
