import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

function determineTargetMet(
  measurementType: string,
  targetType: string | null,
  currentQuantity: number,
  currentTime: number,
  targetQuantity: number,
  targetTime: number
): boolean {
  switch (measurementType) {
    case "QUANTITY_ONLY":
      return currentQuantity >= targetQuantity;
    case "TIME_ONLY":
      return currentTime >= targetTime;
    case "BOTH":
      if (targetType === "quantity") {
        return currentQuantity >= targetQuantity;
      } else if (targetType === "time") {
        return currentTime >= targetTime;
      } else {
        return currentQuantity >= targetQuantity && currentTime >= targetTime;
      }
    default:
      return currentQuantity >= targetQuantity;
  }
}

function calculateEfficiency(quantity: number, timeSpent: number): number {
  if (!timeSpent) return 0;
  return quantity / timeSpent;
}

function calculateCompletionPercentage(
  measurementType: string,
  targetType: string | null,
  currentQuantity: number,
  currentTime: number,
  targetQuantity: number,
  targetTime: number
): number {
  switch (measurementType) {
    case "QUANTITY_ONLY":
      return (currentQuantity / Math.max(targetQuantity, 1)) * 100;
    case "TIME_ONLY":
      return (currentTime / Math.max(targetTime, 1)) * 100;
    case "BOTH":
      if (targetType === "quantity") {
        return (currentQuantity / Math.max(targetQuantity, 1)) * 100;
      } else if (targetType === "time") {
        return (currentTime / Math.max(targetTime, 1)) * 100;
      } else {
        const quantityCompletion =
          (currentQuantity / Math.max(targetQuantity, 1)) * 100;
        const timeCompletion = (currentTime / Math.max(targetTime, 1)) * 100;
        return (quantityCompletion + timeCompletion) / 2;
      }
    default:
      return (currentQuantity / Math.max(targetQuantity, 1)) * 100;
  }
}

const resetUserGoals = async (userId: number, klTime: Date) => {
  return await prisma.$transaction(async (tx) => {
    const currentDate = klTime.toISOString().split("T")[0];

    const userGoals = await tx.userGoal.findMany({
      where: {
        userId,
        task: {
          taskAssignments: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            type: true,
            isTemplate: true,
            measurementType: true,
            targetType: true,
            taskAssignments: {
              where: {
                userId,
                isActive: true,
              },
              select: {
                isDailyReset: true,
                isWeeklyReset: true,
                targetQuantity: true,
                targetTime: true,
                isContinuous: true,
              },
            },
          },
        },
      },
    });

    if (userGoals.length === 0) return;

    // Check if there was any activity that day
    const hadActivity = userGoals.some(
      (goal) =>
        (goal.currentQuantity ?? 0) > 0 ||
        (goal.timeSpent ?? 0) > 0 ||
        goal.completed
    );

    // Only create daily summary if there was activity or there are ad-hoc tasks
    const hasAdHocTasks = userGoals.some((goal) => !goal.task.isTemplate);

    if (hadActivity || hasAdHocTasks) {
      const existingSummary = await tx.dailyTaskSummary.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(currentDate),
          },
        },
      });

      const newTaskData = userGoals.map((goal) => {
        const isAdHoc = !goal.task.isTemplate;
        const userAssignment = goal.task.taskAssignments[0];
        const isContinuous = userAssignment?.isContinuous || false;
        const targetQuantity = userAssignment?.targetQuantity || 0;
        const targetTime = userAssignment?.targetTime || 0;

        // Calculate target met based on measurement type
        const targetMet = isAdHoc
          ? goal.completed // For ad-hoc tasks, just use current completion status
          : determineTargetMet(
              goal.task.measurementType,
              goal.task.targetType,
              goal.currentQuantity || 0,
              goal.timeSpent || 0,
              targetQuantity,
              targetTime
            );

        const completion = calculateCompletionPercentage(
          goal.task.measurementType,
          goal.task.targetType,
          isAdHoc && !goal.completed ? 0 : goal.currentQuantity || 0,
          goal.timeSpent || 0,
          targetQuantity || 1,
          targetTime || 1
        );

        return {
          taskId: goal.task.id,
          name: goal.task.name,
          type: goal.task.type,
          quantity: isAdHoc && !goal.completed ? 0 : goal.currentQuantity,
          timeSpent: goal.timeSpent,
          targetQuantity: targetQuantity,
          targetTime: targetTime,
          measurementType: goal.task.measurementType,
          targetType: goal.task.targetType,
          targetMet: targetMet,
          completed: goal.completed,
          completionTime: goal.completed ? goal.updatedAt : null,
          lastUpdated: goal.updatedAt,
          resetType: isContinuous ? "continuous" : "daily",
          metrics: {
            efficiency: calculateEfficiency(
              isAdHoc && !goal.completed ? 0 : goal.currentQuantity || 0,
              goal.timeSpent || 0
            ),
            completion: completion,
          },
        };
      });

      // Merge existing and new task data
      let finalTaskData = newTaskData;
      if (existingSummary) {
        const existingTaskIds = new Set(newTaskData.map((t) => t.taskId));
        const unchangedTasks = (existingSummary.taskData as any[]).filter(
          (t) => !existingTaskIds.has(t.taskId)
        );
        finalTaskData = [...unchangedTasks, ...newTaskData];
      }

      // Update or create daily summary
      await tx.dailyTaskSummary.upsert({
        where: {
          userId_date: {
            userId,
            date: new Date(currentDate),
          },
        },
        create: {
          userId,
          date: new Date(currentDate),
          taskData: finalTaskData,
          createdAt: klTime,
        },
        update: {
          taskData: finalTaskData,
        },
      });
    }

    // Reset template tasks: reset quantities, times, and completion status
    await tx.userGoal.updateMany({
      where: {
        id: {
          in: userGoals.filter((g) => g.task.isTemplate).map((g) => g.id),
        },
      },
      data: {
        currentQuantity: 0,
        timeSpent: 0,
        completed: false,
        lastReset: klTime,
        updatedAt: klTime,
      },
    });

    // Only reset time for ad-hoc tasks, preserve quantity and completion status
    await tx.userGoal.updateMany({
      where: {
        id: {
          in: userGoals.filter((g) => !g.task.isTemplate).map((g) => g.id),
        },
      },
      data: {
        timeSpent: 0,
        lastReset: klTime,
        updatedAt: klTime,
      },
    });
  });
};

export const initGoalReset = () => {
  console.log("[Goal Reset] Initializing cron job...");

  const task = cron.schedule(
    "59 23 * * *",
    async () => {
      console.log("[Goal Reset] Running scheduled task...");
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
      const startTime = klTime.getTime();

      try {
        const users = await prisma.user.findMany({
          where: { archived: false },
          select: { id: true, username: true },
        });

        for (const user of users) {
          try {
            await resetUserGoals(user.id, klTime);
            console.log(`[Goal Reset] Reset completed for ${user.username}`);
          } catch (error) {
            console.error(
              `[Goal Reset Error] Failed for ${user.username}:`,
              error
            );
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[Goal Reset] Completed in ${duration}ms`);
      } catch (error) {
        console.error("[Goal Reset Error]:", error);
      } finally {
        await prisma.$disconnect();
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kuala_Lumpur",
    }
  );

  task.start();
  console.log("[Goal Reset] Cron job started");
  return task;
};
