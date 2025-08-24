import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Search hospitals from the database
    const hospitals = await prisma.hospital.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            address: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        type: true,
      },
      take: 10, // Limit results
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(hospitals);
  } catch (error) {
    console.error("Hospital search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
