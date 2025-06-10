-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Daily', 'Weekly', 'Monthly');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "code" TEXT NOT NULL DEFAULT 'null',
    "token" TEXT DEFAULT 'null',
    "platformID" TEXT NOT NULL,
    "packageID" TEXT,
    "expireAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Mpesa" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reqcode" TEXT,
    "phone" TEXT NOT NULL,
    "till" TEXT,
    "paybill" TEXT,
    "account" TEXT,
    "status" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "adminID" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'null',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "devices" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "adminID" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "routerHost" TEXT NOT NULL,
    "routerName" TEXT,
    "pool" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "SuperUser" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'null',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "platformIP" TEXT,
    "adminID" TEXT NOT NULL,
    "IsC2B" BOOLEAN DEFAULT false,
    "IsAPI" BOOLEAN DEFAULT false,
    "IsB2B" BOOLEAN DEFAULT true,
    "mpesaConsumerKey" TEXT,
    "mpesaConsumerSecret" TEXT,
    "mpesaShortCode" TEXT,
    "mpesaShortCodeType" TEXT,
    "mpesaAccountNumber" TEXT,
    "mpesaPassKey" TEXT,
    "mpesaPhone" TEXT,
    "mpesaSubAccountCode" TEXT,
    "mpesaSubAccountID" TEXT,
    "template" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "mikrotikHost" TEXT,
    "mikrotikPublicHost" TEXT,
    "mikrotikUser" TEXT,
    "mikrotikPassword" TEXT,
    "mikrotikPublicKey" TEXT,
    "mikrotikDDNS" TEXT,
    "mikrotikWebfigHost" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Funds" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "withdrawals" TEXT,
    "deposits" TEXT,
    "platformID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ddns" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicIP" TEXT,
    "platformID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

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
    "maxsessions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Mpesa_id_key" ON "Mpesa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Mpesa_code_key" ON "Mpesa"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_id_key" ON "Admin"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_token_key" ON "Admin"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Package_id_key" ON "Package"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SuperUser_id_key" ON "SuperUser"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SuperUser_email_key" ON "SuperUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuperUser_token_key" ON "SuperUser"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_id_key" ON "Platform"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_url_key" ON "Platform"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_platformID_key" ON "Platform"("platformID");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_adminID_key" ON "Platform"("adminID");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_id_key" ON "PlatformSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_platformID_key" ON "PlatformSetting"("platformID");

-- CreateIndex
CREATE UNIQUE INDEX "Station_id_key" ON "Station"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Funds_id_key" ON "Funds"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Funds_platformID_key" ON "Funds"("platformID");

-- CreateIndex
CREATE UNIQUE INDEX "ddns_id_key" ON "ddns"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ddns_url_key" ON "ddns"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Pppoe_id_key" ON "Pppoe"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Template_id_key" ON "Template"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_packageID_fkey" FOREIGN KEY ("packageID") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
