import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function addUser(username, password, role, manages) {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        manages,
      },
    });
    console.log(`User created successfully: ${user.username}`);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage
const [, , username, password, role, ...manages] = process.argv;
if (username && password && role) {
  addUser(username, password, role, manages).catch(console.error);
} else {
  console.log(
    "Usage: node scripts/addUser.js <username> <password> <role> <manages...>"
  );
}
