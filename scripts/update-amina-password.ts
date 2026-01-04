import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Updating password for fnh-amina...");

  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { username: "fnh-amina" },
    include: { staff: true },
  });

  if (!user) {
    throw new Error("❌ User 'fnh-amina' not found!");
  }

  console.log(
    `✅ Found User: ${user.username} (Staff: ${user.staff.fullName})`
  );

  // 2. Hash new password
  const saltRounds = 12;
  const newPasswordRaw = "0~p99gHn?DIQ";
  const hashedPassword = await bcrypt.hash(newPasswordRaw, saltRounds);

  // 3. Update Password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
  });

  console.log("✅ Password updated successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error updating password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
