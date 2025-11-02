import { type PrismaClient } from "@prisma/client";


export function registerPrismaShutdown(prisma: PrismaClient): void {
  const globalForPrisma = globalThis as unknown as {
    prismaShutdownRegistered?: boolean;
  };

  // Only register once globally
  if (globalForPrisma.prismaShutdownRegistered) {
    return;
  }

  // Graceful shutdown handler
  const handleShutdown = async (signal: string) => {
    console.log(`[Prisma] Received ${signal}, disconnecting...`);
    try {
      await prisma.$disconnect();
      console.log("[Prisma] Disconnected successfully");
    } catch (error) {
      console.error("[Prisma] Error during shutdown disconnect:", error);
    }
  };

  // Register shutdown handlers (Node.js APIs - safe here)
  process.on("SIGINT", () =>
    handleShutdown("SIGINT").then(() => process.exit(0))
  );
  process.on("SIGTERM", () =>
    handleShutdown("SIGTERM").then(() => process.exit(0))
  );
  process.on("beforeExit", () => handleShutdown("beforeExit"));

  globalForPrisma.prismaShutdownRegistered = true;

  if (process.env.NODE_ENV === "development") {
    console.log("[Prisma] Shutdown handlers registered");
  }
}
