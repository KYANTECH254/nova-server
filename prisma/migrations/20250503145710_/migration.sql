-- CreateTable
CREATE TABLE "DDNS" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "publicIP" TEXT,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DDNS_id_key" ON "DDNS"("id");
