import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const searchBy = searchParams.get("searchBy") || "both";
    const username = searchParams.get("username");
    const userRole = searchParams.get("userRole");

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    if (!username) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Build search conditions based on searchBy parameter
    let whereCondition: any = {};

    if (searchBy === "name") {
      whereCondition = {
        patientFullName: {
          contains: query,
          mode: "insensitive",
        },
      };
    } else if (searchBy === "mobile") {
      whereCondition = {
        mobileNumber: {
          contains: query,
          mode: "insensitive",
        },
      };
    } else {
      // Default: search both name and mobile
      whereCondition = {
        OR: [
          {
            patientFullName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            mobileNumber: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // Search infertility patients from the database
    const patients = await prisma.infertilityPatient.findMany({
      where: whereCondition,
      select: {
        id: true,
        patientFullName: true,
        mobileNumber: true,
        patientAge: true,
        hospitalName: true,
      },
      take: 10, // Limit results
      orderBy: {
        patientFullName: "asc",
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Patient search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
