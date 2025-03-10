const { RouterOSClient } = require('routeros-client');
const { getPlatformConfig } = require("../../actions/operations")

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

module.exports = { createMikrotikClient };
