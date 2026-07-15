import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { z } from "zod";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";

// Validation schema for status update
const updateStatusSchema = z.object({
  isCompleted: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/pathology-patients/[id]/status - Update test status
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    // Authenticate user
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json(
        { success: false, error: "Invalid test ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { isCompleted } = validationResult.data;

    const changedAt = new Date();
    const updatedTest = await prisma.$transaction(async (tx) => {
      const existingTest = await tx.pathologyTest.findUnique({
        where: { id: testId },
        select: { id: true },
      });

      if (!existingTest) {
        throw new Error("Pathology test not found");
      }

      // Status changes are updates too. Keep the database modifier and the
      // audit actor aligned so the overview cannot attribute the change to
      // the original creator.
      const updated = await tx.pathologyTest.update({
        where: { id: testId },
        data: {
          isCompleted,
          reportDate: isCompleted ? changedAt : null,
          lastModifiedBy: user.staffId,
        },
        select: {
          id: true,
          isCompleted: true,
          testNumber: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: isCompleted ? "COMPLETED" : "UPDATE",
          description: isCompleted
            ? `Marked pathology test ${updated.testNumber} as completed`
            : `Marked pathology test ${updated.testNumber} as pending`,
          entityType: "PathologyTest",
          entityId: testId,
          timestamp: changedAt,
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

    return addCSRFTokenToResponse(NextResponse.json({
      success: true,
      data: updatedTest,
      message: isCompleted
        ? "Test marked as completed"
        : "Test marked as pending",
    }));
  } catch (error) {
    console.error("PATCH /api/pathology-patients/[id]/status error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error && error.message === "Pathology test not found"
            ? error.message
            : "Failed to update status",
      },
      {
        status:
          error instanceof Error && error.message === "Pathology test not found"
            ? 404
            : 500,
      },
    );
  }
}
