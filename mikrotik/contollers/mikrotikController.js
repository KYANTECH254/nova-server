const { getMikrotikPlatformConfig, getPackagesByPlatformID } = require("../../actions/operations");
const { createMikrotikClient, createSingleMikrotikClient, AuthenticateRequest } = require("../config/mikrotikClient");
const crypto = require("crypto");
let mikrotikClientCache = {}; 

const manageMikrotikUser = async (data) => {
  const { platformID, action, profileName, host } = data;
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
    }
    else if (action === "remove") {
      if (!data.username) {
        throw new Error("username is required for removal");
      }
      const existingUsers = await channel.menu('/ip/hotspot/user/print')
        .where('name', data.username)
        .get();

      if (existingUsers.length === 0) {
        return {
          success: false,
          message: `User '${data.username}' not found`
        };
      }
      await channel.menu('/ip/hotspot/user/remove')
        .where('.id', existingUsers[0]['.id'])
        .remove();

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
      username: data.username
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
      return { success: false, message: "Profile not found" };
    }

    await channel.menu('/ip/hotspot/user/profile/remove')
      .where('id', existingProfiles[0]['id']) // ✅ correct variable
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
      message: "Missing credentials required 2!",
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
      message: "Missing credentials required 2!",
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

    let stationClient = mikrotikClientCache[auth.admin.platformID];
    if (!stationClient) {
      stationClient = await createSingleMikrotikClient(auth.admin.platformID, poolData.station);
      if (!stationClient) {
        return res.status(400).json({
          success: false,
          message: "Failed to create MikroTik client",
        });
      }
      mikrotikClientCache[auth.admin.platformID] = stationClient;  
    }

    const channel = stationClient.channel;

    try {
      const existingPools = await channel.menu('/ip/pool').get();
      const existingPool = existingPools.find(pool => pool.name === poolData.name);
      const resultTemplate = { host: stationClient.host, username: stationClient.username };

      if (existingPool) {
        await channel.menu('/ip/pool').update(existingPool['.id'], {
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
      console.error("Error processing pool:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to process pool: ${error.message}`
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
    const connections = await createMikrotikClient(token);
    if (!connections || !connections.length) {
      return res.status(400).json({
        success: false,
        message: "No router connections available",
      });
    }

    const validConnections = connections.filter(conn =>
      conn.status === "Connected" && conn.channel
    );

    if (!validConnections.length) {
      return res.status(400).json({
        success: false,
        message: "No valid router connections available",
      });
    }

    // Process each connection
    const results = await Promise.all(
      validConnections.map(async (conn) => {
        const { id, host, username, channel } = conn;
        const resultTemplate = { id, host, username };

        try {
          const existingPools = await channel.menu('/ip/pool').get();
          const poolToDelete = existingPools.find(pool => pool.name === poolName);
          if (!poolToDelete) {
            return {
              ...resultTemplate,
              status: 'not_found',
              data: null,
              message: `Pool '${poolName}' not found`
            };
          }

          // Delete the pool
          await channel.menu('/ip/pool').remove(poolToDelete['.id']);
          return {
            ...resultTemplate,
            status: 'deleted',
            data: { poolName },
            message: `Pool '${poolName}' deleted successfully`,
            poolId: poolToDelete['.id']
          };
        } catch (error) {
          return {
            ...resultTemplate,
            status: 'error',
            data: null,
            message: `Failed to delete pool: ${error.message}`
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Address pool deletion completed",
      results
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
  deleteAddressPool
};
