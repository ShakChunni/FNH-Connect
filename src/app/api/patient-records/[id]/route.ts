/**
 * Patient Update API Route
 * PATCH /api/patient-records/[id]
 *
 * Updates a patient's basic information
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get patient ID
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // 3. Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      guardianName,
      phoneNumber,
      address,
    } = body;

    // 5. Build update data
    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName || null;
    }
    if (gender !== undefined) {
      updateData.gender = gender;
    }
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (guardianName !== undefined) {
      updateData.guardianName = guardianName || null;
    }
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber || null;
    }
    if (address !== undefined) {
      updateData.address = address || null;
    }

    // Update fullName if first or last name changed
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName =
        firstName !== undefined ? firstName : existingPatient.firstName;
      const newLastName =
        lastName !== undefined ? lastName : existingPatient.lastName;
      updateData.fullName = newLastName
        ? `${newFirstName} ${newLastName}`
        : newFirstName;
    }

    // 6. Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: updatedPatient,
      message: "Patient updated successfully",
    });
  } catch (error) {
    console.error("[Patient Update API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get patient ID
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // 3. Fetch patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("[Patient Get API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}
