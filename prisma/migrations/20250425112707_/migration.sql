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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mpesa" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
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
    "mikrotikUser" TEXT,
    "mikrotikPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_packageID_fkey" FOREIGN KEY ("packageID") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
