/**
 * Profile API
 * PATCH: Update editable contact details for the authenticated user's staff profile.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  email: z
    .string()
    .trim()
    .max(200, "Email must be 200 characters or less")
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Invalid email address",
    }),
  phoneNumber: z
    .string()
    .trim()
    .max(50, "Phone number must be 50 characters or less"),
});

interface UpdateProfileSuccessResponse {
  success: true;
  message: string;
  data: {
    email: string | null;
    phoneNumber: string | null;
  };
}

interface UpdateProfileErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

type UpdateProfileResponse =
  | UpdateProfileSuccessResponse
  | UpdateProfileErrorResponse;

export async function PATCH(
  request: NextRequest,
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const authUser = await getAuthenticatedUserForAPI();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const rawBody: unknown = await request.json();
    const validation = updateProfileSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, phoneNumber } = validation.data;

    const updatedStaff = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.update({
        where: { id: authUser.staffId },
        data: {
          email: email || null,
          phoneNumber: phoneNumber || null,
        },
        select: {
          email: true,
          phoneNumber: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "PROFILE_CONTACT_UPDATED",
          description: "Updated own profile contact details",
          entityType: "Staff",
          entityId: authUser.staffId,
          sessionId: authUser.sessionId,
          ipAddress: authUser.sessionDeviceInfo.ipAddress,
          deviceFingerprint: authUser.sessionDeviceInfo.deviceFingerprint,
          readableFingerprint: authUser.sessionDeviceInfo.readableFingerprint,
          deviceType: authUser.sessionDeviceInfo.deviceType,
          browserName: authUser.sessionDeviceInfo.browserName,
          browserVersion: authUser.sessionDeviceInfo.browserVersion,
          osType: authUser.sessionDeviceInfo.osType,
        },
      });

      return staff;
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Profile contact details updated successfully.",
        data: updatedStaff,
      },
      { status: 200 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/profile error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update profile. Please try again." },
      { status: 500 },
    );
  }
}
