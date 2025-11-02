import { PrismaClient, Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: logLevels,
    errorFormat: "pretty",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// ═══════════════════════════════════════════════════════════════
// SINGLETON PATTERN (Prevents connection pool exhaustion)
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Store in globalThis to prevent garbage collection across HMR reloads
globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === "development") {
  console.log("[Prisma] Singleton initialized");
}

export { prisma };
