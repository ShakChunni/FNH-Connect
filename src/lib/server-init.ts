import { runSessionCleanup } from "../app/utils/sessionCleanup";

type MaintenanceResults = {
  session: Awaited<ReturnType<typeof runSessionCleanup>>;
};

export async function runMaintenanceJobs(): Promise<MaintenanceResults> {
  const session = await runSessionCleanup();

  return { session };
}
