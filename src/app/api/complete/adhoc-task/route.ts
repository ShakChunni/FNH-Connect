import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UAParser } from "ua-parser-js";

const completeTaskSchema = z.object({
  username: z.string(),
  taskId: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, taskId } = completeTaskSchema.parse(body);
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const currentDate = klTime.toISOString().split("T")[0];

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!user) throw new Error("User not found");

      const userGoal = await tx.userGoal.findUnique({
        where: {
          userId_taskId: {
            userId: user.id,
            taskId,
          },
        },
        include: {
          task: {
            select: {
              name: true,
              type: true,
              taskAssignments: {
                where: {
                  userId: user.id,
                  isActive: true,
                },
                select: {
                  targetQuantity: true,
                },
              },
            },
          },
        },
      });

      if (!userGoal) throw new Error("Task not found");

      const taskSummaryData = {
        taskId: taskId,
        name: userGoal.task.name,
        type: userGoal.task.type,
        quantity: userGoal.currentQuantity,
        timeSpent: userGoal.timeSpent,
        targetQuantity: userGoal.task.taskAssignments[0]?.targetQuantity || 0,
        targetMet:
          (userGoal.currentQuantity ?? 0) >=
          (userGoal.task.taskAssignments[0]?.targetQuantity || 0),
        completed: true,
        completionTime: klTime,
        lastUpdated: klTime,
        resetType: "continuous",
        metrics: {
          efficiency: userGoal.timeSpent
            ? (userGoal.currentQuantity || 0) / userGoal.timeSpent
            : 0,
          completion:
            ((userGoal.currentQuantity || 0) /
              (userGoal.task.taskAssignments[0]?.targetQuantity || 1)) *
            100,
        },
      };

      const existingSummary = await tx.dailyTaskSummary.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(currentDate),
          },
        },
      });

      let finalTaskData = [taskSummaryData];
      if (existingSummary) {
        const existingData = existingSummary.taskData as any[];
        finalTaskData = [
          ...existingData.filter((t) => t.taskId !== taskId),
          taskSummaryData,
        ];
      }

      await tx.dailyTaskSummary.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(currentDate),
          },
        },
        create: {
          userId: user.id,
          date: new Date(currentDate),
          taskData: finalTaskData,
          createdAt: klTime,
        },
        update: {
          taskData: finalTaskData,
        },
      });

      // Delete task assignments and user goal
      await tx.taskAssignment.deleteMany({
        where: {
          userId: user.id,
          taskId: taskId,
        },
      });

      await tx.userGoal.delete({
        where: {
          id: userGoal.id,
        },
      });

      await tx.goalTask.update({
        where: {
          id: taskId,
        },
        data: {
          isActive: false,
          updatedAt: klTime,
        },
      });

      // Activity logging
      let clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "Unknown";

      if (clientIp === "::1" || clientIp === "127.0.0.1") {
        clientIp = "localhost";
      }

      const userAgent = req.headers.get("user-agent") || "Unknown";
      const parser = new UAParser(userAgent);
      const userAgentResult = parser.getResult();
      const deviceType = userAgentResult.os.name || "Unknown";

      await tx.activityLog.create({
        data: {
          userId: user.id,
          username,
          action: "COMPLETED_AD_HOC_TASK",
          description: `${username} completed ad-hoc task ${taskId}`,
          source_id: userGoal.id,
          source_table: "UserGoal",
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
        },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error completing task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: error instanceof z.ZodError ? 400 : 500,
      }
    );
  }
}
