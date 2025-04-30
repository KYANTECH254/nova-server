/*
  Warnings:

  - You are about to drop the column `mikrotikPrivateHost` on the `Station` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Station" DROP COLUMN "mikrotikPrivateHost",
ADD COLUMN     "mikrotikPublicHost" TEXT;
