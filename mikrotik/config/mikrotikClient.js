const { PrismaClient } = require('@prisma/client');
const { RouterOSClient } = require('routeros-client');

const prisma = new PrismaClient();

async function getPlatformConfig(platformID) {
  try {
    const config = await prisma.platformSetting.findUnique({
      where: { platformID }
    });

    if (!config) {
      throw new Error(`No configuration found for platformID: ${platformID}`);
    }

    return config;
  } catch (error) {
    console.error('Error fetching platform configuration:', error);
    throw error;
  }
}

async function createMikrotikClient(platformID) {
  const config = await getPlatformConfig(platformID);

  if (!config.mikrotikHost || !config.mikrotikUser || !config.mikrotikPassword) {
    throw new Error('Mikrotik configuration is incomplete');
  }

  return new RouterOSClient({
    host: config.mikrotikHost,
    user: config.mikrotikUser,
    password: config.mikrotikPassword
  });
}

module.exports = { createMikrotikClient, getPlatformConfig };
