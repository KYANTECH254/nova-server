-- CreateTable
CREATE TABLE "Ppppoe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "devices" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clientname" TEXT NOT NULL,
    "clientpassword" TEXT NOT NULL,
    "interface" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Ppppoe_id_key" ON "Ppppoe"("id");
