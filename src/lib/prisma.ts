import { PrismaClient, Prisma } from "@prisma/client";

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error"] : ["error"];

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: logLevels,
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const handleShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("beforeExit", handleShutdown);
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

export { prisma };
