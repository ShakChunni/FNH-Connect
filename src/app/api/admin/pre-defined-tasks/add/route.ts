import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";
import { MeasurementType } from "@prisma/client";

interface TaskAssignment {
  userId: string | number;
  targetQuantity: number | null;
  targetTime: number | null;
}

interface CreateTaskRequest {
  name: string;
  type: string;
  measurementType: MeasurementType;
  targetType: "QUANTITY" | "TIME" | null;
  assignments: TaskAssignment[];
  notes?: string;
  actor: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      measurementType,
      targetType,
      assignments,
      notes,
      actor,
    } = body as CreateTaskRequest;

    // Validate required fields
    if (!name || !type || !actor || !measurementType) {
      return NextResponse.json(
        { message: "Missing required fields", success: false },
        { status: 400 }
      );
    }

    // Validate measurementType against enum
    if (!Object.values(MeasurementType).includes(measurementType)) {
      return NextResponse.json(
        { message: "Invalid measurement type", success: false },
        { status: 400 }
      );
    }

    // Get client IP and device info
    let clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    if (clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }

    if (clientIp === "::1" || clientIp === "127.0.0.1") {
      clientIp = "localhost";
    }

    const userAgent = request.headers.get("user-agent") || "Unknown";
    const parser = new UAParser(userAgent);
    const parserResult = parser.getResult();
    const deviceType = parserResult.os.name || "Unknown";
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // Create the new task
      const newTask = await tx.goalTask.create({
        data: {
          name,
          type,
          measurementType,
          targetType,
          notes,
          isTemplate: true,
          isActive: true,
          createdBy: actor,
          createdAt: klTime,
          updatedAt: klTime,
        },
      });

      // Create task assignments
      if (assignments?.length > 0) {
        const assignmentPromises = assignments.map((assignment) => {
          const { userId, targetQuantity, targetTime } = assignment;

          // Set targets based on targetType
          const finalTargetQuantity =
            targetType === "QUANTITY" ? targetQuantity : null;
          const finalTargetTime = targetType === "TIME" ? targetTime : null;

          return tx.taskAssignment.create({
            data: {
              userId:
                typeof userId === "string" ? parseInt(userId, 10) : userId,
              taskId: newTask.id,
              targetQuantity: finalTargetQuantity,
              targetTime: finalTargetTime,
              isDailyReset: true,
              isWeeklyReset: false,
              isActive: true,
              isContinuous: false,
              startDate: klTime,
            },
          });
        });

        await Promise.all(assignmentPromises);
      }

      // Log the creation activity
      await tx.activityLog.create({
        data: {
          username: actor,
          action: "CREATE",
          description: `Created new task: ${name}`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
          source_id: newTask.id,
          source_table: "GoalTask",
        },
      });

      return newTask;
    });

    // Return success response
    return NextResponse.json(
      {
        message: "Task created successfully",
        task: result,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: `Error creating task: ${errorMessage}`, success: false },
      { status: 500 }
    );
  }
}
