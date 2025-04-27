import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const currentDate = klTime.toISOString().split("T")[0];

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch tasks and daily summaries in parallel
    const [tasks, allDailySummaries] = await Promise.all([
      prisma.goalTask.findMany({
        where: {
          isActive: true,
          taskAssignments: {
            some: { userId: user.id, isActive: true },
          },
        },
        select: {
          id: true,
          sortOrder: true,
          name: true,
          type: true,
          measurementType: true, // Add this field
          targetType: true, // Add this field
          isTemplate: true,
          isActive: true,
          notes: true,
          meetingType: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          taskAssignments: {
            where: {
              userId: user.id,
              isActive: true,
            },
            select: {
              targetQuantity: true,
              targetTime: true, // Add this field
              isDailyReset: true,
              isWeeklyReset: true,
              isContinuous: true,
            },
          },
          userGoals: {
            where: {
              userId: user.id,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              currentQuantity: true,
              timeSpent: true,
              lastReset: true,
              completed: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.dailyTaskSummary.findMany({
        where: {
          userId: user.id,
        },
        select: {
          date: true,
          taskData: true,
        },
        orderBy: {
          date: "desc",
        },
      }),
    ]);

    // Filter out tasks needing history
    const tasksNeedingHistory = tasks.filter(
      (task) =>
        !task.isTemplate &&
        task.isActive &&
        new Date(task.createdAt) < new Date(currentDate)
    );

    // Process history data for all tasks in one pass through summaries
    const historicalData =
      tasksNeedingHistory.length > 0
        ? tasksNeedingHistory.map((task) => {
            // Create a map of task ID to its summaries
            const taskSummaries = allDailySummaries
              .filter((summary) => {
                const taskDataArray = summary.taskData as any[];
                return taskDataArray.some(
                  (data) => Number(data.taskId) === task.id
                );
              })
              .map((summary) => ({
                date: summary.date,
                taskData: (summary.taskData as any[]).find(
                  (t) => Number(t.taskId) === task.id
                ),
              }));

            // Calculate historical quantities and time
            const isContinuous = task.taskAssignments[0]?.isContinuous || false;

            // For continuous tasks, get the first entry for quantity
            let historicalQuantity = 0;
            if (isContinuous && taskSummaries.length > 0) {
              const firstEntry = [...taskSummaries].sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )[0];
              historicalQuantity = firstEntry.taskData?.quantity || 0;
            }

            // Calculate historical time spent (excluding today)
            const timeSpent = taskSummaries.reduce((total, summary) => {
              const summaryDate = new Date(summary.date)
                .toISOString()
                .split("T")[0];
              if (summaryDate === currentDate) return total;
              return total + (summary.taskData?.timeSpent || 0);
            }, 0);

            return {
              taskId: task.id,
              historicalTimeSpent: timeSpent,
              historicalQuantity: historicalQuantity,
            };
          })
        : [];

    // Create a map for quick lookup
    const historicalMap = new Map(
      historicalData.map((item) => [item.taskId, item])
    );

    // Format tasks with historical data
    const formattedTasks = tasks.map((task) => {
      const isContinuous = task.taskAssignments[0]?.isContinuous || false;
      const historical = historicalMap.get(task.id);

      const quantity = isContinuous
        ? Math.max(
            historical?.historicalQuantity || 0,
            task.userGoals[0]?.currentQuantity || 0
          )
        : task.userGoals[0]?.currentQuantity || 0;

      return {
        id: task.id,
        sortOrder: task.sortOrder,
        name: task.name,
        type: task.type,
        measurementType: task.measurementType, // Include measurement type
        targetType: task.targetType, // Include target type
        isTemplate: task.isTemplate,
        isActive: task.isActive,
        notes: task.notes || "",
        meetingType: task.meetingType || "",
        targetQuantity: task.taskAssignments[0]?.targetQuantity || 0,
        targetTime: task.taskAssignments[0]?.targetTime || 0, // Include target time
        currentQuantity: quantity,
        timeSpent: task.userGoals[0]?.timeSpent || 0,
        historicalTimeSpent: historical?.historicalTimeSpent || 0,
        totalTimeSpent:
          (task.userGoals[0]?.timeSpent || 0) +
          (historical?.historicalTimeSpent || 0),
        isDailyReset: task.taskAssignments[0]?.isDailyReset || false,
        isWeeklyReset: task.taskAssignments[0]?.isWeeklyReset || false,
        isContinuous: isContinuous,
        lastReset: task.userGoals[0]?.lastReset || new Date(),
        completed: task.userGoals[0]?.completed || false,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        createdBy: task.createdBy,
      };
    });

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 }
    );
  }
}
