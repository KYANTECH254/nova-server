const { getMikrotikPlatformConfig, getPackagesByPlatformID, getPlatform } = require("../../actions/operations");
const { createMikrotikClient, createSingleMikrotikClient, AuthenticateRequest } = require("../config/mikrotikClient");
const crypto = require("crypto");
const axios = require('axios');
const { EmailTemplate } = require("../../mailer/mailerTemplates")
let mikrotikClientCache = {};

const manageMikrotikUser = async (data) => {
  const { platformID, action, profileName, host, username } = data;
  if (!platformID || !action) {
    return {
      success: false,
      message: "platformID and action are required parameters"
    };
  }

  let connection;
  try {
    connection = await createSingleMikrotikClient(platformID, host);

    if (!connection?.channel) {
      throw new Error("No valid MikroTik connection");
    }

    const { channel } = connection;

    if (action === "add") {
      if (!profileName) {
        throw new Error("profileName is required when adding users");
      }

      const existingProfiles = await channel.menu('/ip/hotspot/user/profile/print')
        .where('name', profileName)
        .get();

      if (existingProfiles.length === 0) {
        return {
          success: false,
          message: `Profile '${profileName}' not found`
        };
      }

      const packages = await getPackagesByPlatformID(platformID);
      if (!packages || packages.length === 0) {
        return {
          success: false,
          message: `No packages found for platform ${platformID}`
        };
      }

      const package = packages.find(pkg => pkg.name === profileName);
      if (!package) {
        return {
          success: false,
          message: `Package for profile '${profileName}' not found`
        };
      }

      let uptimeLimit = '';
      if (package.period && package.period !== 'Unlimited') {
        uptimeLimit = formatUptime(package.period);
      }

      let bytesTotal = '';
      if (package.usage && package.usage !== 'Unlimited') {
        const [value, unit] = package.usage.split(' ');
        bytesTotal = convertToBytes(parseFloat(value), unit).toString();
      }

      const cred = generateCode();
      const finalUsername = cred;
      const finalPassword = cred;

      const userData = {
        name: finalUsername,
        password: finalPassword,
        profile: profileName
      };

      if (uptimeLimit) {
        userData['limit-uptime'] = uptimeLimit;
      }

      if (bytesTotal) {
        userData['limit-bytes-total'] = bytesTotal;
      }

      await channel.menu('/ip/hotspot/user/add').add(userData);

      return {
        success: true,
        message: "User added successfully",
        username: finalUsername,
        password: finalPassword,
        profile: profileName,
        limits: {
          uptime: package.uptime,
          data: package.usage,
          speed: package.speed ? `${package.speed} Mbps` : 'Unlimited'
        }
      };
    } else if (action === "remove") {
      if (!username) {
        return {
          success: true,
          message: `username is required for removal`
        };
      }

      const existingUsers = await channel.menu('/ip/hotspot/user/print')
        .where('name', username)
        .get();

      if (existingUsers.length === 0) {
        return {
          success: true,
          message: `User '${username}' not found`
        };
      }

      const userId = existingUsers[0]['.id'] || existingUsers[0].id;
      await channel.menu('/ip/hotspot/user/remove').remove({ id: userId });
      return {
        success: true,
        message: "User removed successfully"
      };
    }
    else {
      return {
        success: false,
        message: "Invalid action. Use 'add' or 'remove'"
      };
    }
  } catch (error) {
    console.error(`User management failed (${action}):`, error);
    return {
      success: false,
      message: error.message,
      errorDetails: error.stack,
      action: action,
      profileName: profileName,
      username: username
    };
  }
}

