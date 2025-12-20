/**
 * Comprehensive Seed Script: FNH-Connect Database
 *
 * This script creates:
 * 1. System Admin (F.M. Ashfaq) - FIRST entry
 * 2. Departments - All medical departments
 * 3. Staff - "Self" entry and all doctors
 * 4. StaffDepartment - Links doctors to their departments
 * 5. Users - Admin users with system access
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// SYSTEM ADMIN - FIRST USER (F.M. Ashfaq)
// ═══════════════════════════════════════════════════════════════

const SYSTEM_ADMIN = {
  staff: {
    firstName: "F.M.",
    lastName: "Ashfaq",
    fullName: "F.M. Ashfaq",
    role: "System Admin",
    specialization: "System Developer",
  },
  user: {
    username: "ashfaq",
    password: "aDAm60123040@#$",
    role: "system-admin",
  },
};

// ═══════════════════════════════════════════════════════════════
// DEPARTMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const DEPARTMENTS = [
  { name: "Gynecology", description: "Obstetrics and Gynecology Department" },
  { name: "Surgery", description: "General Surgery Department" },
  { name: "Medicine", description: "Internal Medicine Department" },
  { name: "Pediatrics", description: "Pediatrics and Child Health Department" },
  { name: "Cardiology", description: "Heart and Cardiovascular Department" },
  { name: "ENT", description: "Ear, Nose, and Throat Department" },
  { name: "Orthopedics", description: "Orthopedic Surgery and Bone Health" },
  { name: "Radiology", description: "Medical Imaging and Diagnostics" },
  { name: "Psychology", description: "Mental Health and Psychology" },
  { name: "Eye", description: "Ophthalmology and Eye Care" },
  { name: "Pathology", description: "Pathology and Laboratory Services" },
  { name: "Anesthesia", description: "Anesthesiology Department" },
];

// ═══════════════════════════════════════════════════════════════
// STAFF DEFINITIONS (organized by rank)
// ═══════════════════════════════════════════════════════════════

interface StaffData {
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  specializations: string[]; // Can have multiple departments
}

const STAFF_LIST: StaffData[] = [
  // Self entry - Special entry for self-ordered tests
  {
    firstName: "Self",
    lastName: "",
    fullName: "Self",
    role: "Self",
    specializations: [],
  },

  // ────────────────────────────────────────────────────────────────
  // PROFESSORS (highest rank)
  // ────────────────────────────────────────────────────────────────
  {
    firstName: "Sufia",
    lastName: "Khatun",
    fullName: "Prof. Dr. Sufia Khatun",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "A.N.M. Naushad",
    lastName: "Khan",
    fullName: "Prof. Dr. A.N.M. Naushad Khan",
    role: "Doctor",
    specializations: ["Medicine", "Anesthesia"],
  },
  {
    firstName: "Molla Nazrul",
    lastName: "Islam",
    fullName: "Prof. Dr. Molla Nazrul Islam",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Muhammad",
    lastName: "Mohsin",
    fullName: "Prof. Dr. Muhammad Mohsin",
    role: "Doctor",
    specializations: ["Pediatrics"],
  },
  {
    firstName: "Zehad",
    lastName: "Khan",
    fullName: "Prof. Cornel (Rtd.) Dr. Zehad Khan",
    role: "Doctor",
    specializations: ["Cardiology"],
  },

  // ────────────────────────────────────────────────────────────────
  // ASSOCIATE PROFESSORS
  // ────────────────────────────────────────────────────────────────
  {
    firstName: "Kazi Shah",
    lastName: "Alam",
    fullName: "Associate Prof. Dr. Kazi Shah Alam",
    role: "Doctor",
    specializations: ["ENT"],
  },

  // ────────────────────────────────────────────────────────────────
  // ASSISTANT PROFESSORS
  // ────────────────────────────────────────────────────────────────
  {
    firstName: "Sultana",
    lastName: "Rajia",
    fullName: "Asst Prof. Dr. Sultana Rajia",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Aminur",
    lastName: "Rahman",
    fullName: "Asst Prof. Dr. Aminur Rahman",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Sujit",
    lastName: "Das",
    fullName: "Asst Prof. Dr. Sujit Das",
    role: "Doctor",
    specializations: ["Pediatrics"],
  },
  {
    firstName: "Gulam Mustafa",
    lastName: "Manik",
    fullName: "Asst Prof. Dr. Gulam Mustafa Manik",
    role: "Doctor",
    specializations: ["Orthopedics"],
  },
  {
    firstName: "Muhammad Rafiqul",
    lastName: "Islam",
    fullName: "Asst Prof. Dr. Muhammad Rafiqul Islam",
    role: "Doctor",
    specializations: ["ENT"],
  },

  // ────────────────────────────────────────────────────────────────
  // ASSISTANT DIRECTORS
  // ────────────────────────────────────────────────────────────────
  {
    firstName: "Hosna",
    lastName: "Begum",
    fullName: "Asst Director Dr. Hosna Begum",
    role: "Doctor",
    specializations: ["Gynecology"],
  },

  // ────────────────────────────────────────────────────────────────
  // REGULAR DOCTORS
  // ────────────────────────────────────────────────────────────────
  {
    firstName: "Ananna",
    lastName: "Debnath",
    fullName: "Dr. Ananna Debnath",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Fatema",
    lastName: "Akter",
    fullName: "Dr. Fatema Akter",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Morium",
    lastName: "Akter",
    fullName: "Dr. Morium Akter",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Sornali",
    lastName: "Akter",
    fullName: "Dr. Sornali Akter",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Avishek",
    lastName: "Bhadra",
    fullName: "Dr. Avishek Bhadra",
    role: "Doctor",
    specializations: ["Orthopedics"],
  },
  {
    firstName: "Md. Galibul Islam",
    lastName: "Galib",
    fullName: "Dr. Md. Galibul Islam Galib",
    role: "Doctor",
    specializations: ["ENT"],
  },
  {
    firstName: "Ariful",
    lastName: "Islam",
    fullName: "Dr. Ariful Islam",
    role: "Doctor",
    specializations: ["Orthopedics"],
  },
  {
    firstName: "Md Nurul",
    lastName: "Islam",
    fullName: "Dr. Md Nurul Islam",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Tahsin Firoza",
    lastName: "Khan",
    fullName: "Dr. Tahsin Firoza Khan (Amina)",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "A.H.M Muslima",
    lastName: "Akter",
    fullName: "Dr. A.H.M Muslima Akter",
    role: "Doctor",
    specializations: ["Pediatrics"],
  },
  {
    firstName: "Md. Khalid",
    lastName: "Asad",
    fullName: "Dr. Md. Khalid Asad",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Md. Sujon",
    lastName: "Mia",
    fullName: "Dr. Md. Sujon Mia",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Mahbubur",
    lastName: "Rahman",
    fullName: "Dr. Mahbubur Rahman",
    role: "Doctor",
    specializations: ["Psychology"],
  },
  {
    firstName: "Shah Anisur",
    lastName: "Rahman",
    fullName: "Dr. Shah Anisur Rahman (Rana)",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Md. Mahabubur Rahman",
    lastName: "Shahin",
    fullName: "Dr. Md. Mahabubur Rahman Shahin",
    role: "Doctor",
    specializations: ["Eye"],
  },
  {
    firstName: "Samina",
    lastName: "Sultana",
    fullName: "Dr. Samina Sultana",
    role: "Doctor",
    specializations: ["Gynecology"],
  },
  {
    firstName: "Sazzad UR Rahman",
    lastName: "Turja",
    fullName: "Dr. Sazzad UR Rahman Turja",
    role: "Doctor",
    specializations: ["Medicine", "Anesthesia"],
  },
  {
    firstName: "Muhammad Zia",
    lastName: "Uddin",
    fullName: "Dr. Muhammad Zia Uddin",
    role: "Doctor",
    specializations: ["Surgery"],
  },
  {
    firstName: "Zayed Zubayer",
    lastName: "Khan",
    fullName: "Dr. Zayed Zubayer Khan",
    role: "Doctor",
    specializations: ["Radiology"],
  },
];

// ═══════════════════════════════════════════════════════════════
// ADMIN USERS - Doctors with system access
// ═══════════════════════════════════════════════════════════════

interface AdminUser {
  username: string;
  password: string;
  doctorFullName: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    username: "sufia-fnh",
    password: "748G}C?z^]u]",
    doctorFullName: "Prof. Dr. Sufia Khatun",
  },
  {
    username: "amina-fnh",
    password: "SJp+316hDi$3",
    doctorFullName: "Dr. Tahsin Firoza Khan (Amina)",
  },
  {
    username: "zayed-fnh",
    password: "i84[1Dz/?oI9",
    doctorFullName: "Dr. Zayed Zubayer Khan",
  },
];

// ═══════════════════════════════════════════════════════════════
// FULL CLEANUP FUNCTION - Clear ALL data and reset sequences
// ═══════════════════════════════════════════════════════════════

async function fullCleanup() {
  console.log(
    "🧹 FULL DATABASE CLEANUP: Using TRUNCATE to reset ALL data and sequences...\n"
  );

  // Use raw SQL TRUNCATE with CASCADE to delete all data and reset sequences
  console.log("  🗑️  Truncating all tables with CASCADE...");

  try {
    // Truncate all tables with RESTART IDENTITY CASCADE
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "Session",
        "ActivityLog", 
        "User",
        "ServiceCharge",
        "Payment",
        "Shift",
        "InfertilityPatient",
        "PathologyTest",
        "Admission",
        "PatientAccount",
        "Patient",
        "Hospital",
        "StaffDepartment",
        "Staff",
        "Department"
      RESTART IDENTITY CASCADE
    `);
    console.log("  ✅ All tables truncated and sequences reset!");
  } catch (e) {
    console.log("  ⚠️  TRUNCATE failed, falling back to deleteMany...");
    console.log(`     Error: ${e instanceof Error ? e.message : "Unknown"}`);

    // Fallback to deleteMany
    try {
      await prisma.session.deleteMany({});
    } catch {}
    try {
      await prisma.activityLog.deleteMany({});
    } catch {}
    try {
      await prisma.user.deleteMany({});
    } catch {}
    try {
      await prisma.serviceCharge.deleteMany({});
    } catch {}
    try {
      await prisma.payment.deleteMany({});
    } catch {}
    try {
      await prisma.shift.deleteMany({});
    } catch {}
    try {
      await prisma.infertilityPatient.deleteMany({});
    } catch {}
    try {
      await prisma.pathologyTest.deleteMany({});
    } catch {}
    try {
      await prisma.admission.deleteMany({});
    } catch {}
    try {
      await prisma.patientAccount.deleteMany({});
    } catch {}
    try {
      await prisma.patient.deleteMany({});
    } catch {}
    try {
      await prisma.hospital.deleteMany({});
    } catch {}
    try {
      await prisma.staffDepartment.deleteMany({});
    } catch {}
    try {
      await prisma.staff.deleteMany({});
    } catch {}
    try {
      await prisma.department.deleteMany({});
    } catch {}

    console.log("  ✅ Data deleted (sequences may not be reset)");
  }

  console.log("\n✨ Full database cleanup complete!\n");
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("🌱 Starting FNH-Connect database seed...\n");
  console.log("═".repeat(60) + "\n");

  // Full cleanup first - clear everything and reset sequences
  await fullCleanup();

  // Maps to store IDs
  const departmentMap = new Map<string, number>();
  const staffMap = new Map<string, number>();

  // ════════════════════════════════════════════════════════════════
  // 1. Create System Admin FIRST (ID: 1)
  // ════════════════════════════════════════════════════════════════
  console.log("👑 Creating System Admin (F.M. Ashfaq)...");

  const systemAdminStaff = await prisma.staff.create({
    data: {
      firstName: SYSTEM_ADMIN.staff.firstName,
      lastName: SYSTEM_ADMIN.staff.lastName,
      fullName: SYSTEM_ADMIN.staff.fullName,
      role: SYSTEM_ADMIN.staff.role,
      specialization: SYSTEM_ADMIN.staff.specialization,
      isActive: true,
    },
  });
  staffMap.set(SYSTEM_ADMIN.staff.fullName, systemAdminStaff.id);
  console.log(
    `  ✅ Created Staff: ${SYSTEM_ADMIN.staff.fullName} (ID: ${systemAdminStaff.id})`
  );

  const hashedSysAdminPassword = await bcrypt.hash(
    SYSTEM_ADMIN.user.password,
    12
  );
  const systemAdminUser = await prisma.user.create({
    data: {
      username: SYSTEM_ADMIN.user.username,
      password: hashedSysAdminPassword,
      staffId: systemAdminStaff.id,
      role: SYSTEM_ADMIN.user.role,
      isActive: true,
    },
  });
  console.log(
    `  ✅ Created User: ${SYSTEM_ADMIN.user.username} (ID: ${systemAdminUser.id})`
  );
  console.log("\n✨ System Admin created as FIRST user!\n");

  // ════════════════════════════════════════════════════════════════
  // 2. Create Departments
  // ════════════════════════════════════════════════════════════════
  console.log("🏥 Creating departments...");

  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.create({
      data: {
        name: dept.name,
        description: dept.description,
        isActive: true,
      },
    });
    departmentMap.set(created.name, created.id);
    console.log(`  ✅ Created: ${dept.name} (ID: ${created.id})`);
  }

  console.log(`\n✨ ${DEPARTMENTS.length} departments created!\n`);

  // ════════════════════════════════════════════════════════════════
  // 3. Create Staff (Self + Doctors)
  // ════════════════════════════════════════════════════════════════
  console.log("👨‍⚕️ Creating doctors/staff...");

  for (const staff of STAFF_LIST) {
    const primarySpecialization =
      staff.specializations.length > 0 ? staff.specializations[0] : null;

    const created = await prisma.staff.create({
      data: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: staff.fullName,
        role: staff.role,
        specialization: primarySpecialization,
        isActive: true,
      },
    });
    staffMap.set(created.fullName, created.id);
    console.log(`  ✅ Created: ${staff.fullName} (ID: ${created.id})`);
  }

  console.log(`\n✨ ${STAFF_LIST.length} staff members created!\n`);

  // ════════════════════════════════════════════════════════════════
  // 4. Create StaffDepartment (Link doctors to departments)
  // ════════════════════════════════════════════════════════════════
  console.log("🔗 Linking doctors to departments...");

  let linkCount = 0;
  for (const staff of STAFF_LIST) {
    const staffId = staffMap.get(staff.fullName);
    if (!staffId) continue;

    for (let i = 0; i < staff.specializations.length; i++) {
      const spec = staff.specializations[i];
      const departmentId = departmentMap.get(spec);
      if (!departmentId) {
        console.log(`  ⚠️  Department not found: ${spec}`);
        continue;
      }

      await prisma.staffDepartment.create({
        data: {
          staffId,
          departmentId,
          isPrimary: i === 0,
        },
      });
      linkCount++;
    }
  }

  console.log(`  ✅ Created ${linkCount} staff-department links`);
  console.log(`\n✨ Staff-department assignments complete!\n`);

  // ════════════════════════════════════════════════════════════════
  // 5. Create Admin Users (Doctors with login access)
  // ════════════════════════════════════════════════════════════════
  console.log("👤 Creating admin users...");

  for (const adminUser of ADMIN_USERS) {
    const staffId = staffMap.get(adminUser.doctorFullName);
    if (!staffId) {
      console.log(`  ❌ Could not find staff: ${adminUser.doctorFullName}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(adminUser.password, 12);

    const created = await prisma.user.create({
      data: {
        username: adminUser.username,
        password: hashedPassword,
        staffId,
        role: "admin",
        isActive: true,
      },
    });

    console.log(
      `  ✅ Created: ${adminUser.username} → ${adminUser.doctorFullName} (ID: ${created.id})`
    );
  }

  console.log("\n✨ Admin users created successfully!\n");

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log("═".repeat(60));
  console.log("\n📊 SEED SUMMARY:\n");

  const totalDepartments = await prisma.department.count();
  const totalStaff = await prisma.staff.count();
  const totalDoctors = await prisma.staff.count({ where: { role: "Doctor" } });
  const totalSelf = await prisma.staff.count({ where: { role: "Self" } });
  const totalSysAdmin = await prisma.staff.count({
    where: { role: "System Admin" },
  });
  const totalStaffDepts = await prisma.staffDepartment.count();
  const totalUsers = await prisma.user.count();

  console.log(`   📍 Departments:          ${totalDepartments}`);
  console.log(`   👥 Total Staff:          ${totalStaff}`);
  console.log(`   👑 System Admin:         ${totalSysAdmin}`);
  console.log(`   👨‍⚕️ Doctors:              ${totalDoctors}`);
  console.log(`   🙋 Self Entry:           ${totalSelf}`);
  console.log(`   🔗 Staff-Dept Links:     ${totalStaffDepts}`);
  console.log(`   🔐 Users with Access:    ${totalUsers}`);

  console.log("\n" + "═".repeat(60));
  console.log("\n🎉 Seed completed successfully!\n");

  // Show ID assignments
  console.log("📋 KEY ID ASSIGNMENTS:");
  console.log(`   Staff ID 1: F.M. Ashfaq (System Admin)`);
  console.log(`   Staff ID 2: Self (Self-ordered tests)`);
  console.log(`   Staff ID 3+: Doctors`);
  console.log(`   User ID 1: ashfaq (System Admin)`);
  console.log(`   User ID 2-4: Admin doctors\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
