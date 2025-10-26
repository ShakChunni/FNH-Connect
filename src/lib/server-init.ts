import { initSessionCleanup } from "../app/utils/sessionCleanup";
import type { ScheduledTask } from "node-cron";

let isInitialized = false;
let cronTasks: ScheduledTask[] = [];

export function initializeServer() {
  if (isInitialized) {
    console.log("[Server Init] Already initialized, skipping...");
    return;
  }

  console.log("[Server Init] Initializing server tasks...");

  // Store task references for potential cleanup
  cronTasks.push(initSessionCleanup());


  isInitialized = true;
  console.log("[Server Init] All tasks initialized successfully");
}

// Optional: Function to stop all cron jobs (useful for graceful shutdown)
export function stopServerTasks() {
  if (cronTasks.length > 0) {
    console.log("[Server Init] Stopping all cron tasks...");
    cronTasks.forEach((task) => task.stop());
    cronTasks = [];
    isInitialized = false;
  }
}
