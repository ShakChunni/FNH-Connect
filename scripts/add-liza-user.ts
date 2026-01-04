import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Adding Dr. Farhana Alam Liza...");

  // 1. Find Surgery Department
  const surgeryDept = await prisma.department.findUnique({
    where: { name: "Surgery" },
  });

  if (!surgeryDept) {
    throw new Error(
      "❌ Surgery Department not found! Please seed departments first."
    );
  }
  console.log("✅ Found Surgery Department:", surgeryDept.id);

  // 2. Create Staff: Dr. Farhana Alam Liza
  const lizaStaff = await prisma.staff.create({
    data: {
      firstName: "Farhana Alam",
      lastName: "Liza",
      fullName: "Dr. Farhana Alam Liza",
      role: "Doctor",
      specialization: "Surgery",
      isActive: true,
      // Link to Department
      departmentAssignments: {
        create: {
          departmentId: surgeryDept.id,
          isPrimary: true,
        },
      },
    },
  });
  console.log("✅ Created Staff:", lizaStaff.fullName, `(ID: ${lizaStaff.id})`);

  // 3. Create User: fnh-liza (Admin)
  const saltRounds = 12;
  const rawPassword = "j+]tF96r2%(_";
  const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

  const lizaUser = await prisma.user.create({
    data: {
      username: "fnh-liza",
      password: hashedPassword,
      staffId: lizaStaff.id,
      role: "admin", // User requested "admin"
      isActive: true,
    },
  });

  console.log(`✅ Created User: ${lizaUser.username} (Role: ${lizaUser.role})`);
  console.log("\n🎉 Dr. Farhana Alam Liza added successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error adding user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
