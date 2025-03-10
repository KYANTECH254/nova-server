/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Platform_url_key" ON "Platform"("url");
