import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Clean database and reset sequences
 */
async function resetDatabase() {
  try {
    // Execute raw SQL to truncate all relevant tables and reset sequences
    // We need to use $executeRaw to execute SQL directly
    
    // First, disable foreign key checks (temporarily)
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;
    
    // Then truncate tables in reverse order of dependencies
    await prisma.$executeRaw`TRUNCATE TABLE "Session" RESTART IDENTITY CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "ActivityLog" RESTART IDENTITY CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Staff" RESTART IDENTITY CASCADE;`;
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;
    
    console.log("Database reset successfully - tables truncated and sequences reset to 1");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

/**
 * Add a new user with staff role
 */
async function addUser(username, password, role, firstName, lastName, specialization = null) {
  const hashedPassword = await bcrypt.hash(password, 10);
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
    
    console.log(`Staff created: ${staff.fullName} (ID: ${staff.id}, Role: ${staff.role})`);
    
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
    
    console.log(`User created: ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    
    return { staff, user };
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

async function main() {
  try {
    // Reset database and sequences first
    await resetDatabase();
    
    // Add superadmin user
    await addUser(
      "ashfaq",               // username
      "aDAm60123040@#$",      // password
      "SuperAdmin",           // role
      "F.M.",                 // firstName
      "Ashfaq",               // lastName
      "System Administrator"  // specialization
    );
    
    console.log("✅ Database has been reset and superadmin user has been created successfully.");
    
    // You can add more users if needed
    // await addUser("doctorjohn", "password123", "Doctor", "John", "Doe", "Gynecology");
    // await addUser("nursejane", "password123", "Nurse", "Jane", "Smith");
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();