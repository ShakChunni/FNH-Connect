const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = "ashfaq";
  const rawPassword = "aDAm60123040@#$";
  const password = await bcrypt.hash(rawPassword, 12);

  // Upsert Staff
  const staff = await prisma.staff.upsert({
    where: { fullName: "F.M. Ashfaq" },
    update: {
      firstName: "F.M.",
      lastName: "Ashfaq",
      fullName: "F.M. Ashfaq",
      role: "System Admin",
      specialization: "System Developer",
      isActive: true,
    },
    create: {
      firstName: "F.M.",
      lastName: "Ashfaq",
      fullName: "F.M. Ashfaq",
      role: "System Admin",
      specialization: "System Developer",
      phoneNumber: null,
      email: null,
      isActive: true,
    },
  });

  // Upsert User
  await prisma.user.upsert({
    where: { username },
    update: {
      password,
      role: "system-admin",
      isActive: true,
      staffId: staff.id,
    },
    create: {
      username,
      password,
      staffId: staff.id,
      role: "system-admin",
      isActive: true,
    },
  });

  console.log("Seeded system admin user: F.M. Ashfaq (username: ashfaq)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
