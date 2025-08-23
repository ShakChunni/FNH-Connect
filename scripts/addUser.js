import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();



/**
 * Add a new user with staff role
 */
async function addUser(
  username,
  password,
  role,
  firstName,
  lastName,
  specialization = null
) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const fullName = `${firstName} ${lastName}`.trim();

  try {
    // Create Staff record first
    const staff = await prisma.staff.create({
      data: {
        firstName,
        lastName,
        fullName,
        role: role,
        specialization,
        isActive: true,
      },
    });

    console.log(
      `Staff created: ${staff.fullName} (ID: ${staff.id}, Role: ${staff.role})`
    );

    // Create User linked to Staff
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        staffId: staff.id,
        role,
        isActive: true,
      },
    });

    console.log(
      `User created: ${user.username} (ID: ${user.id}, Role: ${user.role})`
    );

    return { staff, user };
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

async function main() {
  try {
    // Reset database and sequences first
    // Add system admin/dev user
    await addUser(
      "ashfaq", // username
      "60123040@#$%!", // password (as per your latest request)
      "SystemAdmin", // role (use "SystemAdmin" or "DevAdmin" as you prefer)
      "Ashfaq", // firstName
      "", // lastName (empty if not needed)
      "System Administrator" // specialization
    );

    console.log(
      "✅ Database has been reset and system admin user has been created successfully."
    );
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
