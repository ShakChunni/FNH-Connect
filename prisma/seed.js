import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Only delete ContactData table rows and reset ID sequence
    await prisma.$executeRaw`TRUNCATE TABLE "ContactData" RESTART IDENTITY CASCADE`;
    console.log(
      "ContactData table truncated and ID sequences reset successfully"
    );
  } catch (error) {
    console.error("Failed to truncate ContactData table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
