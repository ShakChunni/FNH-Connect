/**
 * Add New User Script: fnh-popi (Receptionist Infertility)
 *
 * Run with: npx tsx scripts/add-popi-user.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Adding new user: fnh-popi (Receptionist Infertility)...\n");

  const userDetails = {
    username: "fnh-popi",
    password: "z{|_5*_L1Cd2",
    fullName: "Suraiya Jahan Popi",
    role: "receptionist-infertility",
  };

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: userDetails.username },
  });

  if (existingUser) {
    console.log(
      `  ⚠️  User ${userDetails.username} already exists (ID: ${existingUser.id})`
    );
    console.log("  Skipping creation...\n");
    return;
  }

  // Create staff entry for receptionist
  const nameParts = userDetails.fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ");
  const lastName = nameParts[nameParts.length - 1];

  const staff = await prisma.staff.create({
    data: {
      firstName,
      lastName,
      fullName: userDetails.fullName,
      role: "Receptionist",
      specialization: null,
      isActive: true,
    },
  });
  console.log(`  ✅ Created Staff: ${userDetails.fullName} (ID: ${staff.id})`);

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(userDetails.password, 12);

  const user = await prisma.user.create({
    data: {
      username: userDetails.username,
      password: hashedPassword,
      staffId: staff.id,
      role: userDetails.role,
      isActive: true,
    },
  });

  console.log(`  ✅ Created User: ${userDetails.username} (ID: ${user.id})`);
  console.log(`  📝 Role: ${userDetails.role}`);
  console.log(`\n✨ User created successfully!\n`);

  // Print credentials
  console.log("═".repeat(50));
  console.log("📋 USER CREDENTIALS:");
  console.log(`   Username: ${userDetails.username}`);
  console.log(`   Password: ${userDetails.password}`);
  console.log(`   Full Name: ${userDetails.fullName}`);
  console.log(`   Role: ${userDetails.role}`);
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
