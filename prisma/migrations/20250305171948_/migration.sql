-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "code" TEXT NOT NULL DEFAULT 'null',
    "token" TEXT DEFAULT 'null',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Mpesa" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "adminID" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'null',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "platformID" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "mpesaTill" TEXT DEFAULT 'null',
    "mpesaPaybill" TEXT DEFAULT 'null',
    "mpesaConsumerKey" TEXT,
    "mpesaConsumerSecret" TEXT,
    "mpesaShortCode" TEXT,
    "mpesaPassKey" TEXT,
    "mikrotikHost" TEXT,
    "mikrotikUser" TEXT,
    "mikrotikPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Mpesa_id_key" ON "Mpesa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Mpesa_code_key" ON "Mpesa"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_id_key" ON "Admin"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_adminID_key" ON "Admin"("adminID");

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
CREATE UNIQUE INDEX "Platform_platformID_key" ON "Platform"("platformID");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_id_key" ON "PlatformSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_platformID_key" ON "PlatformSetting"("platformID");
