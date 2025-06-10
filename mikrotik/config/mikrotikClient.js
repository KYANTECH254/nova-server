const { RouterOSClient } = require('routeros-client');
const { getMikrotikPlatformConfig } = require("../../actions/operations");
const { AuthenticateRequest } = require("../../controllers/authController");

const createMikrotikClient = async (token) => {
  if (!token) return null;

  const auth = await AuthenticateRequest(token);
  if (!auth.success) return null;

  const platformID = auth.admin.platformID;
  const stations = await getMikrotikPlatformConfig(platformID);
  const connectionResults = [];

  for (const station of stations) {
    const { id, mikrotikHost, mikrotikUser, mikrotikPassword } = station;
    console.log("Connecting to MikroTik:", mikrotikHost, mikrotikUser, mikrotikPassword);

    if (!mikrotikHost || !mikrotikUser || !mikrotikPassword) {
      connectionResults.push({ id, status: "Failed", message: "Missing Credentials" });
      continue;
    }

    const api = new RouterOSClient({
      host: mikrotikHost,
      user: mikrotikUser,
      password: mikrotikPassword,
      port: 8728,
      timeout: 30000,
    });

    api.on('error', (err) => {
      console.error(`RouterOSClient error on ${mikrotikHost}:`, err.message);
      connectionResults.push({ id, status: "Failed", message: `RouterOSClient error on ${mikrotikHost}` });
    });

    try {
      const channel = await api.connect();
      const identity = await channel.menu('/system/identity').get();
      console.log(`Connected to ${mikrotikHost}:`, identity.data?.[0]);

      connectionResults.push({
        id,
        host: mikrotikHost,
        username: mikrotikUser,
        status: "Connected",
        channel,
        identity: identity.data?.[0] || {},
        message: "Connected Succesfully"
      });
    } catch (error) {
      console.error(`This Connection failed for ${mikrotikHost}:`, error.message);
      connectionResults.push({
        id,
        host: mikrotikHost,
        username: mikrotikUser,
        status: "Failed",
        message: "Failed to connect!"
      });
    }
  }

  // const hasConnected = connectionResults.some(res => res.status === "Connected");
  // return hasConnected ? connectionResults : null;
  return connectionResults;
};

const createSingleMikrotikClient = async (platformID, host) => {
  const stations = await getMikrotikPlatformConfig(platformID);
  const station = stations.find(station => station.mikrotikHost === host);

  if (!station) {
    console.log("No station found with the given host:", host);
    return null;
  }

  const { mikrotikUser, mikrotikPassword, mikrotikHost } = station;
  console.log("Connecting to MikroTik:", mikrotikHost, mikrotikUser, mikrotikPassword);

  const api = new RouterOSClient({
    host: mikrotikHost,
    user: mikrotikUser,
    password: mikrotikPassword,
    port: 8728,
    timeout: 30000,
  });

  api.on('error', (err) => {
    console.error(`RouterOSClient error on ${mikrotikHost}:`, err.message);
  });

  try {
    const channel = await api.connect();
    console.log("Connected to MikroTik, channel established:", channel);
    return { channel };
  } catch (error) {
    console.error(`Connection failed for ${mikrotikHost}:`, error.message);
    return null;
  }
};

module.exports = { createMikrotikClient, createSingleMikrotikClient, AuthenticateRequest };
