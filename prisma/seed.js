const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = "ashfaq";
  const rawPassword = "60123040@#$%!";
  const password = await bcrypt.hash(rawPassword, 12);

  // Upsert Staff
  const staff = await prisma.staff.upsert({
    where: { fullName: "Ashfaq" },
    update: {},
    create: {
      firstName: "Ashfaq",
      lastName: null,
      fullName: "Ashfaq",
      role: "Principal Engineer", // or "Admin", "Developer"
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
      role: "admin",
      isActive: true,
      staffId: staff.id,
    },
    create: {
      username,
      password,
      staffId: staff.id,
      role: "admin",
      isActive: true,
    },
  });

  console.log("Seeded admin user: ashfaq");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
