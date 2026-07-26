/**
 * Patient Update API Route
 * PATCH /api/patient-records/[id]
 *
 * Updates a patient's basic information
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isReceptionistRole, isReceptionistInfertilityRole } from "@/lib/roles";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { parseDateOfBirth, serializeDateOfBirth } from "@/lib/dateOfBirth";
import { patientAddressSchema } from "@/lib/bangladeshAddressSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getPatientAccessWhereByRole(userRole: string, portal?: string) {
  if (portal === "infertility" || isReceptionistInfertilityRole(userRole)) {
    return {
      infertilityRecords: {
        some: {},
      },
    };
  }

  if (isReceptionistRole(userRole)) {
    return {
      infertilityRecords: {
        none: {},
      },
    };
  }

  return {};
}

const updatePatientRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().nullable().optional(),
    gender: z.string().trim().min(1).optional(),
    dateOfBirth: z
      .union([z.string(), z.date(), z.null()])
      .nullable()
      .optional(),
    guardianName: z.string().nullable().optional(),
    guardianDOB: z
      .union([z.string(), z.date(), z.null()])
      .nullable()
      .optional(),
    phoneNumber: z.string().nullable().optional(),
    address: patientAddressSchema.optional(),
  })
  .strict();

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Validate CSRF token
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    // 2. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 3. Get patient ID
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    // 4. Check if patient exists and is accessible for this role
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        ...getPatientAccessWhereByRole(user.role, user.portal),
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found or access denied" },
        { status: 404 },
      );
    }

    // 5. Parse and validate request body
    const body: unknown = await request.json();
    const validation = updatePatientRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      guardianName,
      guardianDOB,
      phoneNumber,
      address,
    } = validation.data;

    // 6. Build update data
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
      updateData.dateOfBirth = parseDateOfBirth(dateOfBirth);
    }
    if (guardianName !== undefined) {
      updateData.guardianName = guardianName || null;
    }
    if (guardianDOB !== undefined) {
      updateData.guardianDOB = parseDateOfBirth(guardianDOB);
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

    // 7. Update patient and log activity in a transaction
    const updatedPatient = await prisma.$transaction(async (tx) => {
      const updated = await tx.patient.update({
        where: { id: patientId },
        data: updateData,
      });

      // Log the update activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          description: `Updated patient details for ${updated.fullName}`,
          entityType: "Patient",
          entityId: updated.id,
          timestamp: new Date(),
          // Device info from session for accountability
          sessionId: user.sessionId,
          ipAddress: user.sessionDeviceInfo.ipAddress,
          deviceFingerprint: user.sessionDeviceInfo.deviceFingerprint,
          readableFingerprint: user.sessionDeviceInfo.readableFingerprint,
          deviceType: user.sessionDeviceInfo.deviceType,
          browserName: user.sessionDeviceInfo.browserName,
          browserVersion: user.sessionDeviceInfo.browserVersion,
          osType: user.sessionDeviceInfo.osType,
        },
      });

      return updated;
    });

    // 8. Return response
    const response = NextResponse.json({
      success: true,
      data: {
        ...updatedPatient,
        dateOfBirth: serializeDateOfBirth(updatedPatient.dateOfBirth),
        guardianDOB: serializeDateOfBirth(updatedPatient.guardianDOB),
      },
      message: "Patient updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("[Patient Update API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
      { status: 500 },
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
        { status: 401 },
      );
    }

    // 2. Get patient ID
    const { id } = await params;
    const patientId = parseInt(id);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    // 3. Fetch patient with role-based access filtering
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        ...getPatientAccessWhereByRole(user.role, user.portal),
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found or access denied" },
        { status: 404 },
      );
    }

    const [creator, latestUpdateLog] = await Promise.all([
      patient.createdBy
        ? prisma.staff.findUnique({
            where: { id: patient.createdBy },
            select: { fullName: true },
          })
        : null,
      prisma.activityLog.findFirst({
        where: {
          entityType: "Patient",
          action: "UPDATE",
          entityId: patientId,
        },
        orderBy: { timestamp: "desc" },
        select: {
          timestamp: true,
          user: {
            select: {
              staff: {
                select: { fullName: true },
              },
            },
          },
        },
      }),
    ]);

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: {
        ...patient,
        createdByName: creator?.fullName || null,
        lastEditedByName: latestUpdateLog?.user?.staff?.fullName || null,
        lastEditedAt: latestUpdateLog?.timestamp || null,
      },
    });
  } catch (error) {
    console.error("[Patient Get API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient" },
      { status: 500 },
    );
  }
}
