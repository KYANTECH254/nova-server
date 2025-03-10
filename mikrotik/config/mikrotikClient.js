const MikroNode = require("mikronode");
const { getPlatformConfig } = require("../../actions/operations");

async function createMikrotikClient(platformID) {
  const config = await getPlatformConfig(platformID);

  if (!config.mikrotikHost || !config.mikrotikUser || !config.mikrotikPassword) {
    throw new Error("Mikrotik configuration is incomplete");
  }

  const connection = new MikroNode.Connection(config.mikrotikHost, 8729, {
    username: config.mikrotikUser,
    password: config.mikrotikPassword,
    secure: true,
  });

  try {
    await connection.connect();
    return await connection.getClient();
  } catch (error) {
    console.error("MikroTik Connection Error:", error);
    throw new Error("Failed to connect to MikroTik");
  }
}

module.exports = { createMikrotikClient };
