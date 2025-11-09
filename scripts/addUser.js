const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = "ashfaq";
  const rawPassword = "aDAm60123040@#$";
  const password = await bcrypt.hash(rawPassword, 12);
  // Find staff by fullName (not a unique field) and create or update accordingly.
  const staffFullName = "F.M. Ashfaq";
  let staff = await prisma.staff.findFirst({ where: { fullName: staffFullName } });

  if (staff) {
    staff = await prisma.staff.update({
      where: { id: staff.id },
      data: {
        firstName: "F.M.",
        lastName: "Ashfaq",
        fullName: staffFullName,
        role: "System Admin",
        specialization: "System Developer",
        isActive: true,
      },
    });
  } else {
    staff = await prisma.staff.create({
      data: {
        firstName: "F.M.",
        lastName: "Ashfaq",
        fullName: staffFullName,
        role: "System Admin",
        specialization: "System Developer",
        phoneNumber: null,
        email: null,
        isActive: true,
      },
    });
  }

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
