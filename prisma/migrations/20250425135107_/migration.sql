-- CreateTable
CREATE TABLE "Funds" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "withdrawals" TEXT,
    "deposits" TEXT,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Funds_id_key" ON "Funds"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Funds_platformID_key" ON "Funds"("platformID");

-- CreateIndex
CREATE UNIQUE INDEX "Funds_adminID_key" ON "Funds"("adminID");
