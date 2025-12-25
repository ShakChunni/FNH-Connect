/**
 * Fix Cash Tracking Data Script
 *
 * This script:
 * 1. Removes all shift data from "ashfaq" username (payments, cash movements, reset shift totals)
 * 2. Fixes the fnh-koly shift where totalCollected was 12600 -> should be 1200
 *
 * Run with: npx tsx scripts/fix-cash-tracking-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixCashTrackingData() {
  console.log("🔧 Starting Cash Tracking Data Fix...\n");

  try {
    // =========================================
    // 1. REMOVE ALL SHIFT DATA FROM "ashfaq"
    // =========================================
    console.log("📋 Step 1: Cleaning up shift data for user 'ashfaq'...");

    const ashfaqUser = await prisma.user.findFirst({
      where: { username: "ashfaq" },
      include: { staff: true },
    });

    if (ashfaqUser && ashfaqUser.staff) {
      const staffId = ashfaqUser.staff.id;
      console.log(`   Found user 'ashfaq' with staffId: ${staffId}`);

      // Find all payments collected by this staff
      const payments = await prisma.payment.findMany({
        where: { collectedById: staffId },
      });

      console.log(`   Found ${payments.length} payments by ashfaq`);

      for (const payment of payments) {
        // Delete payment allocations
        await prisma.paymentAllocation.deleteMany({
          where: { paymentId: payment.id },
        });
        // Delete cash movements linked to payment
        await prisma.cashMovement.deleteMany({
          where: { paymentId: payment.id },
        });
        // Delete the payment
        await prisma.payment.delete({ where: { id: payment.id } });
      }

      // Find all shifts by this staff
      const shifts = await prisma.shift.findMany({
        where: { staffId },
      });

      console.log(`   Found ${shifts.length} shifts by ashfaq`);

      for (const shift of shifts) {
        // Delete all cash movements on this shift
        await prisma.cashMovement.deleteMany({
          where: { shiftId: shift.id },
        });

        // Reset shift totals to 0
        await prisma.shift.update({
          where: { id: shift.id },
          data: {
            openingCash: 0,
            closingCash: 0,
            systemCash: 0,
            totalCollected: 0,
            totalRefunded: 0,
            variance: 0,
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
    // 2. FIX fnh-koly SHIFT (12600 -> 1200)
    // =========================================
    console.log(
      "\n📋 Step 2: Fixing fnh-koly shift totalCollected 12640 -> 1200..."
    );

    const fnhKolyUser = await prisma.user.findFirst({
      where: { username: "fnh-koly" },
      include: { staff: true },
    });

    if (fnhKolyUser && fnhKolyUser.staff) {
      const staffId = fnhKolyUser.staff.id;
      console.log(`   Found user 'fnh-koly' with staffId: ${staffId}`);

      // Find the shift with totalCollected = 12600
      const shiftsWithWrongValue = await prisma.shift.findMany({
        where: {
          staffId,
          totalCollected: 12600,
        },
      });

      console.log(
        `   Found ${shiftsWithWrongValue.length} shift(s) with totalCollected = 12600`
      );

      for (const shift of shiftsWithWrongValue) {
        console.log(
          `   Shift #${shift.id}: totalCollected was ${shift.totalCollected}`
        );

        // Calculate the difference
        const difference = 12600 - 1200; // 11400 was incorrectly added

        // Update the shift
        await prisma.shift.update({
          where: { id: shift.id },
          data: {
            totalCollected: 1200,
            systemCash: {
              decrement: difference,
            },
          },
        });

        console.log(
          `   ✅ Updated Shift #${shift.id}: totalCollected changed from 12600 to 1200`
        );
      }

      // If no shifts found with exact 12600, let's show all shifts for this user
      if (shiftsWithWrongValue.length === 0) {
        const allShifts = await prisma.shift.findMany({
          where: { staffId },
          select: {
            id: true,
            totalCollected: true,
            totalRefunded: true,
            systemCash: true,
            startTime: true,
          },
        });

        console.log(`   All shifts for fnh-koly:`);
        for (const shift of allShifts) {
          console.log(
            `     Shift #${shift.id}: collected=${shift.totalCollected}, refunded=${shift.totalRefunded}, systemCash=${shift.systemCash}, started=${shift.startTime}`
          );
        }
      }
    } else {
      console.log(`   ⚠️  User 'fnh-koly' not found`);
    }

    // =========================================
    // 3. VERIFICATION - Show current state
    // =========================================
    console.log("\n📋 Step 3: Verification - Current shift data...\n");

    const allShifts = await prisma.shift.findMany({
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: 10,
    });

    console.log("Recent 10 shifts:");
    console.log("-".repeat(80));
    for (const shift of allShifts) {
      const username = shift.staff.user?.username || "N/A";
      const role = shift.staff.user?.role || "N/A";
      console.log(
        `Shift #${shift.id} | ${username} (${role}) | Collected: ${shift.totalCollected} | Refunded: ${shift.totalRefunded} | Active: ${shift.isActive}`
      );
    }
    console.log("-".repeat(80));

    // =========================================
    // SUMMARY
    // =========================================
    console.log("\n" + "═".repeat(60));
    console.log("✅ Cash tracking data fix completed successfully!");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error during fix:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixCashTrackingData()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
