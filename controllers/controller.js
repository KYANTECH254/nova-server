const axios = require('axios');
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const moment = require("moment");
const {
  getPlatformByID,
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
  getFunds,
  createDDNS,
  updateDDNS,
  getDDNS,
  getDDNSById,
  deleteDDNS,
  getDDNSByUrl,
  getPPPoE,
  getTemplates,
  getYesterdayRevenue,
  getUniqueCode,
  deletePlatformConfig,
  deleteAdminsByPlatformId,
  deleteUsersByplatformID,
  deletePackagesByplatformID,
  deleteStationsByplatformID,
  deleteMpesaByplatformID,
  deletDDNSByplatformID,
  deletePPPoEByplatformID,
  deleteFunds,
  deleteTemplate,
  editTemplate,
  createTemplate
} = require("../actions/operations");
const { AuthenticateRequest } = require("../controllers/authController")
const {
  manageMikrotikUser,
  createMikrotikProfile,
  deleteMikrotikProfile,
  updateMikrotikProfile
} = require("../mikrotik/contollers/mikrotikController");
const { EmailTemplate } = require("../mailer/mailerTemplates")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { platform } = require('process');
const PAYSTACK_secretKey = process.env.PAYSTACK_SECRET_KEY;

function generateRandomString() {
  const length = 8;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const phoneCodes = await getCodesByPhone(phone, platformID);
    if (phoneCodes && phoneCodes.length > 0) {
      foundcodes = phoneCodes;
    }

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
  if (!name || !url || !email || !password || !platformID || !adminID) {
    return res.status(400).json({
      success: false,
      message: "All credentials are required!",
    });
  }

  try {
    const checkplatform = await getPlatformByURLData(url);
    if (checkplatform) {
      return res.status(409).json({
        success: false,
        message: "Platform name or URL already exists. Please choose another name.",
      });
    }

    const user = await getAdminByEmail(email);
    if (user) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists!",
      });
    }

    const siteUser = generateRandomString();
    const siteUserPassword = generateRandomString();

    if (!siteUser || !siteUserPassword) {
      return res.json({
        success: false,
        message: "Internal error, missing critical configuration files, try again later"
      });
    }

    const addProxy = await addReverseProxySite(url, `http://localhost:3001`, siteUser, siteUserPassword);
    if (!addProxy.success) {
      return res.json({
        success: false,
        message: "Reverse proxy creation failed.",
        error: addProxy.error
      });
    }

    const addSSL = await installLetsEncryptCert(url);
    if (!addSSL.success) {
      return res.json({
        success: false,
        message: addSSL.message
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
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

    const newSettings = await createPlatformConfig(platformID, {
      template: "Nova Special",
      adminID: adminID
    })

    // Create platform
    const newPlatform = await createPlatform({
      name,
      url: url,
      platformID,
      adminID
    });

    const subject = `Account created!`
    const message = `Your platform ${name} has been created. Login to your Admin dashboard at https://${url}/admin/login.`;
    const data = {
      name: name,
      type: "accounts",
      email: email,
      subject: subject,
      message: message
    }
    const sendwithdrawalemail = await EmailTemplate(data);
    if (!sendwithdrawalemail.success) {
      return res.status(200).json({
        success: false,
        message: sendwithdrawalemail.message,
        admins: admins
      });
    }

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
      errorMessage = error.response.data?.errors?.map(err => err.message).join(', ') || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: error
    });
  }
};

