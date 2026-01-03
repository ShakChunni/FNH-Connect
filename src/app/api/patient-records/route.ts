/**
 * Patient Records API Route
 * GET /api/patient-records
 *
 * Returns all patients with optional search filtering and pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    // 3. Build where clause
    const where: Record<string, unknown> = {};

    if (search && search.length >= 2) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { guardianName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // 4. Pagination calculations
    const skip = (page - 1) * limit;

    // 5. Fetch patients with count in parallel
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          guardianName: true,
          guardianDOB: true,
          guardianGender: true,
          guardianPhone: true,
          guardianAddress: true,
          guardianEmail: true,
          address: true,
          phoneNumber: true,
          email: true,
          bloodGroup: true,
          occupation: true,
          guardianOccupation: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: patients,
      total,
      pagination: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[Patient Records API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
