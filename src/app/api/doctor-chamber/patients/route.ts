import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import { serializeDateOfBirth } from "@/lib/dateOfBirth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    if (search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
          { guardianName: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        phoneNumber: true,
        email: true,
        bloodGroup: true,
        guardianName: true,
        guardianGender: true,
        guardianPhone: true,
        guardianAddress: true,
        guardianEmail: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: patients.map((patient) => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName ?? "",
        fullName: patient.fullName,
        gender: patient.gender,
        dateOfBirth: serializeDateOfBirth(patient.dateOfBirth),
        address: patient.address ?? "",
        phoneNumber: patient.phoneNumber ?? "",
        email: patient.email ?? "",
        bloodGroup: patient.bloodGroup ?? "",
        guardianName: patient.guardianName ?? "",
        guardianGender: patient.guardianGender ?? "",
        guardianPhone: patient.guardianPhone ?? "",
        guardianAddress: patient.guardianAddress ?? "",
        guardianEmail: patient.guardianEmail ?? "",
      })),
    });
  } catch (error) {
    console.error("GET /api/doctor-chamber/patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search patients" },
      { status: 500 },
    );
  }
}
