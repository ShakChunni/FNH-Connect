/**
 * Add Receptionist Users Script
 *
 * This script creates 4 receptionist users with limited access:
 * - Can only access: Dashboard, General Admission, Pathology
 * - Cannot access: Admin routes, Infertility, Patient Records
 *
 * Run with: npx ts-node scripts/add-receptionists.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Receptionist users to create
const RECEPTIONISTS = [
  {
    firstName: "Ashadul",
    lastName: "Malek",
    fullName: "Ashadul Malek",
    username: "ashadul-fnh",
    password: "Rc@7kL9mXp2#", // Random generated password
  },
  {
    firstName: "Ratna Akther",
    lastName: "Koly",
    fullName: "Ratna Akther Koly",
    username: "ratna-fnh",
    password: "Qw3$nB8vYt5!", // Random generated password
  },
  {
    firstName: "Rakibul",
    lastName: "Hasan",
    fullName: "Rakibul Hasan",
    username: "rakibul-fnh",
    password: "Zx6%pM4cHj9@", // Random generated password
  },
  {
    firstName: "Md. Hasibul",
    lastName: "Hossen",
    fullName: "Md. Hasibul Hossen",
    username: "hasibul-fnh",
    password: "Tk2&wF7sLn4#", // Random generated password
  },
];

async function main() {
  console.log("🔐 Adding Receptionist Users...\n");
  console.log("═".repeat(60) + "\n");

  for (const receptionist of RECEPTIONISTS) {
    try {
      // Check if staff already exists
      let staff = await prisma.staff.findFirst({
        where: { fullName: receptionist.fullName },
      });

      if (!staff) {
        // Create staff entry
        staff = await prisma.staff.create({
          data: {
            firstName: receptionist.firstName,
            lastName: receptionist.lastName,
            fullName: receptionist.fullName,
            role: "Receptionist",
            isActive: true,
          },
        });
        console.log(
          `  ✅ Created Staff: ${receptionist.fullName} (ID: ${staff.id})`
        );
      } else {
        console.log(
          `  ℹ️  Staff already exists: ${receptionist.fullName} (ID: ${staff.id})`
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { username: receptionist.username },
      });

      if (existingUser) {
        console.log(`  ⚠️  User already exists: ${receptionist.username}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(receptionist.password, 12);

      // Create user with receptionist role
      const user = await prisma.user.create({
        data: {
          username: receptionist.username,
          password: hashedPassword,
          staffId: staff.id,
          role: "receptionist", // Limited role
          isActive: true,
        },
      });

      console.log(
        `  ✅ Created User: ${receptionist.username} (ID: ${user.id})`
      );
    } catch (error) {
      console.error(`  ❌ Error creating ${receptionist.fullName}:`, error);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n📋 RECEPTIONIST CREDENTIALS (SAVE THESE!):\n");

  for (const receptionist of RECEPTIONISTS) {
    console.log(`   👤 ${receptionist.fullName}`);
    console.log(`      Username: ${receptionist.username}`);
    console.log(`      Password: ${receptionist.password}`);
    console.log("");
  }

  console.log("═".repeat(60));
  console.log(
    "\n⚠️  IMPORTANT: Share these credentials securely with the staff!"
  );
  console.log("   These passwords will NOT be shown again.\n");

  // Summary
  const totalReceptionists = await prisma.user.count({
    where: { role: "receptionist" },
  });
  console.log(
    `\n📊 Total receptionist users in system: ${totalReceptionists}\n`
  );
}

main()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
