/*
  Warnings:

  - Added the required column `devices` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "devices" TEXT NOT NULL,
ADD CONSTRAINT "Package_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "Package_id_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "packageID" TEXT,
ADD COLUMN     "platformID" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'inactive',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "User_id_key";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_packageID_fkey" FOREIGN KEY ("packageID") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