const createMikrotikProfile = async (
  platformID,
  profileName,
  rateLimit,
  pool,
  host,
  sharedUsers,
  uptimeLimit,
  dataLimit
) => {
  let connection;
  try {
    connection = await createSingleMikrotikClient(platformID, host);

    if (!connection?.channel) {
      throw new Error("No valid MikroTik connection");
    }

    const { channel } = connection;
    const existingProfiles = await channel.menu('/ip/hotspot/user/profile/print')
      .where(`name=${profileName}`)
      .get();

    if (existingProfiles.length > 0) {
      return { success: false, message: "Profile name already exists" };
    }

    const profileData = {
      name: profileName,
      "rate-limit": rateLimit,
      "address-pool": pool
    };

    // Handle shared users with validation
    if (sharedUsers !== undefined && sharedUsers !== null) {
      if (String(sharedUsers).toLowerCase() === 'unlimited') {
        profileData["shared-users"] = "unlimited";
      } else {
        const numUsers = Number(sharedUsers);
        if (isNaN(numUsers)) {
          throw new Error("Invalid shared users value. Use number or 'Unlimited'");
        }
        profileData["shared-users"] = numUsers.toString();
      }
    }

    if (uptimeLimit) {
      const time = formatUptime(uptimeLimit)
      // Add time format validation
      if (!isValidMikrotikTime(time)) {
        throw new Error(`Invalid session-timeout format: ${time}. Use format like "1h30m" or "1d"`);
      }
      profileData["session-timeout"] = time;
    }

    if (dataLimit) {
      if (dataLimit === 'unlimited') {
        profileData["limit-bytes-total"] = "0";
      } else if (typeof dataLimit === 'object' && dataLimit.usage) {
        const match = dataLimit.usage.match(/^(\d+(?:\.\d+)?)\s*(GB|MB|KB|B)$/i);
        if (!match) {
          throw new Error(`Invalid usage format: ${dataLimit.usage}`);
        }

        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        const bytes = convertToBytes(value, unit);
        profileData["limit-bytes-total"] = bytes.toString();
      }
    }

    await channel.menu('/ip/hotspot/user/profile/add').add(profileData);
    return { success: true, message: "Profile created successfully" };
  } catch (error) {
    console.error(`Profile creation failed: ${error.message}`);
    return {
      success: false,
      message: error.message,
      errorDetails: error.stack
    };
  }
};

function formatUptime(input) {
  const timeMap = {
    minutes: 'm',
    hours: 'h',
    days: 'd'
  };
  const [value, unit] = input.split(' ');

  if (!timeMap[unit]) {
    throw new Error(`Invalid time unit: ${unit}. Use minutes/hours/days`);
  }

  return `${value}${timeMap[unit]}`;
}

function isValidMikrotikTime(time) {
  return /^(\d+d)?(\d+h)?(\d+m)?$/.test(time);
}

function convertToBytes(value, unit) {
  const unitMap = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4
  };

  if (!unitMap[unit]) {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  return Math.round(value * unitMap[unit]);
}

