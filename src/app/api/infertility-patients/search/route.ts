import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
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

    // Search infertility patients with case-insensitive partial matching
    const patients = await prisma.infertilityPatient.findMany({
      where: {
        OR: [
          {
            patientFullName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            patientFirstName: {
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
      },
      select: {
        id: true,
        patientFullName: true,
        mobileNumber: true,
        email: true,
        patientAge: true,
        hospitalName: true,
      },
      orderBy: [
        {
          patientFullName: "asc",
        },
      ],
      take: 10, // Limit results for performance
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Patient search error:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
