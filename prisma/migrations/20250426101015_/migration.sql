/*
  Warnings:

  - You are about to drop the column `expireAt` on the `Admin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "expireAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expireAt" TIMESTAMP(3);
