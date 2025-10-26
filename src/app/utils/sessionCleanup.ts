import { prisma } from "@/lib/prisma";
import cron from "node-cron";

export const initSessionCleanup = () => {
  console.log("[Session Cleanup] Initializing cron job...");

  const task = cron.schedule(
    "59 23 * * *", // Run every 24 hours at midnight KL time
    async () => {
      console.log("[Session Cleanup] Running scheduled task...");
      try {
        const now = new Date();
        const deletedSessions = await prisma.session.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        });
        console.log(
          `[Session Cleanup] ${new Date().toISOString()} - Cleaned up ${
            deletedSessions.count
          } expired sessions`
        );
      } catch (error) {
        console.error("[Session Cleanup Error]:", error);
      }
      // DO NOT disconnect - reuse the singleton client
    },
    {
      timezone: "Asia/Dhaka", // Set timezone to KL time
    }
  );

  task.start();
  console.log("[Session Cleanup] Cron job started");
  return task;
};
