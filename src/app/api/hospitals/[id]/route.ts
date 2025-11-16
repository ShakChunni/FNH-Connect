import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// GET /api/hospitals/[id] - Get specific hospital
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromSession(request);

    const { id } = params;

    // Validate ID format
    const hospitalId = parseInt(id);
    if (isNaN(hospitalId)) {
      return NextResponse.json(
        { success: false, error: "Invalid hospital ID" },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: "Hospital not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("GET /api/hospitals/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch hospital",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/hospitals/[id] - Update hospital
// ═══════════════════════════════════════════════════════════════

const updateHospitalSchema = z.object({
  name: z.string().min(1, "Hospital name is required").max(200).optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  type: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { userId, staffId } = await getUserFromSession(request);

    const { id } = params;
    const hospitalId = parseInt(id);
    if (isNaN(hospitalId)) {
      return NextResponse.json(
        { success: false, error: "Invalid hospital ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateHospitalSchema.safeParse(body);

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

    const updateData = validation.data;

    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!existingHospital) {
      return NextResponse.json(
        { success: false, error: "Hospital not found" },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name.trim() !== existingHospital.name) {
      const duplicateHospital = await prisma.hospital.findUnique({
        where: { name: updateData.name.trim() },
      });

      if (duplicateHospital) {
        return NextResponse.json(
          { success: false, error: "Hospital with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update hospital
    const updatedHospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.address !== undefined && {
          address: updateData.address?.trim() || null,
        }),
        ...(updateData.phoneNumber !== undefined && {
          phoneNumber: updateData.phoneNumber?.trim() || null,
        }),
        ...(updateData.email !== undefined && {
          email: updateData.email?.trim() || null,
        }),
        ...(updateData.website !== undefined && {
          website: updateData.website?.trim() || null,
        }),
        ...(updateData.type !== undefined && {
          type: updateData.type?.trim() || null,
        }),
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
        updatedAt: true,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: updatedHospital,
        message: "Hospital updated successfully",
      },
      { status: 200 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/hospitals/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update hospital",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/hospitals/[id] - Delete hospital
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { userId, staffId } = await getUserFromSession(request);

    const { id } = params;
    const hospitalId = parseInt(id);
    if (isNaN(hospitalId)) {
      return NextResponse.json(
        { success: false, error: "Invalid hospital ID" },
        { status: 400 }
      );
    }

    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!existingHospital) {
      return NextResponse.json(
        { success: false, error: "Hospital not found" },
        { status: 404 }
      );
    }

    // Check if hospital has associated infertility patients (prevent deletion if it does)
    const patientCount = await prisma.infertilityPatient.count({
      where: { hospitalId },
    });

    if (patientCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete hospital with associated patients",
          message: `This hospital has ${patientCount} infertility patient(s). Please reassign or delete the patients first.`,
        },
        { status: 409 }
      );
    }

    // Delete hospital
    await prisma.hospital.delete({
      where: { id: hospitalId },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Hospital deleted successfully",
      },
      { status: 200 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("DELETE /api/hospitals/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete hospital",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
