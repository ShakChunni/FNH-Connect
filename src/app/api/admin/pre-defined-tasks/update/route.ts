import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";
import { MeasurementType } from "@prisma/client";

interface TaskAssignment {
  userId: string | number;
  targetQuantity: number | null;
  targetTime: number | null;
}

interface UpdateTaskRequest {
  id: number;
  name: string;
  type: string;
  measurementType: string; // Changed to string as it comes from client
  targetType: string | null;
  isActive?: boolean;
  assignments: TaskAssignment[];
  actor: string;
}

// Helper function to match measurement type string to enum
function getMeasurementTypeEnum(type: string): MeasurementType {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case "QUANTITY_ONLY":
      return MeasurementType.QUANTITY_ONLY;
    case "TIME_ONLY":
      return MeasurementType.TIME_ONLY;
    case "COMPLETION_ONLY":
      return MeasurementType.COMPLETION_ONLY;
    case "BOTH":
    default:
      return MeasurementType.BOTH;
  }
}

// Helper function to validate target type
function validateTargetType(type: string | null): "QUANTITY" | "TIME" | null {
  if (!type) return null;
  const upperType = type.toUpperCase();
  return upperType === "QUANTITY" || upperType === "TIME"
    ? (upperType as "QUANTITY" | "TIME")
    : null;
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      measurementType,
      targetType,
      isActive,
      assignments,
      actor,
    } = body as UpdateTaskRequest;

    if (!id || !actor) {
      return NextResponse.json(
        { message: "Missing required fields" },
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
      // Find existing task
      const existingTask = await tx.goalTask.findUnique({
        where: { id },
        include: { taskAssignments: true },
      });

      if (!existingTask) {
        throw new Error(`Task with ID ${id} not found`);
      }

      // Handle status toggle
      if (isActive !== undefined && !name && !type) {
        const updatedTask = await tx.goalTask.update({
          where: { id },
          data: { isActive },
        });

        await tx.activityLog.create({
          data: {
            username: actor,
            action: "UPDATE",
            description: `${isActive ? "Activated" : "Deactivated"} task ${
              existingTask.name
            }`,
            ip_address: clientIp,
            device_type: deviceType,
            timestamp: klTime,
            source_id: id,
            source_table: "GoalTask",
          },
        });

        return updatedTask;
      }

      // Full update validation
      if (!name || !type || !measurementType) {
        throw new Error(
          "Name, type, and measurement type are required for task updates"
        );
      }

      // Convert measurement type to enum and validate target type
      const dbMeasurementType = getMeasurementTypeEnum(measurementType);
      const validatedTargetType = validateTargetType(targetType);

      // Update task details
      const updatedTask = await tx.goalTask.update({
        where: { id },
        data: {
          name,
          type,
          measurementType: dbMeasurementType,
          targetType: validatedTargetType,
          isActive: isActive !== undefined ? isActive : existingTask.isActive,
          updatedAt: klTime,
        },
      });

      // Handle assignments
      if (assignments && assignments.length > 0) {
        const existingAssignments = existingTask.taskAssignments || [];
        const existingUserIds = existingAssignments.map((a) => a.userId);

        // Update or create assignments
        for (const assignment of assignments) {
          const { userId, targetQuantity, targetTime } = assignment;
          const parsedUserId =
            typeof userId === "string" ? parseInt(userId, 10) : userId;

          const existingAssignment = existingAssignments.find(
            (a) => a.userId === parsedUserId
          );

          // Set targets based on validated target type
          const finalTargetQuantity =
            validatedTargetType === "QUANTITY" ? targetQuantity : null;
          const finalTargetTime =
            validatedTargetType === "TIME" ? targetTime : null;

          if (existingAssignment) {
            // Update if targets changed
            if (
              existingAssignment.targetQuantity !== finalTargetQuantity ||
              existingAssignment.targetTime !== finalTargetTime
            ) {
              await tx.taskAssignment.update({
                where: { id: existingAssignment.id },
                data: {
                  targetQuantity: finalTargetQuantity,
                  targetTime: finalTargetTime,
                },
              });
            }
          } else {
            // Create new assignment
            await tx.taskAssignment.create({
              data: {
                userId: parsedUserId,
                taskId: id,
                targetQuantity: finalTargetQuantity,
                targetTime: finalTargetTime,
                isDailyReset: true,
                isWeeklyReset: false,
                isContinuous: false,
                startDate: klTime,
                isActive: true,
              },
            });
          }
        }

        // Remove old assignments
        const newUserIds = assignments.map((a) =>
          typeof a.userId === "string" ? parseInt(a.userId, 10) : a.userId
        );
        const usersToRemove = existingUserIds.filter(
          (id) => !newUserIds.includes(id)
        );

        if (usersToRemove.length > 0) {
          await tx.taskAssignment.deleteMany({
            where: {
              taskId: id,
              userId: { in: usersToRemove },
            },
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          username: actor,
          action: "UPDATE",
          description: `Updated task ${name}`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
          source_id: id,
          source_table: "GoalTask",
        },
      });

      return updatedTask;
    });

    return NextResponse.json({
      message: "Task updated successfully",
      task: result,
      success: true,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: `Error updating task: ${errorMessage}`, success: false },
      { status: 500 }
    );
  }
}
