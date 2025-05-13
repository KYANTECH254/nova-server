/*
  Warnings:

  - Added the required column `maxsessions` to the `Pppoe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pppoe" ADD COLUMN     "maxsessions" TEXT NOT NULL;
