/*
  Warnings:

  - You are about to drop the `Ppppoe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Ppppoe";

-- CreateTable
CREATE TABLE "Pppoe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "servicename" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "devices" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "usage" TEXT,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clientname" TEXT NOT NULL,
    "clientpassword" TEXT NOT NULL,
    "interface" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Pppoe_id_key" ON "Pppoe"("id");
