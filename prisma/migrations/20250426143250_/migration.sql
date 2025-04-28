/*
  Warnings:

  - You are about to drop the column `adminID` on the `Funds` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Funds_adminID_key";

-- AlterTable
ALTER TABLE "Funds" DROP COLUMN "adminID";
