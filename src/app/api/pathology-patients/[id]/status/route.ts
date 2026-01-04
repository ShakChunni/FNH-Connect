import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { z } from "zod";

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

    // Check if test exists
    const existingTest = await prisma.pathologyTest.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: "Pathology test not found" },
        { status: 404 }
      );
    }

    // Update the status
    const updatedTest = await prisma.pathologyTest.update({
      where: { id: testId },
      data: {
        isCompleted,
        reportDate: isCompleted ? new Date().toISOString() : null,
      },
      select: {
        id: true,
        isCompleted: true,
        testNumber: true,
      },
    });

    // Log activity with device info
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: isCompleted ? "COMPLETED" : "UPDATE",
        description: isCompleted
          ? `Marked pathology test ${updatedTest.testNumber} as completed`
          : `Marked pathology test ${updatedTest.testNumber} as pending`,
        entityType: "PathologyTest",
        entityId: testId,
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

    return NextResponse.json({
      success: true,
      data: updatedTest,
      message: isCompleted
        ? "Test marked as completed"
        : "Test marked as pending",
    });
  } catch (error) {
    console.error("PATCH /api/pathology-patients/[id]/status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
