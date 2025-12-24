/**
 * Fix Payment Allocations Script
 *
 * This script finds payments that are missing PaymentAllocation records
 * and creates them by matching payments to their corresponding service charges.
 *
 * Run with: npx tsx scripts/fix-payment-allocations.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixPaymentAllocations() {
  console.log("🔧 Starting Payment Allocations Fix...\n");

  try {
    // 1. Find all payments that don't have allocations
    const paymentsWithoutAllocations = await prisma.payment.findMany({
      where: {
        paymentAllocations: {
          none: {},
        },
      },
      include: {
        patientAccount: {
          include: {
            serviceCharges: true,
          },
        },
      },
    });

    console.log(
      `📊 Found ${paymentsWithoutAllocations.length} payments without allocations\n`
    );

    let fixed = 0;
    let skipped = 0;

    for (const payment of paymentsWithoutAllocations) {
      const serviceCharges = payment.patientAccount.serviceCharges;

      if (serviceCharges.length === 0) {
        console.log(
          `⚠️  Payment ${payment.receiptNumber}: No service charges found for patient account ${payment.patientAccountId}`
        );
        skipped++;
        continue;
      }

      // Try to find the matching service charge based on notes
      let matchedServiceCharge = null;

      // Check if this is an admission payment
      const admissionMatch = payment.notes?.match(/ADM-\d{8}-\d{4}/);
      if (admissionMatch) {
        // Find admission service charge
        matchedServiceCharge = serviceCharges.find(
          (sc) =>
            sc.serviceType === "ADMISSION" &&
            sc.serviceName.includes(admissionMatch[0])
        );
      }

      // Check if this is a pathology payment
      const pathologyMatch = payment.notes?.match(/PATH-\d{6}-\d{4}/);
      if (pathologyMatch) {
        // Find pathology service charge
        matchedServiceCharge = serviceCharges.find(
          (sc) =>
            sc.serviceType === "PATHOLOGY_TEST" &&
            sc.serviceName.includes(pathologyMatch[0])
        );
      }

      // If no match found by notes, try to match by date proximity
      if (!matchedServiceCharge && serviceCharges.length === 1) {
        // Only one service charge, use it
        matchedServiceCharge = serviceCharges[0];
      } else if (!matchedServiceCharge) {
        // Find the service charge closest in time to the payment
        const paymentTime = payment.paymentDate.getTime();
        matchedServiceCharge = serviceCharges.reduce((closest, current) => {
          const currentDiff = Math.abs(
            current.serviceDate.getTime() - paymentTime
          );
          const closestDiff = Math.abs(
            closest.serviceDate.getTime() - paymentTime
          );
          return currentDiff < closestDiff ? current : closest;
        });
      }

      if (matchedServiceCharge) {
        // Create PaymentAllocation
        await prisma.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            serviceChargeId: matchedServiceCharge.id,
            allocatedAmount: payment.amount,
          },
        });

        console.log(
          `✅ Fixed: Payment ${payment.receiptNumber} (${payment.amount}) → ${matchedServiceCharge.serviceType} (${matchedServiceCharge.serviceName})`
        );
        fixed++;
      } else {
        console.log(
          `⚠️  Payment ${payment.receiptNumber}: Could not find matching service charge`
        );
        skipped++;
      }
    }

    console.log("\n" + "═".repeat(60));
    console.log(`📈 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} payments`);
    console.log(`   ⚠️  Skipped: ${skipped} payments`);
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error fixing payment allocations:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPaymentAllocations()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
