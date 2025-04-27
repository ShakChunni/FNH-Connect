import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import DeviceDetector from "node-device-detector";

const updateSchema = z.object({
  username: z.string(),
  updates: z.array(
    z.object({
      taskId: z.number(),
      qty: z.number(),
      time: z.number(),
    })
  ),
});

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, updates } = updateSchema.parse(body);
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const currentDate = klTime.toISOString().split("T")[0];

    // Main update logic, no activity log in transaction
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) throw new Error("User not found");

    const updatedGoals = await Promise.all(
      updates.map(async (update) => {
        const { taskId, qty, time } = update;

        const task = await prisma.goalTask.findUnique({
          where: { id: taskId },
          include: {
            taskAssignments: {
              where: { userId: user.id, isActive: true },
            },
          },
        });

        if (!task) throw new Error(`Task ${taskId} not found`);

        const userAssignment = task.taskAssignments.find(
          (assignment) => assignment.userId === user.id
        );

        const targetQuantity = userAssignment?.targetQuantity || 0;
        const targetTime = userAssignment?.targetTime || 0;

        const targetMet = determineTargetMet(
          task.measurementType,
          task.targetType,
          qty || 0,
          time || 0,
          targetQuantity,
          targetTime
        );

        const userGoal = await prisma.userGoal.upsert({
          where: {
            userId_taskId: { userId: user.id, taskId },
          },
          create: {
            userId: user.id,
            taskId,
            currentQuantity: qty,
            timeSpent: time,
            lastReset: klTime,
            completed: targetMet,
          },
          update: {
            currentQuantity: qty,
            timeSpent: time,
            completed: targetMet,
            updatedAt: klTime,
          },
        });

        return { userGoal, task, targetMet, qty, time };
      })
    );

    const existingSummary = await prisma.dailyTaskSummary.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(currentDate),
        },
      },
    });

    const allTaskData = await Promise.all(
      updatedGoals.map(async ({ userGoal, task, targetMet }) => {
        const userAssignment = task.taskAssignments.find(
          (assignment) => assignment.userId === user.id
        );

        const isContinuous = userAssignment?.isContinuous || false;
        const targetQuantity = userAssignment?.targetQuantity || 0;
        const targetTime = userAssignment?.targetTime || 0;

        let quantity = userGoal.currentQuantity;

        if (isContinuous) {
          const firstEntry = await prisma.dailyTaskSummary.findFirst({
            where: {
              userId: user.id,
              taskData: { array_contains: [{ taskId: task.id }] },
            },
            orderBy: { date: "asc" },
          });

          if (firstEntry) {
            const taskData = (firstEntry.taskData as any[]).find(
              (t) => t.taskId === task.id
            );
            quantity = taskData?.quantity ?? userGoal.currentQuantity;
          }
        }

        let existingCompletionTime = null;
        if (existingSummary) {
          const existingTask = (existingSummary.taskData as any[]).find(
            (t) => t.taskId === task.id
          );
          existingCompletionTime = existingTask?.completionTime;
        }

        const completionTime = targetMet
          ? existingCompletionTime || userGoal.updatedAt
          : null;

        const completion = calculateCompletionPercentage(
          task.measurementType,
          task.targetType,
          quantity || 0,
          userGoal.timeSpent || 0,
          targetQuantity || 1,
          targetTime || 1
        );

        return {
          taskId: task.id,
          name: task.name,
          type: task.type,
          quantity,
          timeSpent: userGoal.timeSpent,
          targetQuantity: targetQuantity,
          targetTime: targetTime,
          measurementType: task.measurementType,
          targetType: task.targetType,
          targetMet: targetMet,
          completed: userGoal.completed,
          completionTime: completionTime,
          lastUpdated: userGoal.updatedAt,
          resetType: isContinuous ? "continuous" : "daily",
          metrics: {
            efficiency: calculateEfficiency(
              quantity || 0,
              userGoal.timeSpent || 0
            ),
            completion: completion,
          },
        };
      })
    );

    let finalTaskData = allTaskData;
    if (existingSummary) {
      const existingTaskIds = new Set(allTaskData.map((t) => t.taskId));
      const unchangedTasks = (existingSummary.taskData as any[]).filter(
        (t) => !existingTaskIds.has(t.taskId)
      );
      finalTaskData = [...unchangedTasks, ...allTaskData];
    }

    await prisma.dailyTaskSummary.upsert({
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

    const verifiedSummary = await prisma.dailyTaskSummary.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(currentDate),
        },
      },
    });

    if (!verifiedSummary) {
      throw new Error("Failed to verify daily task summary update");
    }

    const summaryTaskIds = new Set(
      (verifiedSummary.taskData as any[]).map((t) => t.taskId)
    );
    const missingTasks = allTaskData.filter(
      (t) => !summaryTaskIds.has(t.taskId)
    );

    if (missingTasks.length > 0) {
      await prisma.dailyTaskSummary.update({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(currentDate),
          },
        },
        data: {
          taskData: [...(verifiedSummary.taskData as any[]), ...missingTasks],
        },
      });
    }

    // Async background activity log for each update
    updatedGoals.forEach(({ userGoal, task, targetMet, qty, time }) => {
      logActivity(req, {
        userId: user.id,
        username,
        taskId: task.id,
        userGoalId: userGoal.id,
        qty,
        time,
        targetMet,
        klTime,
      }).catch((err) => {
        console.error("Activity logging failed:", err);
      });
    });

    return NextResponse.json({
      success: true,
      userGoals: updatedGoals.map(({ userGoal }) => userGoal),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating user goals:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Error updating user goals",
        details: errorMessage,
      },
      {
        status: error instanceof z.ZodError ? 400 : 500,
      }
    );
  }
}

