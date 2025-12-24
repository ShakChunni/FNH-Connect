/**
 * Cleanup Test Data Script
 *
 * This script removes specific test data:
 * - ADM-20251224-0001 and all related payment data
 * - PATH-251224-0001 and all related payment data
 * - All payment data related to username "ashfaq"
 *
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🧹 Starting Test Data Cleanup...\n");

  try {
    // =========================================
    // 1. REMOVE ADMISSION ADM-20251224-0001
    // =========================================
    console.log("📋 Step 1: Removing ADM-20251224-0001...");

    const admission = await prisma.admission.findFirst({
      where: { admissionNumber: "ADM-20251224-0001" },
    });

    if (admission) {
      // Find patient account
      const patientAccount = await prisma.patientAccount.findUnique({
        where: { patientId: admission.patientId },
      });

      if (patientAccount) {
        // Find and delete all payments and related data
        const payments = await prisma.payment.findMany({
          where: { patientAccountId: patientAccount.id },
        });

        for (const payment of payments) {
          await prisma.paymentAllocation.deleteMany({
            where: { paymentId: payment.id },
          });
          await prisma.cashMovement.deleteMany({
            where: { paymentId: payment.id },
          });
        }

        await prisma.payment.deleteMany({
          where: { patientAccountId: patientAccount.id },
        });

        // Delete service charge allocations first
        const serviceCharges = await prisma.serviceCharge.findMany({
          where: { admissionId: admission.id },
        });

        for (const sc of serviceCharges) {
          await prisma.paymentAllocation.deleteMany({
            where: { serviceChargeId: sc.id },
          });
        }

        await prisma.serviceCharge.deleteMany({
          where: { admissionId: admission.id },
        });
      }

      // Delete the admission
      await prisma.admission.delete({ where: { id: admission.id } });

      console.log(`   ✅ Deleted admission ADM-20251224-0001 and related data`);
    } else {
      console.log(`   ⚠️  Admission ADM-20251224-0001 not found`);
    }

    // =========================================
    // 2. REMOVE PATHOLOGY PATH-251224-0001
    // =========================================
    console.log("\n📋 Step 2: Removing PATH-251224-0001...");

    const pathologyTest = await prisma.pathologyTest.findFirst({
      where: { testNumber: "PATH-251224-0001" },
    });

    if (pathologyTest) {
      // Find patient account
      const patientAccount = await prisma.patientAccount.findUnique({
        where: { patientId: pathologyTest.patientId },
      });

      if (patientAccount) {
        // Find and delete all payments and related data
        const payments = await prisma.payment.findMany({
          where: { patientAccountId: patientAccount.id },
        });

        for (const payment of payments) {
          await prisma.paymentAllocation.deleteMany({
            where: { paymentId: payment.id },
          });
          await prisma.cashMovement.deleteMany({
            where: { paymentId: payment.id },
          });
        }

        await prisma.payment.deleteMany({
          where: { patientAccountId: patientAccount.id },
        });

        // Delete service charge allocations first
        const serviceCharges = await prisma.serviceCharge.findMany({
          where: { pathologyTestId: pathologyTest.id },
        });

        for (const sc of serviceCharges) {
          await prisma.paymentAllocation.deleteMany({
            where: { serviceChargeId: sc.id },
          });
        }

        await prisma.serviceCharge.deleteMany({
          where: { pathologyTestId: pathologyTest.id },
        });
      }

      // Delete the pathology test
      await prisma.pathologyTest.delete({ where: { id: pathologyTest.id } });

      console.log(
        `   ✅ Deleted pathology test PATH-251224-0001 and related data`
      );
    } else {
      console.log(`   ⚠️  Pathology test PATH-251224-0001 not found`);
    }

    // =========================================
    // 3. REMOVE ALL PAYMENTS BY USER "ashfaq"
    // =========================================
    console.log("\n📋 Step 3: Removing all payment data for user 'ashfaq'...");

    const ashfaqUser = await prisma.user.findFirst({
      where: { username: "ashfaq" },
      include: { staff: true },
    });

    if (ashfaqUser && ashfaqUser.staff) {
      const staffId = ashfaqUser.staff.id;

      // Find all payments collected by this staff
      const payments = await prisma.payment.findMany({
        where: { collectedById: staffId },
      });

      console.log(`   Found ${payments.length} payments by ashfaq`);

      for (const payment of payments) {
        await prisma.paymentAllocation.deleteMany({
          where: { paymentId: payment.id },
        });
        await prisma.cashMovement.deleteMany({
          where: { paymentId: payment.id },
        });
        await prisma.payment.delete({ where: { id: payment.id } });
      }

      // Also delete cash movements on shifts by this staff (refunds without payment links)
      const shifts = await prisma.shift.findMany({
        where: { staffId },
      });

      for (const shift of shifts) {
        await prisma.cashMovement.deleteMany({
          where: { shiftId: shift.id, paymentId: null },
        });

        // Reset shift totals
        await prisma.shift.update({
          where: { id: shift.id },
          data: {
            systemCash: 0,
            totalCollected: 0,
            totalRefunded: 0,
          },
        });
      }

      console.log(
        `   ✅ Deleted ${payments.length} payments and reset ${shifts.length} shifts for user ashfaq`
      );
    } else {
      console.log(`   ⚠️  User 'ashfaq' not found`);
    }

    // =========================================
    // SUMMARY
    // =========================================
    console.log("\n" + "═".repeat(60));
    console.log("✅ Cleanup completed successfully!");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanupTestData()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