const updateMikrotikProfile = async (
  platformID,
  currentProfileName,
  newProfileName,
  rateLimit,
  pool,
  host,
  sharedUsers,
  uptimeLimit,
  dataLimit
) => {
  let connection;
  try {
    connection = await createSingleMikrotikClient(platformID, host);

    if (!connection?.channel) {
      throw new Error("No valid MikroTik connection");
    }

    const { channel } = connection;

    // Fetch the existing profile by name
    const existingProfiles = await channel.menu('/ip/hotspot/user/profile/print')
      .where('name', currentProfileName)
      .get();

    if (existingProfiles.length === 0) {
      return { success: false, message: "Profile not found" };
    }

    const currentProfile = existingProfiles[0];
    const profileData = {};

    // Handle profile name change
    if (newProfileName && newProfileName !== currentProfileName) {
      const nameCheck = await channel.menu('/ip/hotspot/user/profile/print')
        .where('name', newProfileName)
        .get();

      if (nameCheck.length > 0) {
        return { success: false, message: "New profile name already exists" };
      }
      profileData.name = newProfileName;
    }

    // Set rate-limit if provided
    if (rateLimit !== undefined && rateLimit !== currentProfile['rate-limit']) {
      profileData['rate-limit'] = rateLimit;
    }

    // Set address-pool if provided
    if (pool !== undefined && pool !== currentProfile['address-pool']) {
      profileData['address-pool'] = pool;
    }

    // Set shared-users (handle "unlimited" or number)
    if (sharedUsers !== undefined) {
      if (String(sharedUsers).toLowerCase() === 'unlimited') {
        profileData['shared-users'] = 'unlimited';
      } else {
        const numUsers = Number(sharedUsers);
        if (isNaN(numUsers)) {
          throw new Error("Invalid shared users value. Use a number or 'unlimited'");
        }
        profileData['shared-users'] = numUsers.toString();
      }
    }

    // Set session-timeout from uptimeLimit
    if (uptimeLimit) {
      const time = formatUptime(uptimeLimit);
      if (!isValidMikrotikTime(time)) {
        throw new Error(`Invalid session-timeout: ${time}. Use format like '1h30m' or '1d'`);
      }
      profileData['session-timeout'] = time;
    }

    // Set limit-bytes-total from dataLimit
    if (dataLimit) {
      if (dataLimit === 'unlimited') {
        profileData['limit-bytes-total'] = '0';
      } else if (typeof dataLimit === 'object') {
        const { value, unit } = dataLimit;
        if (!value || !unit) {
          throw new Error("Invalid dataLimit object: expected { value, unit }");
        }
        const bytes = convertToBytes(value, unit.toUpperCase());
        profileData['limit-bytes-total'] = bytes.toString();
      }
    }

    if (Object.keys(profileData).length === 0) {
      return { success: false, message: "No valid changes provided" };
    }

    // Update the profile
    await channel.menu('/ip/hotspot/user/profile/set')
      .where('id', currentProfile['id'])
      .update(profileData);

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error(`Profile update failed for ${currentProfileName}:`, error);
    return {
      success: false,
      message: error.message,
      errorDetails: error.stack
    };
  }
};

const deleteMikrotikProfile = async (platformID, profileName, host) => {
  let connection;
  try {
    connection = await createSingleMikrotikClient(platformID, host);

    if (!connection?.channel) {
      throw new Error("No valid MikroTik connection");
    }

    const { channel } = connection;
    const allProfiles = await channel.menu('/ip/hotspot/user/profile/print').get();
    const existingProfiles = await channel.menu('/ip/hotspot/user/profile/print')
      .where('name', profileName)
      .get();

    if (existingProfiles.length === 0) {
      return { success: true, message: "Profile not found" };
    }

    await channel.menu('/ip/hotspot/user/profile/remove')
      .where('id', existingProfiles[0]['id'])
      .remove();

    return {
      success: true,
      message: "Profile deleted successfully"
    };
  } catch (error) {
    console.error(`Profile deletion failed for ${profileName}:`, error);
    return {
      success: false,
      message: error.message,
      errorDetails: error.stack
    };
  }
};

const handlePackageLifecycle = async (platformID, packageData, action) => {
  const { speed } = packageData;

  try {
    if (action === 'create') {
      return await createMikrotikProfile(platformID, speed, speed);
    }
    if (action === 'delete') {
      return await deleteMikrotikProfile(platformID, speed);
    }
  } catch (error) {
    console.error(`Package ${action} failed:`, error);
    return {
      success: false,
      message: `Failed to ${action} package profile: ${error.message}`
    };
  }
};