async function logActivity(
  req: NextRequest,
  params: {
    userId: number;
    username: string;
    taskId: number;
    userGoalId: number;
    qty: number;
    time: number;
    targetMet: boolean;
    klTime: Date;
  }
) {
  const { userId, username, taskId, userGoalId, qty, time, targetMet, klTime } =
    params;

  try {
    const deviceDetails = getDeviceDetails(req);

    await prisma.activityLog.create({
      data: {
        userId,
        username,
        action: "UPDATE_GOAL",
        description: `Updated task ${taskId} - Qty: ${qty}, Time: ${time}, Completed: ${targetMet}`,
        source_id: userGoalId,
        source_table: "UserGoal",
        ip_address: getClientIp(req),
        device_type: getDeviceType(req),
        browser_name: deviceDetails.browser_name,
        browser_version: deviceDetails.browser_version,
        os_name: deviceDetails.os_name,
        os_version: deviceDetails.os_version,
        device_vendor: deviceDetails.device_vendor,
        device_model: deviceDetails.device_model,
        device_type_spec: deviceDetails.device_type,
        timestamp: klTime,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

function getClientIp(req: NextRequest): string {
  let clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "Unknown";

  if (clientIp.includes(",")) {
    clientIp = clientIp.split(",")[0].trim();
  }

  if (clientIp === "::1" || clientIp === "127.0.0.1") {
    clientIp = "localhost";
  }

  return clientIp;
}

function getDeviceType(req: NextRequest): string {
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const deviceInfo = getDeviceInfo(userAgent);

  let deviceTypeDisplay = "Unknown Device";

  if (deviceInfo.device.vendor || deviceInfo.device.model) {
    deviceTypeDisplay =
      [deviceInfo.device.vendor, deviceInfo.device.model]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Device";

    if (
      deviceInfo.device.type &&
      !deviceTypeDisplay
        .toLowerCase()
        .includes(deviceInfo.device.type.toLowerCase())
    ) {
      deviceTypeDisplay += ` (${deviceInfo.device.type})`;
    }
  } else if (deviceInfo.client.name) {
    deviceTypeDisplay = `${deviceInfo.client.name} ${
      deviceInfo.client.version || ""
    }`.trim();
  }

  const osInfo = deviceInfo.os.name
    ? `${deviceInfo.os.name} ${deviceInfo.os.version || ""}`.trim()
    : "Unknown OS";

  return `${deviceTypeDisplay} on ${osInfo}`;
}

function getDeviceDetails(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const deviceInfo = getDeviceInfo(userAgent);

  return {
    browser_name: deviceInfo.client.name,
    browser_version: deviceInfo.client.version,
    os_name: deviceInfo.os.name,
    os_version: deviceInfo.os.version,
    device_vendor: deviceInfo.device.vendor,
    device_model: deviceInfo.device.model,
    device_type: deviceInfo.device.type,
    raw_user_agent: userAgent,
  };
}

interface DeviceInfo {
  client: {
    name: string | null;
    version: string | null;
    type: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
    platform: string | null;
  };
  device: {
    type: string | null;
    brand: string | null;
    model: string | null;
    vendor: string | null;
  };
  bot: boolean;
}

function getDeviceInfo(userAgent: string): DeviceInfo {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: true,
    maxUserAgentSize: 500,
  });

  const result = detector.detect(userAgent);

  const osName = result.os?.name || null;
  let osVersion = result.os?.version || null;

  if (osName === "Mac OS" && osVersion) {
    const macOSVersions: Record<string, string> = {
      "10.15": "Catalina",
      "11": "Big Sur",
      "12": "Monterey",
      "13": "Ventura",
      "14": "Sonoma",
      "15": "Sequoia",
    };

    const majorVersion = osVersion.split(".")[0];
    const minorVersion = osVersion.split(".")[1];
    const versionKey =
      majorVersion === "10" ? `${majorVersion}.${minorVersion}` : majorVersion;

    if (macOSVersions[versionKey]) {
      osVersion = `${osVersion} (${macOSVersions[versionKey]})`;
    }
  }

  let deviceVendor = result.device?.brand || null;
  let deviceModel = result.device?.model || null;
  let deviceType = result.device?.type || null;

  if (deviceType && typeof deviceType === "string") {
    deviceType =
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();
  }

  if (
    !deviceType &&
    ((osName && ["Windows", "Mac OS", "Linux"].includes(osName)) ||
      result.os?.platform === "x64" ||
      result.os?.platform === "x86")
  ) {
    deviceType = "Desktop";
  }

  const isFrozenAndroidUA =
    osName === "Android" &&
    osVersion === "10" &&
    (deviceModel === "K" || !deviceModel);

  if (isFrozenAndroidUA) {
    const androidDeviceMatch = userAgent.match(/;\s*([^;)]+?)(?:\s+Build|\))/i);
    if (androidDeviceMatch && androidDeviceMatch[1]) {
      const deviceString = androidDeviceMatch[1].trim();
      if (deviceString && deviceString !== "K") {
        const knownVendors = [
          { name: "Samsung", patterns: ["SM-", "SAMSUNG"] },
          { name: "Xiaomi", patterns: ["MI ", "Redmi", "POCO"] },
          { name: "Google", patterns: ["Pixel"] },
          { name: "OnePlus", patterns: ["OnePlus"] },
          { name: "OPPO", patterns: ["OPPO", "CPH"] },
          { name: "Vivo", patterns: ["vivo"] },
          { name: "Huawei", patterns: ["HUAWEI"] },
          { name: "Motorola", patterns: ["moto", "Motorola"] },
          { name: "Nokia", patterns: ["Nokia"] },
          { name: "Sony", patterns: ["Sony", "Xperia"] },
        ];

        for (const vendor of knownVendors) {
          if (vendor.patterns.some((p) => deviceString.includes(p))) {
            deviceVendor = vendor.name;
            deviceModel = deviceString;
            break;
          }
        }

        if (!deviceVendor && deviceString !== "K") {
          deviceModel = deviceString;
        }
      }
    }
  }

  let isBot = false;
  const botResult = detector.parseBot(userAgent);
  if (botResult && Object.keys(botResult).length > 0) {
    isBot = true;
  } else if (result.client?.type === "bot") {
    isBot = true;
  }

  return {
    client: {
      name: result.client?.name || null,
      version: result.client?.version || null,
      type: result.client?.type || null,
    },
    os: {
      name: osName,
      version: osVersion,
      platform: result.os?.platform || null,
    },
    device: {
      type: deviceType,
      brand: deviceVendor,
      model: deviceModel,
      vendor: deviceVendor,
    },
    bot: isBot,
  };
}
