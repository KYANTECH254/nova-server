const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

// Initialize Prisma
const prisma = new PrismaClient();
module.exports = prisma;
