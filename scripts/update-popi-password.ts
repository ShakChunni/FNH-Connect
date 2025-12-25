/**
 * Update User Password Script: fnh-popi
 *
 * Run with: npx tsx scripts/update-popi-password.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Updating password for user: fnh-popi...\n");

  const username = "fnh-popi";
  const newPassword = "z{|_5*_L1Cd2";

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!existingUser) {
    console.log(`  ❌ User ${username} not found!`);
    return;
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { username },
    data: { password: hashedPassword },
  });

  console.log(`  ✅ Password updated for: ${username}`);
  console.log(`\n✨ Password update complete!\n`);

  // Print credentials
  console.log("═".repeat(50));
  console.log("📋 UPDATED CREDENTIALS:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${newPassword}`);
  console.log("═".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