const fetchAddressPoolsFromConnections = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  const auth = await AuthenticateRequest(token);
  if (!auth.success) {
    return res.json({
      success: false,
      message: auth.message,
    });
  }

  const platformID = auth.admin.platformID;
  if (!platformID) {
    return res.status(400).json({
      success: false,
      message: "Missing platformID.",
    });
  }

  const connections = await createMikrotikClient(token);
  if (!connections) {
    return res.status(400).json({
      success: false,
      message: "No valid router connections.",
    });
  }
  const validConnections = connections.filter(conn =>
    conn.status === "Connected" && conn.channel
  );

  const results = [];

  for (const conn of validConnections) {
    const { id, host, username, channel } = conn;

    try {
      const response = await channel.menu('/ip/pool').get();
      const pools = response.map(item => ({
        name: item.name,
        ranges: item.ranges,
        comment: item.comment || '',
      }));

      results.push({
        id,
        host,
        username, // Include username here
        status: 'success',
        data: {
          pools
        }
      });
    } catch (error) {
      results.push({
        id,
        host,
        username, // Include username here even in case of an error
        status: 'error',
        data: null,
        message: error.message
      });
    }
  }

  // Return the results in the standard format
  return res.status(200).json({
    success: true,
    message: "Address pools fetched successfully",
    pools: results
  });
};

const fetchMikrotikProfiles = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  const auth = await AuthenticateRequest(token);
  if (!auth.success) {
    return res.json({
      success: false,
      message: auth.message,
    });
  }

  const platformID = auth.admin.platformID;
  if (!platformID) {
    return res.status(400).json({
      success: false,
      message: "Missing platformID.",
    });
  }

  const connections = await createMikrotikClient(token);
  if (!connections) {
    return res.status(400).json({
      success: false,
      message: "No valid router connections.",
    });
  }
  const validConnections = connections.filter(conn =>
    conn.status === "Connected" && conn.channel
  );

  const results = [];

  for (const conn of validConnections) {
    const { id, host, username, channel } = conn;

    try {
      const response = await channel.menu('/ip/hotspot/user/profile').get();
      const profiles = response.map(item => ({
        name: item?.name || '',
        rateLimit: item?.rateLimit || '',
        sharedUsers: item?.sharedUsers ?? '',
        idleTimeout: item?.idleTimeout || '',
        keepaliveTimeout: item?.keepaliveTimeout || '',
        sessionTimeout: item?.sessionTimeout || '',
        statusAutorefresh: item?.statusAutorefresh || '',
        addMacCookie: item?.addMacCookie ?? '',
        macCookieTimeout: item?.macCookieTimeout || '',
        addressPool: item?.addressPool || '',
        comment: item?.comment || '',
      }));

      results.push({
        id,
        host,
        username,
        status: 'success',
        data: {
          profiles
        }
      });
    } catch (error) {
      results.push({
        id,
        host,
        username,
        status: 'error',
        data: null,
        message: error.message
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Hotspot user profiles fetched successfully",
    profiles: results
  });
};

const fetchStations = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  const auth = await AuthenticateRequest(token);
  if (!auth.success) {
    return res.json({
      success: false,
      message: auth.message,
    });
  }

  const platformID = auth.admin.platformID;
  if (!platformID) {
    return res.status(400).json({
      success: false,
      message: "Missing platformID.",
    });
  }

  try {
    // Fetch the stations from the platform
    const stations = await getMikrotikPlatformConfig(platformID);

    // Remove mikrotikPassword from each station object
    const sanitizedStations = stations.map(station => {
      const { mikrotikPassword, ...sanitizedStation } = station;
      return sanitizedStation;
    });

    // Return the sanitized list of stations
    return res.status(200).json({
      success: true,
      message: "Stations fetched successfully",
      stations: sanitizedStations,
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching stations.",
    });
  }
};

const fetchInterfaces = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const platformID = auth.admin.platformID;
    if (!platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platformID.",
      });
    }

    const connections = await createMikrotikClient(token);
    if (!connections) {
      return res.status(400).json({
        success: false,
        message: "No valid router connections.",
      });
    }
    const validConnections = connections.filter(conn =>
      conn.status === "Connected" && conn.channel
    );

    const results = [];

    for (const conn of validConnections) {
      const { id, host, username, channel } = conn;


      const response = await channel.menu('/interface/print').get();
      const interfaces = response.map(item => ({
        name: item?.name || '',
      }));

      results.push({
        id,
        host,
        username,
        status: 'success',
        data: {
          interfaces
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interfaces fetched successfully",
      profiles: results
    });
  } catch (error) {
    console.error("Error fetching interfaces:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching interfaces.",
    });
  }
};

