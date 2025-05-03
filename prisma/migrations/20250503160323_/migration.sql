/*
  Warnings:

  - You are about to drop the `DDNS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DDNS";

-- CreateTable
CREATE TABLE "ddns" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicIP" TEXT,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ddns_id_key" ON "ddns"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ddns_url_key" ON "ddns"("url");
