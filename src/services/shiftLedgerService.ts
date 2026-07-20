import { Prisma } from "@prisma/client";
import { GENERAL_TO_INFERTILITY_TRANSFER_MARKER } from "@/lib/infertilityTransfer";

export interface ReconciledShiftLedger {
  totalCollected: number;
  totalRefunded: number;
  systemCash: number;
}

const COLLECTION_MOVEMENT_TYPES = ["COLLECTION", "PAYMENT_RECEIVED"];

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

/**
 * Rebuilds the denormalized cash totals from the source ledger.
 *
 * Payment rows are the authoritative collection records. A small number of
 * old rows only have a collection movement, so unlinked collection movements
 * are included as a compatibility fallback. Linked collection movements are
 * intentionally not summed a second time.
 */
export async function reconcileGeneralShiftLedger(
  tx: Prisma.TransactionClient,
  shiftId: number,
  openingCash: Prisma.Decimal | number,
): Promise<ReconciledShiftLedger> {
  const [payments, fallbackCollections, refunds, cashFloat, changeGiven] =
    await Promise.all([
      tx.payment.aggregate({
        where: {
          shiftId,
          OR: [
            { notes: null },
            { notes: { not: { contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER } } },
          ],
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          shiftId,
          paymentId: null,
          movementType: { in: COLLECTION_MOVEMENT_TYPES },
          OR: [
            { description: null },
            {
              description: {
                not: { contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER },
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          shiftId,
          movementType: "REFUND",
          OR: [
            { description: null },
            {
              description: {
                not: { contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER },
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          shiftId,
          movementType: "CASH_FLOAT",
          OR: [
            { description: null },
            {
              description: {
                not: { contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER },
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          shiftId,
          movementType: "CHANGE_GIVEN",
          OR: [
            { description: null },
            {
              description: {
                not: { contains: GENERAL_TO_INFERTILITY_TRANSFER_MARKER },
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
    ]);

  const totalCollected =
    decimalToNumber(payments._sum.amount) +
    decimalToNumber(fallbackCollections._sum.amount);
  const totalRefunded = decimalToNumber(refunds._sum.amount);
  const systemCash =
    Number(openingCash) +
    totalCollected +
    decimalToNumber(cashFloat._sum.amount) -
    decimalToNumber(changeGiven._sum.amount) -
    totalRefunded;

  return { totalCollected, totalRefunded, systemCash };
}

export async function reconcileInfertilityShiftLedger(
  tx: Prisma.TransactionClient,
  shiftId: number,
  openingCash: Prisma.Decimal | number,
): Promise<ReconciledShiftLedger> {
  const [payments, fallbackCollections, refunds, cashFloat, changeGiven] =
    await Promise.all([
      tx.infertilityPayment.aggregate({
        where: { shiftId, isMigrationSuperseded: false },
        _sum: { amount: true },
      }),
      tx.infertilityCashMovement.aggregate({
        where: {
          shiftId,
          paymentId: null,
          isMigrationSuperseded: false,
          movementType: { in: COLLECTION_MOVEMENT_TYPES },
        },
        _sum: { amount: true },
      }),
      tx.infertilityCashMovement.aggregate({
        where: {
          shiftId,
          isMigrationSuperseded: false,
          movementType: "REFUND",
        },
        _sum: { amount: true },
      }),
      tx.infertilityCashMovement.aggregate({
        where: {
          shiftId,
          isMigrationSuperseded: false,
          movementType: "CASH_FLOAT",
        },
        _sum: { amount: true },
      }),
      tx.infertilityCashMovement.aggregate({
        where: {
          shiftId,
          isMigrationSuperseded: false,
          movementType: "CHANGE_GIVEN",
        },
        _sum: { amount: true },
      }),
    ]);

  const totalCollected =
    decimalToNumber(payments._sum.amount) +
    decimalToNumber(fallbackCollections._sum.amount);
  const totalRefunded = decimalToNumber(refunds._sum.amount);
  const systemCash =
    Number(openingCash) +
    totalCollected +
    decimalToNumber(cashFloat._sum.amount) -
    decimalToNumber(changeGiven._sum.amount) -
    totalRefunded;

  return { totalCollected, totalRefunded, systemCash };
}
