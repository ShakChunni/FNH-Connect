import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { sendGoalTrackingReminder } from "@/lib/sendGoalTrackingReminderEmailService";

const prisma = new PrismaClient();

const publicHolidays2025 = [
  "2025-01-01", // New Year's Day
  "2025-01-29", // Chinese New Year
  "2025-01-30", // Chinese New Year Holiday
  "2025-02-01", // Federal Territory Day
  "2025-02-11", // Thaipusam
  "2025-03-18", // Nuzul Al-Quran
  "2025-03-31", // Hari Raya Aidilfitri
  "2025-04-01", // Hari Raya Aidilfitri Holiday
  "2025-05-01", // Labour Day
  "2025-05-12", // Wesak Day
  "2025-06-02", // Agong's Birthday
  "2025-06-07", // Hari Raya Haji
  "2025-06-27", // Awal Muharram
  "2025-08-31", // Merdeka Day
  "2025-09-01", // Merdeka Day Holiday
  "2025-09-05", // Prophet Muhammad's Birthday
  "2025-09-16", // Malaysia Day
  "2025-10-20", // Deepavali
  "2025-12-25", // Christmas Day
];

const isPublicHoliday = (dateString: string): boolean => {
  return publicHolidays2025.includes(dateString);
};

export const initGoalTrackingNotifications = () => {
  console.log("[Goal Tracking] Initializing cron job...");

  const task = cron.schedule(
    "45 17 * * 1-5",
    async () => {
      console.log("[Goal Tracking] Running scheduled task...");
      await processNotifications();
    },
    {
      scheduled: true,
      timezone: "Asia/Kuala_Lumpur",
    }
  );

  task.start();
  console.log("[Goal Tracking] Cron job started");
  return task;
};

async function processNotifications() {
  const startTime = Date.now();

  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const klDateStr = now.toLocaleDateString("en-CA", options);

    console.log(`[Goal Tracking] Current date in KL: ${klDateStr}`);

    const [year, month, day] = klDateStr
      .split("-")
      .map((part) => parseInt(part, 10));
    const currentDate = new Date(Date.UTC(year, month - 1, day));

    if (isPublicHoliday(klDateStr)) {
      console.log(
        `[Goal Tracking] Today (${klDateStr}) is a public holiday. Skipping notifications.`
      );
      return;
    }

    const excludedIds = [7, 10];
    const users = await prisma.user.findMany({
      where: {
        archived: false,
        role: { not: "admin" },
        id: { notIn: excludedIds },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
      },
    });

    console.log(`[Goal Tracking] Found ${users.length} users to check`);

    for (const user of users) {
      if (!user.email) {
        console.log(
          `[Goal Tracking] Skipping user ${user.username} - no email address`
        );
        continue;
      }

      const todaysSummary = await prisma.dailyTaskSummary.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: currentDate,
            lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!todaysSummary) {
        console.log(
          `[Goal Tracking] No daily summary for ${user.username}, sending reminder`
        );
        await sendGoalTrackingReminder(user, [
          "tanvir@movingimage.my",
          "ashfaq@wisecodetech.com",
          "jouya@movingimage.my",
        ]);
      } else {
        console.log(
          `[Goal Tracking] User ${user.username} has submitted daily summary`
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Goal Tracking] Completed in ${duration}ms`);
  } catch (error) {
    console.error("[Goal Tracking Error]:", error);
  } finally {
    await prisma.$disconnect();
  }
}
