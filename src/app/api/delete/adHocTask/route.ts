import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export async function DELETE(req: NextRequest) {
  try {
    const { id, username } = await req.json();

    if (!id || !username) {
      return NextResponse.json(
        { error: "Missing required fields: id or username" },
        { status: 400 }
      );
    }
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    // Find the task by id
    const task = await prisma.goalTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the task assignment
    await prisma.taskAssignment.deleteMany({
      where: { taskId: id },
    });

    // Delete the task
    await prisma.goalTask.delete({
      where: { id },
    });

    const formattedName =
      task.name.charAt(0).toUpperCase() + task.name.slice(1);

    // Log the deletion of the ad hoc task
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username,
        action: "DELETE_AD_HOC_TASK",
        description: `${username} deleted ad-hoc task ${id} - ${formattedName}`,
        source_id: id,
        source_table: "GoalTask",
        ip_address:
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          req.headers.get("x-real-ip") ||
          "Unknown",
        device_type:
          new UAParser(req.headers.get("user-agent") || "Unknown").getResult()
            .os.name || "Unknown",
        timestamp: klTime,
      },
    });

    return NextResponse.json({
      message: "Ad hoc task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ad hoc task:", error);
    return NextResponse.json(
      { error: "Error deleting ad hoc task" },
      { status: 500 }
    );
  }
}
