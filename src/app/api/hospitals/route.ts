import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import {
  hospitalQuerySchema,
  createHospitalSchema as importedCreateHospitalSchema,
} from "@/app/(authenticated)/infertility/types/schemas";

// ═══════════════════════════════════════════════════════════════
// GET /api/hospitals - List hospitals with optional search/filter
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = hospitalQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { search, type, limit = 50 } = validation.data;

    // Build where clause for filtering
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) {
      where.type = type;
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        type: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
      take: Math.min(limit, 100), // Max 100 results
    });

    return NextResponse.json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    console.error("GET /api/hospitals error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch hospitals",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/hospitals - Create new hospital
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { staffId } = user;

    const body = await request.json();
    const validation = importedCreateHospitalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, address, phoneNumber, email, website, type } =
      validation.data;

    // Check if hospital with the same name already exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { name: name.trim() },
    });

    if (existingHospital) {
      return NextResponse.json(
        { success: false, error: "Hospital with this name already exists" },
        { status: 409 }
      );
    }

    // Create new hospital
    const newHospital = await prisma.hospital.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        type: type?.trim() || null,
        createdBy: staffId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        type: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: newHospital,
        message: "Hospital created successfully",
      },
      { status: 201 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/hospitals error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create hospital",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
