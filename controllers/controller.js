const axios = require('axios');
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const {
  getPackages,
  getCodesByPhone,
  getCodesByMpesa,
  createPlatform,
  deletePlatform,
  getPlatformByURLData,
  getAllPlatforms,
  getPlatformConfig,
  getPackagesByPlatformID,
  updatePlatformConfig,
  createPlatformConfig,
  updatePackage,
  createPackage,
  deletePackage,
  updateUser,
  deleteUser,
  updateAdmin,
  getAdminByToken,
  getUserByPlatform,
  getAdminsByID,
  deleteAdmin,
  createAdmin,
  getMpesaPayments,
  deleteMpesaPayment,
  getPlatform,
  updatePlatform,
  getStation,
  updateStation,
  deleteStation,
  getStations,
  createStation,
  createUser,
  getSuperUserByToken,
  getUsersByCodes,
  getDailyRevenue,
  getUsersByActiveCodes,
  getAdminByEmail,
  updateSuperUser,
  getAdmins,
  getPlatforms,
  getAllStations,
  getPackagesByID,
  getFunds
} = require("../actions/operations");
const { AuthenticateRequest } = require("../controllers/authController")
const { formatPhoneNumber } = require("../mpesa/controllers/mpesaControllers");
const {
  manageMikrotikUser,
  createMikrotikProfile,
  deleteMikrotikProfile,
  updateMikrotikProfile
} = require("../mikrotik/contollers/mikrotikController");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const generateToken = (adminID, platformID) => {
  return jwt.sign({ adminID, platformID }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const Packages = async (req, res) => {
  const { platformID } = req.body;
  if (!platformID) {
    return res
      .status(400)
      .json({ type: "error", message: "Platform ID is required." });
  }
  try {
    const packages = await getPackages(platformID);
    res.status(200).json({ type: "success", packages });
  } catch (error) {
    console.error("Error getting packages:", error);
    res.status(500).json({ type: "error", message: "Internal server error." });
  }
};

const getCode = async (req, res) => {
  const { phone, platformID } = req.body;
  let foundcodes = [];

  if (!platformID) {
    return res.json({
      type: "error",
      message: "Missing credentials required!",
    });
  }

  if (!phone) {
    return res.json({
      type: "error",
      message: "Phone number is required!",
    });
  }

  try {
    // Format phone number first
    if (!/^(07|01)\d{8}$/.test(phone)) {
      return res
        .status(400)
        .json({ type: "error", message: "Invalid phone number." });
    }
    // Try to find by phone (user account)
    const phoneCodes = await getCodesByPhone(phone, platformID);
    console.log("Codes", phoneCodes);

    if (phoneCodes && phoneCodes.length > 0) {
      foundcodes = phoneCodes;
    }

    // If no codes found by phone, try using phone as MPESA code
    if (foundcodes.length === 0) {
      const mpesaCodes = await getCodesByMpesa(phone, platformID);
      if (mpesaCodes && mpesaCodes.length > 0) {
        foundcodes = mpesaCodes;
      }
    }

    if (foundcodes.length === 0) {
      return res.json({ type: "error", message: "No codes found." });
    }

    // Filter out any null values
    const validCodes = foundcodes.filter(code => code !== null);

    if (validCodes.length === 0) {
      return res.json({ type: "error", message: "No valid codes found." });
    }

    const formattedCodes = validCodes.map((code) => {
      const createdAtFormatted = moment(code.createdAt).format("YYYY-MM-DD HH:mm:ss");
      const expireAtFormatted = moment(code.expireAt).format("YYYY-MM-DD HH:mm:ss");
      let timeLeft = "Unknown";
      if (code.expireAt) {
        const diff = moment(code.expireAt).diff(moment(), "minutes");

        if (diff <= 0) {
          timeLeft = "Expired";
        } else {
          // Extract hours and minutes without rounding
          const duration = moment.duration(diff, 'minutes');
          const hours = Math.floor(duration.asHours());
          const minutes = duration.minutes();
          timeLeft = `${hours} hours ${minutes} minutes remaining`;
        }
      }

      return {
        username: code.username,
        password: code.password,
        expired: timeLeft === "Expired",
        activeFrom: createdAtFormatted || "Unknown",
        timeLeft: timeLeft || "Unknown",
        createdAt: createdAtFormatted,
        expireAt: expireAtFormatted,
      };
    });

    return res.status(200).json({
      type: "success",
      foundcodes: formattedCodes
    });
  } catch (error) {
    console.error("Error getting codes:", error);
    res.status(500).json({
      type: "error",
      message: "Internal server error.",
      error: error.message
    });
  }
};

const getCodes = async (req, res) => {
  const { platformID } = req.body;
  if (!platformID) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const codes = await getUsersByCodes(platformID);
    const latestFiveCodes = codes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      message: "Codes fetched",
      codes: latestFiveCodes,
    });
  } catch (error) {
    console.error("Error getting codes:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const addPlatform = async (req, res) => {
  const { name, url, platformID, adminID } = req.body;
  if (!name || !url || !platformID || !adminID) {
    return res.json({
      success: false,
      message: "Missing credentials are required!",
    });
  }
  const data = {
    name: name,
    url: url,
    platformID: platformID,
    adminID: adminID,
  };
  try {
    const check = await getPlatformByURLData(url);
    if (check) {
      return res.json({
        success: false,
        message: "Platform name already exists choose another name",
      });
    }
    const add = await createPlatform(data);
    return res.json({ success: true, message: "Platform added successfully" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const registerPlatform = async (req, res) => {
  const { name, email, password, url, platformID, adminID } = req.body;

  // Validate required fields
  if (!name || !url || !email || !password || !platformID || !adminID) {
    return res.status(400).json({
      success: false,
      message: "All credentials are required!",
    });
  }

  try {
    // Check if platform already exists
    const checkplatform = await getPlatformByURLData(url);
    if (checkplatform) {
      return res.status(409).json({
        success: false,
        message: "Platform name or URL already exists. Please choose another name.",
      });
    }

    // Check if user already exists
    const user = await getAdminByEmail(email);
    if (user) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists!",
      });
    }

    // Get Cloudflare credentials
    const zoneId = process.env.ZONE_ID;
    const apiToken = process.env.API_TOKEN;

    if (!zoneId || !apiToken) {
      return res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
    }

    // Clean URL for DNS record
    const dnsName = url.replace(/^https?:\/\//, '').split('/')[0];

    // Create DNS record in Cloudflare
    const cfResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        type: "A",
        name: dnsName,
        content: "16.170.70.95",
        ttl: 1,
        proxied: false
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!cfResponse.data.success) {
      const errorMessages = cfResponse.data.errors.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `DNS creation failed: ${errorMessages}`,
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const token = generateToken(adminID, platformID);
    const newAdmin = await createAdmin({
      platformID,
      adminID,
      phone: "",
      role: "superuser",
      email,
      password: hashedPassword,
      name: name,
      token,
    });

    // Create platform
    const newPlatform = await createPlatform({
      name,
      url: dnsName,
      platformID,
      adminID
    });

    return res.status(201).json({
      success: true,
      message: "Platform created successfully",
      user: {
        id: adminID,
        email: email,
        name: name,
        role: "superuser"
      },
      token: token,
      platform: newPlatform
    });

  } catch (error) {
    console.error("Registration error:", error);

    let errorMessage = "An error occurred during registration";
    if (error.response) {
      // Handle axios errors
      errorMessage = error.response.data?.errors?.map(err => err.message).join(', ') || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

const deletePlatformID = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials are required!",
    });
  }
  try {
    const del = await deletePlatform(id);
    return res.json({ success: true, message: "Platform deleted!" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const fetchPlatforms = async (req, res) => {
  try {
    const platforms = await getAllPlatforms();
    return res.json({
      success: true,
      message: "Platforms fetched!",
      platforms: platforms,
    });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const addAdmin = async (res, req) => {
  const { platformID, adminID, phone, email, password, name } = req.body;
  try {
    if ((!platformID || !adminID || !phone || !email || !password, !name)) {
      return res.json({
        success: false,
        message: "Missing credentials are required!",
      });
    }
    const token = generateToken(adminID, platformID);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const addadmin = await createAdmin({
      platformID: platformID,
      adminID: adminID,
      phone: phone,
      email: email,
      password: hashedPassword,
      name: name,
      token: token,
    });
    return res.json({ success: true, message: "Admin added!" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const LoginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required!",
    });
  }

  try {
    const user = await getAdminByEmail(email);
    if (!user) {
      return res.json({
        success: false,
        message: "Email does not exist!",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: "Invalid password!",
      });
    }
    const token = generateToken(user.adminID, user.platformID);
    const upd = await updateAdmin(user.id, { token: token });
    return res.json({
      success: true,
      message: "Login successful!",
      token: token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.json({
      success: false,
      message: "Internal server error",
    });
  }
};

const LoginManager = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required!",
    });
  }

  try {
    const user = await prisma.superUser.findFirst({
      where: {
        email: email,
        password: password,
      },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email or password!",
      });
    }

    const token = generateToken(user.email, user.password);
    const updatedUser = await updateSuperUser({ id: user.id, token });
    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.json({
      success: false,
      message: "Internal server error",
    });
  }
};

const fetchPayments = async (req, res) => {
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
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const payments = await getMpesaPayments(platformID);
    return res.json({
      success: true,
      message: "Payments fetched",
      payments: payments,
    });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const fetchModerators = async (req, res) => {
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

  const adminID = auth.admin.adminID;
  if (!adminID) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const moderators = await getAdminsByID(adminID);
    return res.json({
      success: true,
      message: "Moderators fetched",
      moderators: moderators,
    });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const addModerators = async (req, res) => {
  const { name, email, phone, password, role, adminID, platformID } = req.body;
  if (
    !name ||
    !email ||
    !phone ||
    !password ||
    !role ||
    !adminID ||
    !platformID
  ) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const admin = await getAdminByEmail(email);
    if (admin) {
      return res.json({
        success: false,
        message: "Email already exists!",
      });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const token = generateToken(adminID, platformID);
    const moderators = await createAdmin({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      adminID,
      platformID,
      token,
    });
    return res.json({ success: true, message: "Moderator added" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const updateModerators = async (req, res) => {
  const { id, name, email, phone, password, role, adminID, platformID } =
    req.body;
  if (
    !id ||
    !name ||
    !email ||
    !phone ||
    !password ||
    !role ||
    !adminID ||
    !platformID
  ) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const data = {
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      role: role,
      adminID: adminID,
      platformID: platformID,
    };
    const moderators = await updateAdmin(id, data);
    return res.json({ success: true, message: "Moderator updated" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const deleteModerators = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const moderators = await deleteAdmin(id);
    return res.json({ success: true, message: "Moderator deleted" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const fetchCodes = async (req, res) => {
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
    return res.json({
      success: false,
      message: "Missing credentials required 3!",
    });
  }
  try {
    const codes = await getUserByPlatform(platformID);
    return res.json({ success: true, message: "Codes fetched", codes: codes });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const updateCodes = async (req, res) => {
  const { id, data } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const codes = await updateUser(id, data);
    return res.json({ success: true, message: "Codes updated" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const deleteCodes = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const codes = await deleteUser(id);
    return res.json({ success: true, message: "Code deleted" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const fetchPackages = async (req, res) => {
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
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const packages = await getPackagesByPlatformID(platformID);
    return res.json({
      success: true,
      message: "packages fetched",
      packages: packages,
    });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const updatePackages = async (req, res) => {
  const {
    id,
    adminID,
    platformID,
    name,
    period,
    price,
    speed,
    devices,
    usage,
    category,
    pool,
    station,
    host,
    profile
  } = req.body;
  // Validate required fields
  if (!platformID || !adminID || !name || !period || !price || !speed || !devices || !usage || !category || !pool || !host || !station) {
    return res.json({
      success: false,
      message: "Missing required fields!",
    });
  }

  try {
    const pkg = await getPackagesByID(id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package does not exist!",
      });
    }
    if (profile) {
      const packagename = pkg.name;
      if (packagename !== name) {
        return res.json({ success: false, message: "Invalid update operation tried,mikrotik user profile name cannot be different from database name, try again!" });
      }
      const rateLimit = `${speed}M/${speed}M`;

      const profileUpdate = await updateMikrotikProfile(
        platformID,
        packagename,
        name,
        rateLimit,
        pool,
        host,
        devices,
        period,
        usage,
      )
      if (!profileUpdate.success) {
        return res.json({
          success: false,
          message: `Profile creation failed: ${profileCreation.message}`
        });
      }
    }

    const data = {
      adminID,
      platformID,
      name,
      period,
      price,
      speed,
      devices,
      usage,
      category,
      routerHost: host,
      routerName: station,
      pool
    };

    const packages = await updatePackage(id, platformID, data);
    return res.json({ success: true, message: "Package updated" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const addPackages = async (req, res) => {
  const {
    platformID,
    adminID,
    name,
    period,
    price,
    speed,
    devices,
    usage,
    category,
    pool,
    station,
    host,
    profile,
  } = req.body;

  // Validate required fields
  if (!platformID || !adminID || !name || !period || !price || !speed || !devices || !usage || !category || !pool || !host || !station) {
    return res.json({
      success: false,
      message: "Missing required fields!",
    });
  }

  try {
    let profileCreation;
    if (!profile) {
      const rateLimit = `${speed}M/${speed}M`;
      profileCreation = await createMikrotikProfile(
        platformID,
        name,
        rateLimit,
        pool,
        host,
        devices,
        period,
        usage
      );

      if (!profileCreation.success) {
        return res.json({
          success: false,
          message: `Profile creation failed: ${profileCreation.message}`
        });
      }
    }

    // Then create the package in database
    const packageData = {
      adminID,
      platformID,
      name,
      period,
      price,
      speed,
      devices,
      usage,
      category,
      routerHost: host,
      routerName: station,
      pool
    };

    const newPackage = await createPackage(packageData);

    return res.json({
      success: true,
      message: "Package and MikroTik profile created successfully",
      package: newPackage,
      mikrotikProfile: profileCreation
    });

  } catch (error) {
    console.error("Package creation error:", error);
    return res.json({
      success: false,
      message: error.message || "Package creation failed",
      error: error.toString()
    });
  }
};

const deletePackages = async (req, res) => {
  const { id, platformID, host } = req.body;

  if (!id || !platformID) {
    return res.status(400).json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const pkg = await getPackagesByID(id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package does not exist!",
      });
    }
    const packagename = pkg.name;

    const delProfileResult = await deleteMikrotikProfile(platformID, packagename, host);
    if (!delProfileResult.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to delete MikroTik profile: ${delProfileResult.message}`,
      });
    }

    const delResult = await deletePackage(id);
    if (!delResult) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete package from database.",
      });
    }

    return res.json({ success: true, message: "Package deleted successfully." });
  } catch (error) {
    console.error("An error occurred while deleting package:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};


const fetchSettings = async (req, res) => {
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
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const settings = await getPlatformConfig(platformID);
    const platform = await getPlatform(platformID);

    let name = "";
    let url = "";
    if (platform) {
      name = platform.name;
      url = platform.url;
    }

    const platformSettings = settings || {
      mpesaConsumerKey: "",
      mpesaConsumerSecret: "",
      mpesaShortCode: "",
      mpesaShortCodeType: "Till",
      mpesaPassKey: "",
      adminID: "",
      IsC2B: false,
      IsAPI: false,
      IsB2B: true
    };

    return res.json({
      success: true,
      message: "Settings fetched",
      name,
      url,
      settings: platformSettings,
    });
  } catch (error) {
    console.log("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

async function updateSettings(req, res) {
  const { token, data } = req.body;
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
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  const { mpesaConsumerKey, mpesaConsumerSecret, mpesaShortCode, mpesaShortCodeType, mpesaAccountNumber, mpesaPassKey, adminID, IsC2B, IsAPI, IsB2B } = data;
  if (IsC2B === true) {
    if (!mpesaShortCode || !mpesaShortCodeType || !adminID) {
      return res.json({
        success: false,
        message: "All MPESA fields must be filled out!",
      });
    }
  } else if (IsAPI === true) {
    if (!mpesaConsumerKey || !mpesaConsumerSecret || !mpesaShortCode || !mpesaShortCodeType || !mpesaPassKey || !adminID) {
      return res.json({
        success: false,
        message: "All MPESA fields must be filled out!",
      });
    }
  } else if (IsB2B === true) {
    if (!mpesaShortCode || !mpesaShortCodeType || !adminID) {
      return res.json({
        success: false,
        message: "All MPESA fields must be filled out!",
      });
    }
  }

  try {
    const existingConfig = await getPlatformConfig(platformID);
    if (!existingConfig) {
      const add = createPlatformConfig(platformID, data);
      return res.json({
        success: true,
        message: "Platform Settings created.",
      });
    }

    const updatedConfig = await updatePlatformConfig(platformID, data);
    return res.json({
      success: true,
      message: "Platform Settings updated.",
    });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
}

const addSettings = async (req, res) => {
  const { data, platformID } = req.body;
  if (!platformID) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const settings = await createPlatformConfig(platformID, data);
    return res.json({ success: true, message: "settings added" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const authAdmin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json({
        success: false,
        message: "Missing credentials required!",
      });
    }
    const admin = await getAdminByToken(token.trim());
    if (!admin) {
      return res.json({
        success: false,
        message: "Invalid token. Authentication failed!",
      });
    }
    return res.json({
      success: true,
      message: "Authentication successful",
      admin,
    });
  } catch (error) {
    console.error("An error occurred during authentication:", error);
    return res.json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const authManager = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json({
        success: false,
        message: "Missing credentials required!",
      });
    }
    const admin = await getSuperUserByToken(token);
    if (!admin) {
      return res.json({
        success: false,
        message: "Invalid token. Authentication failed!",
      });
    }
    return res.json({
      success: true,
      message: "Authentication successful",
      admin,
    });
  } catch (error) {
    console.error("An error occurred during authentication:", error);
    return res.json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const deletePayment = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const del = await deleteMpesaPayment(id);
    return res.json({ success: true, message: "Payment deleted" });
  } catch (error) {
    console.log("An error occured", error);
    return res.json({ success: false, message: "An error occured" });
  }
};

const updateName = async (req, res) => {
  const { token, name, url } = req.body;
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
  if (!platformID || !name || !url) {
    return res.status(400).json({
      success: false,
      message: "Missing required credentials!",
    });
  }

  try {
    // Check if new URL already exists
    const exists = await getPlatformByURLData(url);
    if (exists && exists.platformID !== platformID) {
      return res.status(409).json({
        success: false,
        message: "This URL is already in use by another platform"
      });
    }

    // Get existing platform data
    const existingPlatform = await getPlatform(platformID);
    if (!existingPlatform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found!"
      });
    }

    const zoneId = process.env.ZONE_ID;
    const apiToken = process.env.API_TOKEN;

    if (!zoneId || !apiToken) {
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error",
      });
    }

    // Clean URLs for DNS operations
    const existingDnsName = existingPlatform.url.replace(/^https?:\/\//, '').split('/')[0];
    const newDnsName = url.replace(/^https?:\/\//, '').split('/')[0];

    // Step 1: Get existing DNS record ID
    let dnsRecordId = null;
    try {
      const listResponse = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${existingDnsName}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (listResponse.data.success && listResponse.data.result.length > 0) {
        dnsRecordId = listResponse.data.result[0].id;
      }
    } catch (error) {
      console.error("Error fetching DNS records:", error);
      // Continue even if we can't find the old record - might have been deleted manually
    }

    // Step 2: Delete existing DNS record if found
    if (dnsRecordId) {
      try {
        await axios.delete(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${dnsRecordId}`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (error) {
        console.error("Error deleting DNS record:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to clean up existing DNS record",
        });
      }
    }

    // Step 3: Create new DNS record
    try {
      const cfResponse = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          type: "A",
          name: newDnsName,
          content: "51.21.158.217",
          ttl: 1,
          proxied: false
        },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!cfResponse.data.success) {
        const errorMessages = cfResponse.data.errors.map(err => err.message).join(', ');
        return res.status(400).json({
          success: false,
          message: `DNS creation failed: ${errorMessages}`,
        });
      }
    } catch (error) {
      console.error("DNS creation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create new DNS record",
      });
    }

    // Step 4: Update platform in database
    const data = { name, url: newDnsName }; // Store cleaned URL
    const upd = await updatePlatform(platformID, data);

    if (!upd) {
      return res.status(500).json({
        success: false,
        message: "Failed to update platform in database",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Platform updated successfully",
      data: {
        name,
        url: newDnsName
      }
    });

  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during update"
    });
  }
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
    return res.json({
      success: false,
      message: "Missing credentials are required",
    });
  }
  try {
    const stations = await getStations(platformID);
    return res.json({
      success: true,
      message: "Stations fetched",
      stations: stations,
    });
  } catch (error) {
    console.log("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

const fetchAllStations = async (req, res) => {
  try {
    const stations = await getAllStations();
    return res.json({
      success: true,
      message: "Stations fetched",
      stations: stations,
    });
  } catch (error) {
    console.log("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

const updateStations = async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  const platformID = data.platformID;
  const stationID = data.id;

  try {
    let station;
    if (stationID !== "") {
      station = await getStation(stationID);
    }

    if (!station) {
      const { id, ...newData } = data;
      const newStation = await createStation(newData);
      return res.json({
        success: true,
        message: "Station added",
        station: newStation,
      });
    }
    const updatedStation = await updateStation(stationID, data);
    return res.json({
      success: true,
      message: "Station updated",
      station: updatedStation,
    });
  } catch (error) {
    console.log("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

const deleteStations = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const stations = await deleteStation(id);
    return res.json({
      success: true,
      message: "Station deleted",
      data: stations,
    });
  } catch (error) {
    console.log("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

const addCode = async (req, res) => {
  const { data } = req.body;
  console.log("Data 2", data)
  if (!data) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  const { phone, packageID, platformID, package } = data;

  try {
    const pkg = await getPackagesByID(packageID);
    if (!pkg) {
      return res.json({
        success: false,
        message: "Failed to add user to MikroTik, Package not found!",
      });
    }
    const profileName = pkg.name;
    const hostdata = await getStations(platformID);
    if (!hostdata) {
      return res.json({
        success: false,
        message: "Failed to add user to MikroTik, Router not found!",
      });
    }
    const host = hostdata[0].mikrotikHost;
    const mikrotikData = {
      platformID,
      action: "add",
      profileName,
      host
    };
    const addUserToMikrotik = await manageMikrotikUser(mikrotikData)
    if (!addUserToMikrotik) {
      return res.json({
        success: false,
        message: "Failed to add user to MikroTik",
      });
    }

    if (addUserToMikrotik.success) {
      let expireAt = null;
      if (pkg?.period) {
        const now = new Date();
        const period = pkg.period.toLowerCase();

        const match = period.match(/^(\d+)\s+(hour|minute|day|month|year)s?$/i);

        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();

          switch (unit) {
            case 'minute':
              expireAt = new Date(now.getTime() + value * 60000);
              break;
            case 'hour':
              expireAt = new Date(now.getTime() + value * 3600000);
              break;
            case 'day':
              expireAt = new Date(now.getTime() + value * 86400000);
              break;
            case 'month':
              expireAt = new Date(now.setMonth(now.getMonth() + value));
              break;
            case 'year':
              expireAt = new Date(now.setFullYear(now.getFullYear() + value));
              break;
          }
        }
      }

      const code = await createUser({
        status: "active",
        platformID: platformID,
        phone: phone,
        username: addUserToMikrotik.username,
        password: addUserToMikrotik.password,
        expireAt: expireAt
      });

      return res.json({
        success: true,
        message: "Code added successfully",
        code: code,
      });
    } else {
      return res.json({
        success: false,
        message: `Failed to add user to MikroTik, ${addUserToMikrotik.message}`,
      });
    }

  } catch (error) {
    console.log("An error occurred", error);
    return res.json({
      success: false,
      message: "An error occurred while adding the user",
    });
  }
};

const fetchDashboardStats = async (req, res) => {
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
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    let IsB2B = false;
    const platformsettings = await getPlatformConfig(platformID);
    if (platformsettings) {
      IsB2B = platformsettings.IsB2B;
    }

    const codes = await getUsersByActiveCodes(platformID);
    const codestotalTally = codes.length;

    const packages = await getPackagesByPlatformID(platformID);
    const packagestotalTally = packages.length;

    const revenue = await getDailyRevenue(platformID);
    const revenueTotalTally = revenue.totalRevenue || 0;

    const routers = await getStations(platformID);
    const routersTally = routers.length;

    const allfunds = await getFunds(platformID);
    let balance = 0;
    let withdrawals = 0;
    if (allfunds) {
      balance = allfunds.balance;
      withdrawals = allfunds.withdrawals;
    }

    const stats = {
      totalUsers: codestotalTally,
      totalPackages: packagestotalTally,
      dailyRevenue: revenueTotalTally,
      routers: routersTally
    };

    const funds = {
      balance: balance,
      withdrawals: withdrawals
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched",
      stats,
      funds,
      IsB2B: IsB2B
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const fetchSuperDashboardStats = async (req, res) => {
  try {
    const platforms = await getPlatforms();
    const platformstotalTally = platforms.length;

    const admins = await getAdmins();
    const adminstotalTally = admins.length;

    const stats = {
      totalAdmins: adminstotalTally,
      totalPlatforms: platformstotalTally,
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched",
      stats,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

async function createNginxConfig(subdomain) {
  const serverName = subdomain;
  const config = `
server {
    listen 80;
    server_name ${serverName};

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  // Save to /etc/nginx/sites-available/{subdomain}.conf
  const configPath = `/etc/nginx/sites-available/${subdomain}.conf`;
  fs.writeFileSync(configPath, config);

  // Symlink to sites-enabled
  const enabledPath = `/etc/nginx/sites-enabled/${subdomain}.conf`;
  fs.symlinkSync(configPath, enabledPath);

  // Reload Nginx to apply the config
  const { exec } = require("child_process");
  exec("systemctl reload nginx", (err, stdout, stderr) => {
    if (err) {
      console.error("Failed to reload Nginx:", stderr);
    } else {
      console.log("Nginx reloaded successfully.");
    }
  });
}


module.exports = {
  AuthenticateRequest,
  authAdmin,
  Packages,
  getCode,
  addPlatform,
  deletePlatform,
  deletePlatformID,
  fetchPlatforms,
  addAdmin,
  LoginAdmin,
  fetchPayments,
  fetchModerators,
  fetchCodes,
  fetchPackages,
  fetchSettings,
  updateSettings,
  addSettings,
  updatePackages,
  addPackages,
  deletePackages,
  updateCodes,
  deleteCodes,
  updateModerators,
  deleteModerators,
  addModerators,
  deletePayment,
  updateName,
  fetchStations,
  updateStations,
  deleteStations,
  addCode,
  getCodes,
  fetchDashboardStats,
  LoginManager,
  authManager,
  fetchSuperDashboardStats,
  fetchAllStations,
  registerPlatform,
};
