/*
  Warnings:

  - You are about to alter the column `defaultSalePrice` on the `Medicine` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Medicine" ALTER COLUMN "defaultSalePrice" SET DATA TYPE DECIMAL(65,30);
