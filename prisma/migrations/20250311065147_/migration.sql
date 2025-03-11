/*
  Warnings:

  - Added the required column `category` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usage` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "usage" TEXT NOT NULL;