const fetchPPPSecret = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const platformID = auth.admin.platformID;
    if (!platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platformID.",
      });
    }

    const connections = await createMikrotikClient(token);
    if (!connections) {
      return res.status(400).json({
        success: false,
        message: "No valid router connections.",
      });
    }
    const validConnections = connections.filter(conn =>
      conn.status === "Connected" && conn.channel
    );

    const results = [];

    for (const conn of validConnections) {
      const { id, host, username, channel } = conn;


      const response = await channel.menu('/interface/print').get();
      const interfaces = response.map(item => ({
        name: item?.name || '',
      }));

      results.push({
        id,
        host,
        username,
        status: 'success',
        data: {
          interfaces
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interfaces fetched successfully",
      profiles: results
    });
  } catch (error) {
    console.error("Error fetching interfaces:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching interfaces.",
    });
  }
};

const fetchPPPprofile = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const platformID = auth.admin.platformID;
    if (!platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platformID.",
      });
    }

    const connections = await createMikrotikClient(token);
    if (!connections) {
      return res.status(400).json({
        success: false,
        message: "No valid router connections.",
      });
    }
    const validConnections = connections.filter(conn =>
      conn.status === "Connected" && conn.channel
    );

    const results = [];

    for (const conn of validConnections) {
      const { id, host, username, channel } = conn;


      const response = await channel.menu('/ppp/profile/print').get();
      const interfaces = response.map(item => ({
        name: item?.name || '',
      }));

      results.push({
        id,
        host,
        username,
        status: 'success',
        data: {
          interfaces
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interfaces fetched successfully",
      profiles: results
    });
  } catch (error) {
    console.error("Error fetching interfaces:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching interfaces.",
    });
  }
};

