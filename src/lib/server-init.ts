import { initSessionCleanup } from "../app/utils/sessionCleanup";
import { initGoalReset } from "../app/utils/goalReset";
import { initGoalTrackingNotifications } from "../app/utils/notifyGoalTracking";

let isInitialized = false;

export function initializeServer() {
  if (isInitialized) return;
  if (process.env.NODE_ENV === "development") {
    console.log("Initializing server tasks...");
  }

  initSessionCleanup();
  initGoalReset();
  isInitialized = true;
}