const deletePlatformID = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Missing platform ID.",
    });
  }

  try {
    const platform = await getPlatformByID(id);

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found.",
      });
    }

    await deleteSiteRecord(platform.url);

    const allddns = await getDDNS(platform.platformID);
    for (const ddns of allddns) {
      await removeDDNS(ddns.url);
    }

    await deletePlatformConfig(platform.platformID);
    await deleteAdminsByPlatformId(platform.platformID);
    await deleteUsersByplatformID(platform.platformID);
    await deleteMpesaByplatformID(platform.platformID);
    await deletePackagesByplatformID(platform.platformID);
    await deleteStationsByplatformID(platform.platformID);
    await deletDDNSByplatformID(platform.platformID);
    await deletePPPoEByplatformID(platform.platformID);
    await deleteFunds(platform.platformID);

    await deletePlatform(id);

    return res.status(200).json({
      success: true,
      message: "Platform deleted successfully.",
    });
  } catch (error) {
    console.error("An error occurred while deleting the platform:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the platform.",
    });
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
    const platform = await getPlatform(user.platformID);
    if (!platform) {
      return res.json({
        success: false,
        message: "Platfrom does not exist!",
      });
    }
    const domain = platform.url;
    return res.json({
      success: true,
      message: "Login successful!",
      token: token,
      user,
      domain
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
      success: false, message: "Missing credentials required!",
    });
  } try { const pkg = await getPackagesByID(id); if (!pkg) { return res.status(404).json({ success: false, message: "Package does not exist!", }); } const packagename = pkg.name; const delProfileResult = await deleteMikrotikProfile(platformID, packagename, host); if (!delProfileResult.success) { return res.status(500).json({ success: false, message: `Failed to delete MikroTik profile: ${delProfileResult.message}`, }); } const delResult = await deletePackage(id); if (!delResult) { return res.status(500).json({ success: false, message: "Failed to delete package from database.", }); } return res.json({ success: true, message: "Package deleted successfully." }); } catch (error) { console.error("An error occurred while deleting package:", error); return res.status(500).json({ success: false, message: "An internal server error occurred.", }); }
}; const fetchSettings = async (req, res) => {
  const { token } = req.body; if (!token) {
    return res.json({
      success: false, message: "Missing credentials required!",
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
    let platform_id = "";
    if (platform) {
      name = platform.name;
      url = platform.url;
      platform_id = platform.id;
    }

    const platformSettings = settings || {
      mpesaConsumerKey: "",
      mpesaConsumerSecret: "",
      mpesaShortCode: "",
      mpesaShortCodeType: "Phone",
      mpesaPassKey: "",
      adminID: "",
      IsC2B: true,
      IsAPI: false,
      IsB2B: false
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

const updateSettings = async (req, res) => {
  const { token, data } = req.body;
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
  const adminID = auth.admin.adminID;
  if (!platformID) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  const { mpesaConsumerKey, mpesaConsumerSecret, mpesaShortCode, mpesaShortCodeType, mpesaAccountNumber, mpesaPassKey, IsC2B, IsAPI, IsB2B } = data;
  try {
    const existingConfig = await getPlatformConfig(platformID);
    if (IsC2B === true) {
      if (!mpesaShortCode || !mpesaShortCodeType || !adminID) {
        return res.json({
          success: false,
          message: "All MPESA fields must be filled out!",
        });
      }
      const platform = await getPlatform(platformID);
      if (!platform) {
        return res.json({
          success: false,
          message: "Missing credentials required!",
        });
      }
      const paystackdata = {
        businessName: platform.name,
        accountNumber: mpesaShortCode,
        type: mpesaShortCodeType,
        secretKey: PAYSTACK_secretKey,
        idOrCode: existingConfig ? existingConfig.mpesaSubAccountID : ""
      }
      const existingpaystacksubaccount = await fetchSubaccount(paystackdata);
      let subaccountMismatch;
      if (existingpaystacksubaccount.success) {
        subaccountMismatch = existingpaystacksubaccount.data.account_number !== mpesaShortCode;
      }

      if (!existingpaystacksubaccount.success || subaccountMismatch) {
        const creeatepaystacksubaccount = await createMpesaSubaccount(paystackdata);
        if (!creeatepaystacksubaccount.success) {
          return res.json({
            success: false,
            message: creeatepaystacksubaccount.message,
          });
        }
        const mpesaSubAccountCode = creeatepaystacksubaccount.data.subaccount_code;
        const mpesaSubAccountID = creeatepaystacksubaccount.data.id;
        data.mpesaSubAccountCode = mpesaSubAccountCode;
        data.mpesaSubAccountID = `${mpesaSubAccountID}`;
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
    if (!existingConfig) {
      const add = await createPlatformConfig(platformID, data);
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
  if (!platformID || !name || !url) {
    return res.status(400).json({
      success: false,
      message: "Missing required credentials!",
    });
  }

  try {
    const exists = await getPlatformByURLData(url);
    if (exists && exists.platformID !== platformID) {
      return res.status(409).json({
        success: false,
        message: "This URL is already in use by another platform"
      });
    }

    const existingPlatform = await getPlatform(platformID);
    if (!existingPlatform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found!"
      });
    }

    const existingDnsName = existingPlatform.url.replace(/^https?:\/\//, '').split('/')[0];
    const newDnsName = url.replace(/^https?:\/\//, '').split('/')[0];
    if (newDnsName !== existingDnsName) {
      const siteUser = generateRandomString();
      const siteUserPassword = generateRandomString();

      if (!siteUser || !siteUserPassword) {
        return res.json({
          success: false,
          message: "Internal error, missing critical configuration files, try again later"
        });
      }

      const delsite = await deleteSiteRecord(existingDnsName);
      if (!delsite.success) {
        return res.json({
          success: false,
          message: delsite.message
        });
      }

      const addProxy = await addReverseProxySite(url, `http://localhost:3001`, siteUser, siteUserPassword);
      if (!addProxy.success) {
        return res.json({
          success: false,
          message: "Reverse proxy creation failed."
        });
      }

      const addSSL = await installLetsEncryptCert(url);
      if (!addSSL.success) {
        return res.json({
          success: false,
          message: addSSL.message
        });
      }
    }

    const data = { name, url: newDnsName };
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

const updateTemplate = async (req, res) => {
  const { token, name } = req.body;
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
    if (!platformID || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing required credentials!",
      });
    }

    const existingPlatform = await getPlatformConfig(platformID);
    if (!existingPlatform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found!"
      });
    }

    const data = { template: name };
    const upd = await updatePlatformConfig(platformID, data);

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
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

const addSubdomainToCloudflare = async (data) => {
  const { url, ip } = data;
  if (!url) {
    return {
      success: false,
      message: "No Subdomain provided for A Record!",
    };
  }

  const zoneId = process.env.ZONE_ID;
  const apiToken = process.env.API_TOKEN;

  if (!zoneId || !apiToken) {
    return {
      success: false,
      message: "Internal server error. Please try again later.",
    };
  }

  try {
    const dnsName = url.replace(/^https?:\/\//, '').split('/')[0];
    const cfResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        type: "A",
        name: dnsName,
        content: ip || "16.170.70.95",
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
    if (cfResponse && cfResponse.data && !cfResponse.data.success) {
      const errorMessages = cfResponse.data.errors ? cfResponse.data.errors.map(err => err.message).join(', ') : 'Unknown error';
      return {
        success: false,
        message: `DNS creation failed: ${errorMessages}`,
      };
    }

    return {
      success: true,
      message: "DNS record created successfully."
    };

  } catch (err) {
    return {
      success: false,
      message: "Internal server error. Please try again later.",
      error: err
    };
  }
};

const checkIfCloudflareDNSExists = async (url) => {
  if (!url) {
    return {
      success: false,
      message: "No subdomain provided.",
    };
  }

  const zoneId = process.env.ZONE_ID;
  const apiToken = process.env.API_TOKEN;

  if (!zoneId || !apiToken) {
    return {
      success: false,
      message: "Internal server error. Missing Cloudflare credentials.",
    };
  }

  try {
    const host = url.replace(/^https?:\/\//, "").split("/")[0];
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${host}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const records = response.data.result || [];
    if (records.length > 0) {
      return {
        success: true,
        exists: true,
        message: "DNS record exists in Cloudflare.",
        record: records[0],
      };
    }

    return {
      success: false,
      exists: false,
      message: "DNS record does not exist in Cloudflare.",
    };
  } catch (err) {
    console.error("Cloudflare DNS check error:", err.response?.data || err.message);
    return {
      success: false,
      message: "Failed to check DNS record in Cloudflare.",
      error: err,
    };
  }
};

const deleteCloudflareDNSRecord = async (url) => {
  if (!url) {
    return {
      success: false,
      message: "No subdomain provided.",
    };
  }

  const zoneId = process.env.ZONE_ID;
  const apiToken = process.env.API_TOKEN;

  if (!zoneId || !apiToken) {
    return {
      success: false,
      message: "Missing Cloudflare zone ID or API token.",
    };
  }

  try {
    const dnsName = url.replace(/^https?:\/\//, "").split("/")[0];

    // First, find the DNS record ID
    const lookupResponse = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${dnsName}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const record = lookupResponse.data.result[0];
    if (!record) {
      return {
        success: false,
        message: "DNS record not found in Cloudflare.",
      };
    }

    // Then, delete the DNS record
    const deleteResponse = await axios.delete(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (deleteResponse.data.success) {
      return {
        success: true,
        message: "DNS record deleted successfully.",
      };
    } else {
      return {
        success: false,
        message: "Failed to delete DNS record.",
        errors: deleteResponse.data.errors,
      };
    }

  } catch (err) {
    console.error("Cloudflare DNS delete error:", err.response?.data || err.message);
    return {
      success: false,
      message: "Error occurred while deleting DNS record.",
      error: err,
    };
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

  if (!data || !data.token) {
    return res.json({ success: false, message: "Missing credentials required!" });
  }

  const auth = await AuthenticateRequest(data.token);
  if (!auth.success) {
    return res.json({ success: false, message: auth.message });
  }

  const platformID = auth.admin.platformID;
  const adminID = auth.admin.adminID;

  const stationID = data.id;
  const {
    mikrotikPublicHost,
    mikrotikHost,
    mikrotikPublicKey,
    mikrotikDDNS,
    name
  } = data;

  if (!name || !mikrotikHost || !mikrotikPublicKey) {
    return res.json({ success: false, message: "Missing required station details." });
  }

  data.platformID = platformID;
  data.adminID = adminID;

  const platformData = await getPlatform(platformID);
  if (!platformData) {
    return res.json({ success: false, message: "Platform doesn't exist." });
  }

  const platformURL = platformData.url;
  const sanitizeSubdomain = (name) => {
    return name
      .toLowerCase()                     // lowercase only
      .trim()                            // remove leading/trailing spaces
      .replace(/\s+/g, '-')              // spaces → dashes
      .replace(/[^a-z0-9-]/g, '')        // remove special characters
      .replace(/-+/g, '-')               // collapse multiple dashes
      .replace(/^-+|-+$/g, '');          // remove leading/trailing dashes
  };
  const randomness = Math.random().toString(36).substring(2, 8);
  const mikrotikWebfigHost = `${sanitizeSubdomain(name)}${randomness}-webfig.novawifi.online`;

  data.mikrotikWebfigHost = mikrotikWebfigHost;

  let station;
  if (stationID !== "") {
    station = await getStation(stationID);
  }

  let responseMessage;
  let stationResult;

  try {
    if (!station) {
      const stations = await getStations(platformID);
      const existingDnsName = stations.find(s => s.mikrotikDDNS === mikrotikDDNS);
      if (existingDnsName) {
        return res.json({ success: false, message: "Choose a different router name. DDNS name already exists." });
      }

      const { id, token, ...newData } = data;
      const newStation = await createStation(newData);
      stationResult = newStation;
      responseMessage = "Station added";

    } else {
      const { id, token, ...updData } = data;
      const updatedStation = await updateStation(stationID, updData);
      stationResult = updatedStation;
      responseMessage = "Station updated";
    }

    const endpointHost = mikrotikDDNS || mikrotikPublicHost;
    if (!endpointHost) {
      return res.json({ success: false, message: "Public router host is required." });
    }

    const peerBlock = `
[Peer]
PublicKey = ${mikrotikPublicKey}
Endpoint = ${endpointHost}:13231
AllowedIPs = ${mikrotikHost}/32
PersistentKeepalive = 10
`;

    const wgConfPath = "/etc/wireguard/wg0.conf";

    fs.readFile(wgConfPath, "utf8", (readErr, fileData) => {
      if (readErr) {
        return res.json({ success: false, message: "WireGuard config read failed." });
      }

      fs.copyFileSync(wgConfPath, `${wgConfPath}.bak-${Date.now()}`);

      const blocks = fileData.split(/\n(?=\[Peer])/);
      const filtered = blocks.filter(b => !b.includes(`PublicKey = ${mikrotikPublicKey}`));
      const newConfig = [...filtered, peerBlock.trim()].join("\n\n").trim() + "\n";

      fs.writeFile(wgConfPath, newConfig, (writeErr) => {
        if (writeErr) {
          return res.json({ success: false, message: "WireGuard config write failed." });
        }

        exec("sudo wg-quick down wg0", () => {
          exec("sudo wg-quick up wg0", async (upErr) => {
            if (upErr) {
              return res.json({ success: false, message: "WireGuard restart failed." });
            }

            const siteUser = generateRandomString();
            const siteUserPassword = generateRandomString();
            if (!siteUser || !siteUserPassword) {
              return res.json({ success: false, message: "Internal error, missing critical configuration files, try again later" });
            }
            const addProxy = await addReverseProxySite(mikrotikWebfigHost, `http://${mikrotikHost}`, siteUser, siteUserPassword);
            if (!addProxy.success) {
              return res.json({ success: false, message: "Reverse proxy creation failed." });
            }

            const addSSL = await installLetsEncryptCert(mikrotikWebfigHost);
            if (!addSSL.success) {
              return res.json({ success: false, message: "SSL installation failed." });
            }

            return res.json({
              success: true,
              message: `${responseMessage} and WireGuard updated.`,
              station: stationResult,
            });
          });
        });
      });
    });

  } catch (error) {
    console.error("Station update error:", error);
    return res.json({ success: false, message: "Internal server error." });
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
    const station = await getStation(id);
    if (!station) {
      return res.json({ success: false, message: "Station not found" });
    }

    const zoneId = process.env.ZONE_ID;
    const apiToken = process.env.API_TOKEN;

    if (!zoneId || !apiToken) {
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error",
      });
    }

    const mikrotikWebfigHost = station.mikrotikWebfigHost;
    if (mikrotikWebfigHost) {
      const delsite = await deleteSiteRecord(mikrotikWebfigHost);
      if (!delsite.success) {
        return res.json({
          success: false,
          message: delsite.message
        });
      }
    }

    const mikrotikPublicKey = station.mikrotikPublicKey;
    fs.readFile("/etc/wireguard/wg0.conf", "utf8", (readErr, data) => {
      if (readErr) {
        console.error("Failed to read wg0.conf:", readErr);
        return res.json({ success: false, message: "Could not read WireGuard config" });
      }
      const peerBlocks = data.split(/\n(?=\[Peer])/);
      const filteredBlocks = peerBlocks.filter(
        (block) => !block.includes(`PublicKey = ${mikrotikPublicKey}`)
      );
      const updatedConfig = filteredBlocks.join("\n").trim() + "\n";
      fs.writeFile("/etc/wireguard/wg0.conf", updatedConfig, (writeErr) => {
        if (writeErr) {
          console.error("Failed to write updated wg0.conf:", writeErr);
          return res.json({ success: false, message: "Could not update WireGuard config" });
        }
        exec("sudo wg-quick down wg0 && sudo wg-quick up wg0", async (execErr, stdout, stderr) => {
          if (execErr) {
            console.error("Failed to restart WireGuard:", execErr);
            return res.json({ success: false, message: "WireGuard restart failed" });
          }

          const deletedStation = await deleteStation(id);

          return res.json({
            success: true,
            message: "Station deleted and WireGuard updated",
            data: deletedStation,
          });
        });
      });
    });

  } catch (error) {
    console.error("An error occurred", error);
    return res.json({ success: false, message: "An error occurred" });
  }
};

const addCode = async (req, res) => {
  const { data } = req.body;
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
    const role = auth.admin.role;
    if (platformsettings && role === "superuser") {
      IsB2B = platformsettings.IsB2B;
    }

    const codes = await getUsersByActiveCodes(platformID);
    const codestotalTally = codes.length;

    const packages = await getPackagesByPlatformID(platformID);
    const packagestotalTally = packages.length;

    const revenue = await getDailyRevenue(platformID);
    const revenueTotalTally = revenue.totalRevenue || 0;

    const yesterrevenue = await getYesterdayRevenue(platformID);
    const yesterrevenueTally = yesterrevenue.totalRevenue || 0;

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
      yesterdayRevenue: yesterrevenueTally,
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

const UpdateDDNSViaScript = async (req, res) => {
  const { subdomain, publicIP } = req.body;
  if (!subdomain || !publicIP) {
    return res.status(400).send('Subdomain and publicIP are required');
  }

  const zoneId = process.env.ZONE_ID;
  const apiToken = process.env.API_TOKEN;

  if (!zoneId || !apiToken) {
    return res.status(500).send("Internal server configuration error");
  }

  try {
    const recordResponse = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${subdomain}`, {
      headers: { Authorization: `Bearer ${cfToken}` },
    });
    const recordID = recordResponse.data.result[0]?.id;
    if (recordID) {
      await axios.put(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordID}`,
        {
          type: 'A',
          name: subdomain,
          content: publicIP,
          ttl: 120,
          proxied: false,
        },
        {
          headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        }
      );
      res.status(200).send(`Successfully updated ${subdomain} to IP ${publicIP}`);
    } else {
      res.status(404).send('DNS record not found for subdomain');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update DNS record');
  }
}

const updateDDNSR = async (req, res) => {
  const { token, ddnsData } = req.body;

  if (!token || !ddnsData) {
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
    const { id, url, publicIP } = ddnsData;

    if (!url || !publicIP) {
      return res.json({
        success: false,
        message: "DDNS URL and Public IP are required!",
      });
    }

    const data = { id, url, publicIP };
    const existingurl = await getDDNSByUrl(url);

    if (!id) {
      data.platformID = platformID;
      const { id: _, ...addData } = data;


      const existingdomain = await checkIfCloudflareDNSExists(url);
      if (existingdomain.success) {
        return res.json({
          success: false,
          message: "DDNS URL already exists in Cloudflare. Choose a different one!",
        });
      }

      const createddns = await createDDNS(addData);
      const adddomain = await addSubdomainToCloudflare({ ip: publicIP, url });

      if (!adddomain.success) {
        return res.json({
          success: false,
          message: `Failed to create DNS: ${adddomain.message}`,
        });
      }

      return res.json({
        success: true,
        message: "DDNS created and DNS record added successfully.",
        data: createddns,
      });

    } else {
      const existingDDNS = await getDDNSById(id);
      if (!existingDDNS) {
        return res.json({
          success: false,
          message: "DDNS record not found.",
        });
      }

      if (url !== existingDDNS.url) {
        await deleteCloudflareDNSRecord(existingDDNS.url);
        const createforcloudflare = await addSubdomainToCloudflare({ ip: publicIP, url });

        if (!createforcloudflare.success) {
          return res.json({
            success: false,
            message: `Failed to update DNS: ${createforcloudflare.message}`,
          });
        }
      }
      const { id: _, ...updData } = data;
      const updated = await updateDDNS(id, updData);
      return res.json({
        success: true,
        message: "DDNS updated successfully.",
        data: updated,
      });
    }
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
};

const fetchDDNS = async (req, res) => {
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

    const allddns = await getDDNS(platformID);
    const ddnsWithStatus = await Promise.all(
      allddns.map(async (ddns) => {
        const url = ddns.url.startsWith("http") ? ddns.url : `http://${ddns.url}`;
        const record = await checkIfCloudflareDNSExists(url);
        const isActive = record.success;
        return {
          ...ddns,
          isActive,
        };
      })
    );

    return res.json({
      success: true,
      data: ddnsWithStatus,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: "Failed to fetch DDNS records.",
      error: err.message,
    });
  }
};

const checkIfUrlResolves = async (url) => {
  if (!url) {
    return {
      success: false,
      message: "No URL provided to check.",
    };
  }

  try {
    const hostname = url.replace(/^https?:\/\//, '').split('/')[0];
    await dns.lookup(hostname);
    return {
      success: true,
      message: "URL resolves successfully.",
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to resolve URL "${url}". DNS lookup failed.`,
      error: err,
    };
  }
};

const deteteDDNSR = async (req, res) => {
  const { token, ddnsData } = req.body;

  if (!token || !ddnsData) {
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
    const { id, url, publicIP } = ddnsData;
    if (!id) {
      return res.json({
        success: false,
        message: "Missing required credentials!",
      });
    }

    const del = await deleteDDNS(id);
    const delfromcloudflare = await deleteCloudflareDNSRecord(url);
    if (delfromcloudflare.success) {
      return res.json({
        success: true,
        message: "DDNS deleted successfully",
      });
    } else {
      return res.json({
        success: false,
        message: delfromcloudflare.message,
      });
    }
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const removeDDNS = async (url) => {
  if (!url) {
    return {
      success: false,
      message: "Missing credentials required!",
    };
  }

  try {
    const delfromcloudflare = await deleteCloudflareDNSRecord(url);
    if (delfromcloudflare.success) {
      return {
        success: true,
        message: "DDNS deleted successfully",
      };
    } else {
      return {
        success: false,
        message: delfromcloudflare.message,
      };
    }
  } catch (err) {
    console.error("An error occured", err)
    return {
      success: false,
      message: "An internal error occured, try again.",
      error: err
    };
  }
}

const installLetsEncryptCert = async (domain) => {
  const cmd = `clpctl lets-encrypt:install:certificate --domainName=${domain}`;

  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`[LetsEncrypt] ERROR (raw):`, err);
        return resolve({
          success: false,
          message: `LetsEncrypt certificate installation failed for ${domain}`,
          error: stderr || err.message,
          stdout,
        });
      }

      console.log(`[LetsEncrypt] SUCCESS: ${stdout}`);
      resolve({
        success: true,
        message: `LetsEncrypt certificate installed for ${domain}`,
        output: stdout
      });
    });
  });
};

const deleteSiteRecord = async (domain) => {
  const cmd = `clpctl site:delete --domainName=${domain} --force`;

  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`[Delete] ERROR (raw):`, err);
        return resolve({
          success: false,
          message: `Delete site failed for ${domain}`,
          error: stderr || err.message,
          stdout,
        });
      }

      console.log(`[Delete] SUCCESS: ${stdout}`);
      resolve({
        success: true,
        message: `Deleted site ${domain}`,
        output: stdout
      });
    });
  });
};

const addReverseProxySite = async (domain, targetUrl, siteUser, siteUserPassword) => {
  const cmd = [
    'clpctl site:add:reverse-proxy',
    `--domainName=${domain}`,
    `--reverseProxyUrl='${targetUrl}'`,
    `--siteUser=${siteUser}`,
    `--siteUserPassword='${siteUserPassword}'`
  ].join(' ');

  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`[ReverseProxy] Error for domain "${domain}":`, stderr || err.message);
        return resolve({
          success: false,
          message: `Failed to add reverse proxy site for ${domain}`,
          error: stderr || err.message
        });
      }

      console.log(`[ReverseProxy] Success for domain "${domain}":`, stdout);
      resolve({
        success: true,
        message: `Reverse proxy site added for ${domain}`,
        output: stdout
      });
    });
  });
};

const createMpesaSubaccount = async (data) => {
  const { businessName, accountNumber, type, secretKey } = data;
  if (!businessName || !accountNumber || !type || !secretKey) {
    return {
      success: false,
      message: "Missing business name, account number, type, or secret key.",
    };
  }

  let paymentType = "";
  if (type === "Till") {
    paymentType = 799;
  } else if (type === "Paybill") {
    paymentType = 798;
  } else if (type === "Phone") {
    paymentType = 231;
  } else {
    return {
      success: false,
      message: "Invalid type. Must be 'Till', 'Paybill', or 'Phone'."
    };
  }

  try {
    // Step 1: Create subaccount
    const response = await axios.post(
      'https://api.paystack.co/subaccount',
      {
        business_name: businessName,
        settlement_bank: paymentType,
        account_number: accountNumber,
        percentage_charge: 0,
        currency: "KES"
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const subaccountData = response.data.data;
    const subaccountId = subaccountData?.id;

    if (!subaccountId) {
      return {
        success: false,
        message: "Failed to retrieve subaccount ID after creation.",
        data: subaccountData
      };
    }

    let verified = false;
    let verificationData = null;

    try {
      const jwt = process.env.PAYSTACK_TOKEN;

      const verifyRes = await axios.post(
        'https://api.paystack.co/subaccount/verify',
        { ids: [subaccountId] },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            'jwt-auth': 'true',
          }
        }
      );

      verified = verifyRes.data?.data?.verified_ids?.includes(subaccountId);
      verificationData = verifyRes.data;
      console.log("Verification result:", verifyRes.data);
    } catch (verifyError) {
      console.warn("Verification failed, continuing:", verifyError?.response?.data || verifyError.message);
    }

    return {
      success: true,
      message: verified
        ? "Subaccount created and verified successfully."
        : "Subaccount created but verification was skipped or failed.",
      data: subaccountData,
      verification: verificationData,
    };
  } catch (error) {
    console.error("An error occurred:", error?.response?.data || error.message);
    return {
      success: false,
      message: "An error occurred during subaccount creation.",
      error: error?.response?.data || error.message
    };
  }
};

const fetchSubaccount = async (data) => {
  const { secretKey, idOrCode } = data;

  if (!idOrCode || !secretKey) {
    return {
      success: false,
      message: "Missing subaccount ID/code or secret key."
    };
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/subaccount/${idOrCode}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      }
    );

    return {
      success: true,
      message: "Subaccount retrieved successfully.",
      data: response.data.data
    };
  } catch (error) {
    console.error("Error fetching subaccount:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch subaccount.",
      error: error
    };
  }
}

const updateSubaccount = async (data) => {
  const { businessName, accountNumber, type, secretKey, idOrCode } = data;

  if (!idOrCode || !businessName || !accountNumber || !type || !secretKey) {
    return {
      success: false,
      message: "Missing business name, account number, type, or secret key.",
    };
  }

  let paymentType = "";
  if (type === "Till") {
    paymentType = 799;
  } else if (type === "Paybill") {
    paymentType = 798;
  } else if (type === "Phone") {
    paymentType = 231;
  } else {
    return {
      success: false,
      message: "Invalid type. Must be 'Till', 'Paybill', or 'Phone'."
    };
  }

  const updateData = {
    business_name: businessName,
    description: businessName,
    bank_code: paymentType,
    account_number: accountNumber,
    percentage_charge: 0,
    currency: "KES"
  };

  console.log("Updating paystack...", updateData, idOrCode);

  try {
    const response = await axios.put(
      `https://api.paystack.co/subaccount/${idOrCode}`,
      updateData, // ✅ Send object directly
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      message: "Subaccount updated successfully.",
      data: response.data.data
    };
  } catch (error) {
    console.error("Error updating subaccount:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update subaccount.",
      error: error
    };
  }
};

const removeUser = async = async (req, res) => {
  const { id, username, token } = req.body;

  if (!id || !username || !token) {
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
    const stations = await getStations(platformID);
    if (!stations) {
      return res.json({
        success: false,
        message: "No routers found!",
      });
    }
    const deleteuser = await deleteUser(id);
    for (const station of stations) {
      const userdata = {
        platformID: platformID,
        action: "remove",
        profileName: "none",
        host: station.mikrotikHost,
        username: username
      }
      const removeuserfrommikrotik = await manageMikrotikUser(userdata)
      if (!removeuserfrommikrotik.success) {
        return res.json({
          success: false,
          message: removeuserfrommikrotik.message,
        });
      }
    }
    return res.json({
      success: true,
      message: "User deleted from Database and Mikrotik.",
    })
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const updatePPPoE = async (req, res) => {
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
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const fetchMyPPPoe = async (req, res) => {
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
    const pppoes = await getPPPoE(platformID);

    return res.json({
      success: true,
      message: "PPPoE fetched succesfully!",
      pppoe: pppoes
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const fetchTemplates = async (req, res) => {
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
    const config = await getPlatformConfig(platformID);
    if (!config) {
      return res.json({
        success: false,
        message: "Platform config not found!",
      });
    }
    const templates = await getTemplates();
    const defaulttemplate = config.template;

    return res.json({
      success: true,
      message: "Templates fetched succesfully!",
      templates: templates,
      default: defaulttemplate
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const fetchAllTemplates = async (req, res) => {
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
    const templates = await getTemplates();

    return res.json({
      success: true,
      message: "Templates fetched succesfully!",
      templates: templates,
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const addTemplates = async (req, res) => {
  const { token, name, url } = req.body;

  if (!token || !url || !name) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success || !auth.superuser) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const template = await createTemplate({ name, url });

    return res.json({
      success: true,
      message: "Template added succesfully!",
      template: template,
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const updateTemplates = async (req, res) => {
  const { token, id, name, url } = req.body;

  if (!token || !id || !url || !name) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success || !auth.superuser) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const template = await editTemplate(id, { name, url });

    return res.json({
      success: true,
      message: "Template updated succesfully!",
      template: template,
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const removeTemplates = async (req, res) => {
  const { token, id } = req.body;

  if (!token || !id) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success || !auth.superuser) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const template = await deleteTemplate(id);
    return res.json({
      success: true,
      message: "Template deleted succesfully!",
    });
  } catch (err) {
    console.error("An error occured", err)
    return res.json({
      success: false,
      message: "An internal error occured, try again.",
      error: err
    });
  }
}

const verifyCodes = async (req, res) => {
  const { code, platformID } = req.body;
  if (!code || !platformID) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const existingcode = await getUniqueCode(code, platformID);
    if (!existingcode) {
      return res.json({
        success: false,
        message: "Code does not exist!"
      })
    }

    if (existingcode.status === "expired") {
      return res.json({
        success: false,
        message: "Code expired, can't login!"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Code verified!",
      code: code,
    });
  } catch (error) {
    console.error("Error getting codes:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const ResetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const admin = await getAdminByEmail(email);
    if (!admin) {
      return res.json({
        success: false,
        message: "User does not exist!"
      })
    }
    const platform = await getPlatform(admin.platformID);
    if (!platform) {
      return res.json({
        success: false,
        message: "Platform does not exist!"
      })
    }
    const token = generateToken(admin.adminID, admin.platformID);
    const upd = await updateAdmin(admin.id, { token });

    const subject = `Password reset request!`
    const message = `Someone requested a password reset on your account.\n If this was you update your password at https://${platform.url}/admin/login?form=update-password&code=${token}`;
    const data = {
      name: admin.name,
      type: "accounts",
      email: email,
      subject: subject,
      message: message
    }
    const sendresetemail = await EmailTemplate(data);
    if (!sendresetemail.success) {
      return res.status(200).json({
        success: false,
        message: sendresetemail.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Password reset request send to ${email}, check your inbox!`,
    });
  } catch (error) {
    console.error("Error occured:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const UpdatePassword = async (req, res) => {
  const { password, code } = req.body;
  if (!password || !code) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const admin = await getAdminByToken(code)
    if (!admin) {
      return res.json({
        success: false,
        message: "User does not exist!"
      })
    }
    const platform = await getPlatform(admin.platformID);
    if (!platform) {
      return res.json({
        success: false,
        message: "Platform does not exist!"
      })
    }
    const token = generateToken(admin.adminID, admin.platformID);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const upd = await updateAdmin(admin.id, { token, password: hashedPassword });

    const subject = `Password updated!`
    const message = `Someone updated your account password.\n If this was not you update your password now.`;
    const data = {
      name: admin.name,
      type: "accounts",
      email: admin.email,
      subject: subject,
      message: message
    }
    const sendresetemail = await EmailTemplate(data);
    if (!sendresetemail.success) {
      return res.status(200).json({
        success: false,
        message: sendresetemail.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Password updated succesfully, login now!`,
    });
  } catch (error) {
    console.error("Error occured:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const updateMyPassword = async (req, res) => {
  const { token, currentPassword, newPassword } = req.body;

  if (!token || !currentPassword || !newPassword) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }

  if (newPassword.length < 6) {
    return res.json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const auth = await AuthenticateRequest(token);
    if (!auth.success || !auth.admin) {
      return res.json({
        success: false,
        message: auth.message,
      });
    }

    const admin = auth.admin;
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect.",
      });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const upd = await updateAdmin(admin.id, { password: hashedPassword });

    const subject = "Password updated!";
    const message =
      "Someone updated your account password.\nIf this was not you, update your password now.";

    const data = {
      name: admin.name,
      type: "accounts",
      email: admin.email,
      subject,
      message,
    };

    const sendresetemail = await EmailTemplate(data);
    if (!sendresetemail.success) {
      return res.status(200).json({
        success: false,
        message: sendresetemail.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const UpdateProfile = async (req, res) => {
  const { token, name, phone } = req.body;
  if (!token || !name || !phone) {
    return res.json({
      success: false,
      message: "Missing credentials required!",
    });
  }
  try {
    const admin = await getAdminByToken(token)
    if (!admin) {
      return res.json({
        success: false,
        message: "User does not exist!"
      })
    }

    const upd = await updateAdmin(admin.id, { token, name, phone });

    return res.status(200).json({
      success: true,
      message: `Profile updated succesfully`,
    });
  } catch (error) {
    console.error("Error occured:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

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
  UpdateDDNSViaScript,
  checkIfUrlResolves,
  updateDDNSR,
  fetchDDNS,
  deteteDDNSR,
  removeUser,
  updatePPPoE,
  fetchMyPPPoe,
  fetchTemplates,
  updateTemplate,
  verifyCodes,
  ResetPassword,
  UpdatePassword,
  UpdateProfile,
  fetchAllTemplates,
  addTemplates,
  updateTemplates,
  removeTemplates,
  updateMyPassword
};
