import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pic, taskType, dateSelector } = body;

    const whereConditions: any = {};

    if (dateSelector.start && dateSelector.end) {
      const startDate = new Date(dateSelector.start);
      const endDate = new Date(dateSelector.end);
      endDate.setDate(endDate.getDate() + 1);
      whereConditions.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (taskType.length) {
      whereConditions.taskData = {
        array_contains: taskType.map((type: string) => ({
          type: type,
        })),
      };
    }

    const dailyTaskSummaryQuery = prisma.dailyTaskSummary.findMany({
      where: {
        isLegacy: false,
        user: {
          archived: false,
          username: {
            ...(pic.includes("All") ? {} : { in: pic }),
            mode: "insensitive",
          },
        },
        ...whereConditions,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const dailyTaskSummaries = await dailyTaskSummaryQuery;

    const taskIds = new Set<number>();
    dailyTaskSummaries.forEach((summary) => {
      (summary.taskData as any[]).forEach((task) => {
        taskIds.add(task.taskId);
      });
    });

    const goalTasksQuery = prisma.goalTask.findMany({
      where: {
        id: {
          in: Array.from(taskIds),
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const [goalTasks] = await Promise.all([goalTasksQuery]);

    const taskCreationDates = new Map(
      goalTasks.map((task) => [task.id, task.createdAt])
    );

    const filteredSummaries = dailyTaskSummaries.map((summary) => {
      let filteredTaskData = (summary.taskData as any[]).filter(
        (task) => taskType.length === 0 || taskType.includes(task.type)
      );

      filteredTaskData = filteredTaskData
        .filter((task) => task.quantity > 0 || task.timeSpent > 0)
        .map((task) => ({
          ...task,
          createdAt:
            taskCreationDates.get(task.taskId)?.toISOString() ||
            task.lastUpdated,
        }));

      return {
        ...summary,
        taskData: filteredTaskData,
      };
    });

    const nonEmptySummaries = filteredSummaries.filter(
      (summary) => summary.taskData.length > 0
    );

    return NextResponse.json(nonEmptySummaries);
  } catch (error) {
    console.error("API Route: Error fetching daily task summaries:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching daily task summaries." },
      { status: 500 }
    );
  }
}
