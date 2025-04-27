import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

interface SortOrderUpdate {
  id: number;
  sortOrder: number;
}

export async function POST(request: NextRequest) {
  try {
    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { message: "Invalid or missing updates data" },
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

    const result = await prisma.$transaction(async (tx) => {
      // Type that matches the actual GoalTask model structure
      const updatedTasks: Array<{
        id: number;
        name: string;
        sortOrder: number | null;
        // Other fields can be included but not necessary for the response
      }> = [];

      // Update each task's sort order
      for (const update of updates) {
        const { id, sortOrder } = update;

        // Skip invalid updates
        if (typeof id !== "number" || typeof sortOrder !== "number") {
          continue;
        }

        // Find the task first to ensure it exists
        const existingTask = await tx.goalTask.findUnique({
          where: { id },
          select: { id: true, name: true },
        });

        if (!existingTask) {
          console.warn(
            `Task with ID ${id} not found, skipping sort order update`
          );
          continue;
        }

        // Update the sort order
        const updatedTask = await tx.goalTask.update({
          where: { id },
          data: { sortOrder },
          select: { id: true, name: true, sortOrder: true }, // Only select fields we need
        });

        updatedTasks.push(updatedTask);
      }

      // Log the activity
      if (updatedTasks.length > 0) {
        await tx.activityLog.create({
          data: {
            username: request.headers.get("x-username") || "system", // Adjust based on your auth setup
            action: "UPDATE_SORT_ORDER",
            description: `Updated sort order for ${updatedTasks.length} tasks`,
            ip_address: clientIp,
            device_type: deviceType,
            timestamp: klTime,
            source_table: "GoalTask",
          },
        });
      }

      return updatedTasks;
    });

    return NextResponse.json({
      message: "Task sort orders updated successfully",
      updatedCount: result.length,
      updatedTasks: result.map((task) => ({
        id: task.id,
        name: task.name,
        sortOrder: task.sortOrder,
      })),
    });
  } catch (error) {
    console.error("Error updating task sort orders:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: `Error updating task sort orders: ${errorMessage}` },
      { status: 500 }
    );
  }
}