const updateAddressPool = async (req, res) => {
  try {
    const { token, poolData } = req.body;
    if (!token || !poolData) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters are required",
      });
    }

    if (!poolData.name || !poolData.ranges || !poolData.station) {
      return res.status(400).json({
        success: false,
        message: "Pool data must include name and ranges",
      });
    }

    const ipRangeRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRangeRegex.test(poolData.ranges.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid IP range format. Must be in format: XXX.XXX.XXX.XXX-XXX.XXX.XXX.XXX",
        example: "192.168.88.10-192.168.88.254"
      });
    }

    const [startIp, endIp] = poolData.ranges.split('-');
    const ipToNumber = ip => {
      const parts = ip.split('.').map(Number);
      return parts[0] * 256 ** 3 + parts[1] * 256 ** 2 + parts[2] * 256 + parts[3];
    };

    if (ipToNumber(startIp) > ipToNumber(endIp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IP range: Start IP must be less than or equal to End IP",
        received: poolData.ranges
      });
    }

    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.status(401).json({
        success: false,
        message: auth.message,
      });
    }

    if (!auth.admin.platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platformID in authentication data",
      });
    }

    const connection = await createSingleMikrotikClient(auth.admin.platformID, poolData.station);
    if (!connection) {
      return res.status(400).json({
        success: false,
        message: "Failed to create MikroTik client",
      });
    }

    const channel = connection.channel;
    const existingPools = await channel.menu('/ip/pool').get();
    const existingPool = existingPools.find(pool => pool.name === poolData.name);

    if (existingPool) {
      // await channel.menu('/ip/pool').update(existingPool['.id'], {
      //   name: poolData.name,
      //   ranges: poolData.ranges,
      //   comment: poolData.comment || ''
      // });

      await channel.menu('/ip/pool').remove({
        id: existingPool['.id']
      });

      const addedPool = await channel.menu('/ip/pool').add({
        name: poolData.name,
        ranges: poolData.ranges,
        comment: poolData.comment || ''
      });

      return res.status(200).json({
        success: true,
        message: `Pool '${poolData.name}' updated successfully`,
        poolId: existingPool['.id']
      });
    } else {
      const addedPool = await channel.menu('/ip/pool').add({
        name: poolData.name,
        ranges: poolData.ranges,
        comment: poolData.comment || ''
      });

      return res.status(200).json({
        success: true,
        message: `Pool '${poolData.name}' added successfully`,
        poolId: addedPool['.id']
      });
    }

  } catch (error) {
    console.error("Error in update Address Pool:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const deleteAddressPool = async (req, res) => {
  try {
    const { token, poolData } = req.body;
    if (!token || !poolData) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters are required",
      });
    }
    const poolName = poolData.name;

    // Authenticate request
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.status(401).json({
        success: false,
        message: auth.message,
      });
    }

    if (!auth.admin.platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platformID in authentication data",
      });
    }

    // Get connections
    const connection = await createSingleMikrotikClient(auth.admin.platformID, poolData.station);
    if (!connection) {
      return res.status(400).json({
        success: false,
        message: "Failed to create MikroTik client",
      });
    }

    const channel = connection.channel;
    const existingPools = await channel.menu('/ip/pool').get();
    const existingPool = existingPools.find(pool => pool.name === poolData.name);
    if (!existingPool) {
      return {
        success: true,
        message: `Pool '${poolName}' not found`
      };
    }

    // Delete the pool
    await channel.menu('/ip/pool').remove({ id: existingPool['.id'] });
    return res.status(200).json({
      success: true,
      message: `Pool '${poolName}' deleted successfully`,
    });

  } catch (error) {
    console.error("Error in deleteAddressPool:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const updateMikrotikPPPoE = async (req, res) => {
  const {
    station,
    clientname,
    clientpassword,
    profile,
    interface: interfaceName,
    name,
    pool,
    price,
    maxsessions,
    servicename,
    period,
    id,
    token,
    localaddress,
    DNSserver,
    speed,
    email,
    status,
    paymentLink
  } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Missing authentication token",
    });
  }

  try {
    // Authentication and validation
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
      return res.status(401).json({
        success: false,
        message: auth.message,
      });
    }

    const platformID = auth.admin.platformID;
    if (!platformID) {
      return res.status(400).json({
        success: false,
        message: "Missing platform ID",
      });
    }

    // Connect to MikroTik
    const connection = await createSingleMikrotikClient(
      platformID,
      station
    );

    if (!connection?.channel) {
      throw new Error("Failed to establish MikroTik connection");
    }

    const { channel } = connection;
    const rateLimit = speed ? `${speed}M/${speed}M` : '';
    let pppoe_link = "";
    if (!paymentLink) {
      pppoe_link = Math.random().toString(36).substring(2, 15);
    }
    // PPPoE Server Configuration
    const existingServers = await channel.menu('/ppp/pppoe-server/print').get();
    const existingServer = existingServers.find(s => s.interface === interfaceName);

    if (!existingServer) {
      await channel.menu('/ppp/pppoe-server/add').create({
        'service-name': servicename,
        interface: interfaceName,
        'default-profile': profile,
        disabled: 'no',
        authentication: 'pap,chap,mschap2'
      });
    } else {
      const updates = {};

      if (existingServer['service-name'] !== servicename) {
        updates['service-name'] = servicename;
      }

      if (existingServer['default-profile'] !== profile) {
        updates['default-profile'] = profile;
      }

      if (Object.keys(updates).length > 0) {
        await channel.menu('/ppp/pppoe-server/set')
          .where('.id', existingServer['.id'])
          .update(updates);
      }
    }

    // PPP Profile Management
    let existingProfile = await channel.menu('/ppp/profile/print')
      .where('name', profile)
      .get();

    if (existingProfile.length === 0) {
      await channel.menu('/ppp/profile/add').create({
        name: profile,
        'local-address': localaddress,
        'remote-address': pool,
        'dns-server': DNSserver,
        'rate-limit': rateLimit,
        'change-tcp-mss': 'yes',
        'only-one': 'yes'
      });
    } else {
      const profileUpdates = {};
      const currentProfile = existingProfile[0];

      if (currentProfile['local-address'] !== localaddress) {
        profileUpdates['local-address'] = localaddress;
      }

      if (currentProfile['remote-address'] !== pool) {
        profileUpdates['remote-address'] = pool;
      }

      if (currentProfile['dns-server'] !== DNSserver) {
        profileUpdates['dns-server'] = DNSserver;
      }

      if (currentProfile['rate-limit'] !== rateLimit) {
        profileUpdates['rate-limit'] = rateLimit;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await channel.menu('/ppp/profile/set')
          .where('.id', currentProfile['.id'])
          .update(profileUpdates);
      }
    }

    // PPP Secret Management
    const existingSecret = await channel.menu('/ppp/secret/print')
      .where('name', clientname)
      .get();

    const secretParams = {
      name: clientname,
      password: clientpassword,
      service: 'pppoe',
      profile: profile,
      'limit-sessions': maxsessions,
      interface: interfaceName
    };

    if (existingSecret.length > 0) {
      await channel.menu('/ppp/secret/set')
        .where('.id', existingSecret[0]['.id'])
        .update(secretParams);
    } else {
      await channel.menu('/ppp/secret/add')
        .create(secretParams);
    }

    // Database Integration
    const pppoeData = {
      name,
      profile,
      servicename,
      station: station,
      pool,
      platformID,
      devices: "1",
      price,
      period,
      clientname,
      clientpassword,
      interface: interfaceName,
      maxsessions,
      status,
      paymentLink: paymentLink ? paymentLink : pppoe_link,
      email
    };

    const dbOperation = id
      ? prisma.pppoe.update({
        where: { id },
        data: pppoeData
      })
      : prisma.pppoe.create({
        data: pppoeData
      });

    const result = await dbOperation;
    const platform = await getPlatform(platformID);

    if (email) {
      const subject = `PPPoE Credentials from ${platform.name}!`
      const message = `Your PPPoE credentials have been created by ${auth.admin.name}.\n\n -- PPPoE Credentials -- \n Name: ${clientname} \n Password: ${clientpassword} \n For more status and information about this service visit https://${platform.url}/pppoe/${paymentLink}`;
      const data = {
        name: email,
        type: "accounts",
        email: email,
        subject: subject,
        message: message
      }
      const sendpppoeemail = await EmailTemplate(data);
      if (!sendpppoeemail.success) {
        return res.status(200).json({
          success: false,
          message: sendpppoeemail.message,
        });
      }
    }

    return res.json({
      success: true,
      message: id ? "PPPoE updated successfully" : "PPPoE created successfully",
      pppoe: result
    });

  } catch (error) {
    console.error('PPPoE Management Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const formatMikrotikTime = (mikrotikTime) => {
  return mikrotikTime
    .replace(/d/, " days ")
    .replace(/h/, " hours ")
    .replace(/m/, " minutes ")
    .replace(/s/, " seconds ");
};

const generateCode = (length = 6) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

module.exports = {
  manageMikrotikUser,
  handlePackageLifecycle,
  createMikrotikProfile,
  deleteMikrotikProfile,
  fetchAddressPoolsFromConnections,
  fetchStations,
  updateMikrotikProfile,
  AuthenticateRequest,
  fetchMikrotikProfiles,
  updateAddressPool,
  deleteAddressPool,
  fetchInterfaces,
  fetchPPPprofile,
  updateMikrotikPPPoE
};
