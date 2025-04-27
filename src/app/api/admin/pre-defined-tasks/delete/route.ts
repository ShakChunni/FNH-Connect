import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export async function DELETE(request: NextRequest) {
  try {
    const { taskId, actor } = await request.json();

    if (!taskId || !actor) {
      return NextResponse.json(
        { message: "Task ID and actor are required", success: false },
        { status: 400 }
      );
    }

    // Get client IP address and device info for logging
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

    // Fetch task details before deletion for logging purposes
    const taskToDelete = await prisma.goalTask.findUnique({
      where: { id: taskId },
      include: { taskAssignments: true },
    });

    if (!taskToDelete) {
      return NextResponse.json(
        { message: "Task not found", success: false },
        { status: 404 }
      );
    }

    // Use transaction to ensure all related records are deleted properly
    await prisma.$transaction(async (tx) => {
      // First delete all task assignments
      await tx.taskAssignment.deleteMany({
        where: { taskId },
      });

      // Delete any user goals that reference this task
      await tx.userGoal.deleteMany({
        where: { taskId },
      });

      // Finally delete the task itself
      await tx.goalTask.delete({
        where: { id: taskId },
      });

      // Log the deletion activity
      await tx.activityLog.create({
        data: {
          username: actor,
          action: "DELETE_TASK",
          description: `Deleted task: ${taskToDelete.name}`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
          source_id: taskId,
          source_table: "GoalTask",
        },
      });
    });

    // Return success response
    return NextResponse.json(
      {
        message: "Task deleted successfully",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: `Error deleting task: ${errorMessage}`, success: false },
      { status: 500 }
    );
  }
}
