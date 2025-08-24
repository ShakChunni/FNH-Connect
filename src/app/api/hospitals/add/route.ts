import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      phoneNumber,
      email,
      website,
      type,
      username,
      userRole,
    } = body;

    if (!name || !username) {
      return NextResponse.json(
        { error: "Hospital name and authentication required" },
        { status: 400 }
      );
    }

    // Get the staff ID for tracking who created the record
    const staff = await prisma.staff.findFirst({
      where: {
        user: {
          username: username,
        },
      },
      select: {
        id: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 401 }
      );
    }

    // Check if hospital with the same name already exists
    const existingHospital = await prisma.hospital.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingHospital) {
      return NextResponse.json(
        { error: "Hospital with this name already exists" },
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
        createdBy: staff.id,
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
    });

    return NextResponse.json(newHospital, { status: 201 });
  } catch (error) {
    console.error("Hospital creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
