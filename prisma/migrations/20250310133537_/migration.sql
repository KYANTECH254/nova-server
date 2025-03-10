/*
  Warnings:

  - You are about to drop the column `mpesaPaybill` on the `PlatformSetting` table. All the data in the column will be lost.
  - You are about to drop the column `mpesaTill` on the `PlatformSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlatformSetting" DROP COLUMN "mpesaPaybill",
DROP COLUMN "mpesaTill",
ADD COLUMN     "mpesaShortCodeType" TEXT,
ADD COLUMN     "platformIP" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "token" DROP DEFAULT;
