const { log } = require("console");
const prisma = require("../prisma");
const { create } = require("domain");
const now = new Date();
const offsetDate = new Date(
  now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" })
);

async function validateOperation(adminID, platformID) {
  if (platformID || !adminID) return null;
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID },
    });

    if (!platform || platform.adminID !== adminID) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating operation:", error);
    throw error;
  }
}

async function getPlatformConfig(platformID) {
  if (!platformID) return null;
  try {
    const config = await prisma.platformSetting.findUnique({
      where: { platformID },
    });

    return config;
  } catch (error) {
    console.error("Error fetching platform configuration:", error);
    throw error;
  }
}

async function getMikrotikPlatformConfig(platformID) {
  if (!platformID) return null;
  try {
    const config = await prisma.station.findMany({
      where: { platformID },
    });

    return config;
  } catch (error) {
    console.error("Error fetching platform configuration:", error);
    throw error;
  }
}

async function getPlatformByIP(ip) {
  if (!ip) return null;
  try {
    const platform = await prisma.platformSetting.findFirst({
      where: { platformIP: ip },
    });

    if (!platform) {
      return null;
    }

    return platform;
  } catch (error) {
    console.error("Error fetching platform by IP:", error);
    throw error;
  }
}

async function updatePlatformConfig(platformID, data) {
  if (!platformID || !data) return null;
  try {
    const config = await prisma.platformSetting.update({
      where: { platformID },
      data: {
        ...data,

      },
    });

    return config;
  } catch (error) {
    console.error("Error updating platform configuration:", error);
    throw error;
  }
}

async function deletePlatformConfig(platformID) {
  if (!platformID) return null;
  try {
    await prisma.platformSetting.delete({
      where: { platformID },
    });
  } catch (error) {
    console.error("Error deleting platform configuration:", error);
    throw error;
  }
}

async function createPlatformConfig(platformID, data) {
  if (!platformID || !data) return null;
  try {
    const config = await prisma.platformSetting.create({
      data: {
        platformID,
        ...data,
      },
    });

    return config;
  } catch (error) {
    console.error("Error creating platform configuration:", error);
    throw error;
  }
}

async function getSuperUser() {
  try {
    const superUser = await prisma.superUser.findFirst();
    return superUser;
  } catch (error) {
    console.error("Error fetching super user:", error);
    throw error;
  }
}

async function getSuperUserByToken(token) {
  try {
    const superUser = await prisma.superUser.findUnique({
      where: { token },
    });
    return superUser;
  } catch (error) {
    console.error("Error fetching super user:", error);
    throw error;
  }
}

async function createSuperUser(data) {
  if (!data) return null;
  try {
    const superUser = await prisma.superUser.create({
      data: {
        ...data,


      },
    });
    return superUser;
  } catch (error) {
    console.error("Error creating super user:", error);
    throw error;
  }
}

async function createTemplate(data) {
  if (!data) return null;
  try {
    const template = await prisma.template.create({
      data: {
        ...data,
      },
    });
    return template;
  } catch (error) {
    console.error("Error creating template:", error);
    throw error;
  }
}

async function deleteTemplate(id) {
  if (!id) return null;
  try {
    const template = await prisma.template.delete({
      where: {
        id
      }
    });
    return template;
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
}

async function editTemplate(id, data) {
  if (!id || !data) return null;
  try {
    const template = await prisma.template.update({
      where: {
        id
      },
      data: {
        ...data
      }
    });
    return template;
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
}

async function updateSuperUser(data) {
  if (!data) return null;
  try {
    const superUser = await prisma.superUser.update({
      where: { id: data.id },
      data: {
        ...data,

      },
    });
    return superUser;
  } catch (error) {
    console.error("Error updating super user:", error);
    throw error;
  }
}

async function deleteSuperUser(id) {
  if (!id) return null;
  try {
    const superUser = await prisma.superUser.delete({
      where: { id },
    });
    return superUser;
  } catch (error) {
    console.error("Error deleting super user:", error);
    throw error;
  }
}

async function createUser(data) {
  if (!data) return null;
  try {
    const { packageID, ...restData } = data;

    const user = await prisma.user.create({
      data: {
        ...restData,
        package: packageID
          ? { connect: { id: packageID } }
          : { create: data.package },


      },
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function updateUser(id, data) {
  if (!id || !data) return null;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,

      },
    });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function deleteUser(id) {
  if (!id) return null;
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

async function getUserByPhone(phone) {
  if (!phone) return null;
  try {
    const users = await prisma.user.findMany({
      where: { phone },
    });
    return users;
  } catch (error) {
    console.error("Error fetching user by phone:", error);
    throw error;
  }
}

async function getUserByToken(token) {
  if (!token) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { token },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by token:", error);
    throw error;
  }
}

async function getUserByCode(code) {
  if (!code) return null;
  try {
    const user = await prisma.user.findFirst({
      where: { code },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by token:", error);
    throw error;
  }
}

async function addMpesaCode(data) {
  if (!data) return null;
  try {
    const mpesaCode = await prisma.mpesa.create({
      data: {
        ...data,


      },
    });
    return mpesaCode;
  } catch (error) {
    console.error("Error adding mpesa code:", error);
    throw error;
  }
}

async function updateMpesaCode(code, data) {
  if (!code || !data) return null;
  try {
    const mpesaCode = await prisma.mpesa.update({
      where: { code },
      data: {
        ...data,

      },
    });
    return mpesaCode;
  } catch (error) {
    console.error("Error updating mpesa code:", error);
    throw error;
  }
}

async function deleteMpesaCode(code) {
  if (!code) return null;
  try {
    const mpesaCode = await prisma.mpesa.delete({
      where: { code },
    });
    return mpesaCode;
  } catch (error) {
    console.error("Error deleting mpesa code:", error);
    throw error;
  }
}

async function getMpesaCode(code) {
  if (!code) return null;
  try {
    const mpesaCode = await prisma.mpesa.findUnique({
      where: { code },
    });
    return mpesaCode;
  } catch (error) {
    console.error("Error deleting mpesa code:", error);
    throw error;
  }
}

async function getMpesaByCode(code) {
  if (!code) return null;
  try {
    const mpesaCode = await prisma.mpesa.findFirst({
      where: { reqcode: code },
    });
    return mpesaCode;
  } catch (error) {
    console.error("Error deleting mpesa code:", error);
    throw error;
  }
}

async function createAdmin(data) {
  if (!data) return null;
  try {
    const admin = await prisma.admin.create({
      data: {
        ...data,


      },
    });
    return admin;
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
}

async function updateAdmin(id, data) {
  if (!id || !data) return null;
  try {
    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...data,


      },
    });
    return admin;
  } catch (error) {
    console.error("Error updating admin:", error);
    throw error;
  }
}

async function deleteAdmin(id) {
  if (!id) return null;
  try {
    const admin = await prisma.admin.delete({
      where: { id },
    });
    return admin;
  } catch (error) {
    console.error("Error deleting admin:", error);
    throw error;
  }
}

async function deleteAdminsByPlatformId(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.admin.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting admins:", error);
    throw error;
  }
}

async function deleteUsersByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.user.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting users:", error);
    throw error;
  }
}

async function deletePackagesByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.package.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting packages:", error);
    throw error;
  }
}


async function deleteStationsByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.package.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting stations:", error);
    throw error;
  }
}

async function deleteMpesaByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.mpesa.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting mpesa:", error);
    throw error;
  }
}

async function deletDDNSByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.ddns.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting ddns:", error);
    throw error;
  }
}

async function deletePPPoEByplatformID(platformID) {
  if (!platformID) return null;
  try {
    const result = await prisma.pppoe.deleteMany({
      where: { platformID },
    });
    return result;
  } catch (error) {
    console.error("Error deleting mpesa:", error);
    throw error;
  }
}

async function createPackage(data) {
  if (!data) return null;
  try {
    const package = await prisma.package.create({
      data: {
        ...data,
      },
    });
    return package;
  } catch (error) {
    console.error("Error creating package:", error);
    throw error;
  }
}


async function updatePackage(id, platformID, data) {
  if (!id || !data) return null;
  try {
    const package = await prisma.package.update({
      where: { id: id },
      data: {
        ...data,
      },
    });
    return package;
  } catch (error) {
    console.error("Error updating package:", error);
    throw error;
  }
}

async function getPackage(id) {
  if (!id) return null;
  try {
    const package = await prisma.package.findUnique({
      where: { packageID: id },
    });
    return package;
  } catch (error) {
    console.error("Error getting package:", error);
    throw error;
  }
}

async function getPackages(platformID) {
  if (!platformID) return null;
  try {
    const packages = await prisma.package.findMany({
      where: { platformID },
    });
    return packages;
  } catch (error) {
    console.error("Error getting packages:", error);
    throw error;
  }
}

async function getPackagesByAmount(platformID, price) {
  if (!platformID || !price) return null;
  const fullPrice = Math.trunc(Number(price));
  try {
    const pkg = await prisma.package.findFirst({
      where: { platformID, price: `${fullPrice}` },
    });
    return pkg;
  } catch (error) {
    console.error("Error getting packages:", error);
    throw error;
  }
}

async function deletePackage(id) {
  if (!id) return null;
  try {
    const package = await prisma.package.delete({
      where: { id },
    });
    return package;
  } catch (error) {
    console.error("Error deleting package:", error);
    throw error;
  }
}

function generateSlug(name) {
  if (!name) return null;
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function createPlatform(data) {
  if (!data) return null;
  try {
    const slug = generateSlug(data.name);
    const platform = await prisma.platform.create({
      data: {
        ...data,
        url: slug,


      },
    });

    return platform;
  } catch (error) {
    console.error("Error creating platform:", error);
    throw error;
  }
}

async function updatePlatform(id, data) {
  if (!data || !id) return null;
  try {
    const platform = await prisma.platform.update({
      where: { platformID: id },
      data: {
        ...data,

      },
    });
    return platform;
  } catch (error) {
    console.error("Error updating platform:", error);
    throw error;
  }
}

async function deletePlatform(id) {
  if (!id) return null;
  try {
    const platform = await prisma.platform.delete({
      where: { id },
    });
    return platform;
  } catch (error) {
    console.error("Error deleting platform:", error);
    throw error;
  }
}

async function getPlatform(platformID) {
  if (!platformID) return null;
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID },
    });
    if (!platform) return null;
    const admin = await getAdmin(platform.adminID);
    if (!admin) {
      return null;
    }
    const superuser = await getSuperUser();
    if (superuser) {
      platform.admin_phone = superuser.phone;
    }
    const config = await getPlatformConfig(platformID);
    if (config) {
      platform.template = config.template;
    }

    platform.phone = admin.phone;
    return platform;
  } catch (error) {
    console.error("Error getting platform:", error);
    throw error;
  }
}

async function getPlatformByID(id) {
  if (!id) return null;
  try {
    const platform = await prisma.platform.findUnique({
      where: { id },
    });
    return platform;
  } catch (error) {
    console.error("Error getting platform:", error);
    throw error;
  }
}

async function getAdmin(adminID) {
  if (!adminID) return null;
  try {
    const admin = await prisma.admin.findFirst({
      where: { adminID },
    });
    return admin;
  } catch (error) {
    console.error("Error getting admin:", error);
    throw error;
  }
}

async function getPlatformByUrl(url) {
  if (!url) return null;
  try {
    const platform = await prisma.platform.findUnique({
      where: { url },
    });
    if (!platform) {
      return null;
    }

    const admin = await getAdmin(platform.adminID);
    if (!admin) {
      return null;
    }

    const superuser = await getSuperUser();
    if (superuser) {
      platform.admin_phone = superuser.phone;
    }

    platform.phone = admin.phone;
    return platform;
  } catch (error) {
    console.error("Error getting platform:", error);
    throw error;
  }
}

async function getCodesByPhone(phone, platformID) {
  if (!phone) return null;
  try {
    // First try to find active codes
    const activeCodes = await prisma.user.findMany({
      where: {
        phone: phone,
        status: "active",
        platformID: platformID
      }
    });

    if (activeCodes.length > 0) {
      return activeCodes;
    }

    const inactiveCodes = await prisma.user.findMany({
      where: {
        phone: phone,
        status: "inactive",
        platformID: platformID
      },
      take: 1
    });

    return inactiveCodes;
  } catch (error) {
    console.error("Error getting codes by phone:", error);
    throw error;
  }
}

async function getCodesByMpesa(code, platformID) {
  if (!code) return null;

  try {
    const activeCodes = await prisma.user.findMany({
      where: {
        code: code,
        status: "active",
        platformID: platformID
      }
    });

    if (activeCodes.length > 0) {
      return activeCodes;
    }

    const inactiveCodes = await prisma.user.findMany({
      where: {
        username: code,
        status: "inactive",
        platformID: platformID
      },
      take: 1
    });

    return inactiveCodes;
  } catch (error) {
    console.error("Error getting codes by MPESA:", error);
    throw error;
  }
}

async function getUsersByCodes(platformID) {
  if (!platformID) return null;
  try {
    const codes = await prisma.user.findMany({
      where: {
        platformID,
      },
    });
    return codes;
  } catch (error) {
    console.error("Error getting codes:", error);
    throw error;
  }
}

async function getUsersByActiveCodes(platformID) {
  if (!platformID) return null;
  try {
    const codes = await prisma.user.findMany({
      where: {
        platformID,
        status: "active",
      },
    });
    return codes;
  } catch (error) {
    console.error("Error getting codes:", error);
    throw error;
  }
}

async function getMpesaPayments(platformID) {
  if (!platformID) return null;
  try {
    const payments = await prisma.mpesa.findMany({
      where: {
        platformID,
      },
    });
    return payments;
  } catch (error) {
    console.error("Error getting payments:", error);
    throw error;
  }
}

async function deleteMpesaPayment(id) {
  if (!id) return null;
  try {
    const del = await prisma.mpesa.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
}

async function getPlatforms() {
  try {
    const platforms = await prisma.platform.findMany({
      select: { platformID: true },
    });
    return platforms;
  } catch (error) {
    console.error("Error getting platform:", error);
    throw error;
  }
}

async function getAllPlatforms() {
  try {
    const platforms = await prisma.platform.findMany();
    return platforms;
  } catch (error) {
    console.error("Error getting platform:", error);
    throw error;
  }
}

async function getActivePlatformUsers(platformID) {
  if (!platformID) return null;
  try {
    const users = await prisma.user.findMany({
      where: { status: "active", platformID: platformID },
      select: { id: true, username: true, expireAt: true, createdAt: true, status: true },
    });

    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

async function createPlatform(data) {
  if (!data) return null;
  try {
    const create = await prisma.platform.create({
      data,
    });
    return true;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getPlatformByURLData(url) {
  if (!url) return null;
  try {
    const platform = await prisma.platform.findUnique({
      where: {
        url,
      },
    });

    return platform;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getAdminByEmail(email) {
  if (!email) return null;
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        email,
      },
    });
    return admin;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getAdminsByID(adminID) {
  if (!adminID) return null;
  try {
    const admin = await prisma.admin.findMany({
      where: {
        adminID: adminID,
      },
    });
    return admin;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getSuperAdminsByPlatform(platformID) {
  if (!platformID) return null;
  try {
    const superadmin = await prisma.admin.findMany({
      where: {
        platformID: platformID,
        role: "superuser"
      },
    });
    return superadmin;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getAdmins() {
  try {
    const admins = await prisma.admin.findMany();
    return admins;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getAdminByToken(token) {
  if (!token) return null;
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        token: token.trim(),
      },
    });
    return admin;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getUserByPlatform(platformID) {
  if (!platformID) return null;
  try {
    const users = await prisma.user.findMany({
      where: {
        platformID,
      },
    });
    return users;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getPackagesByPlatformID(platformID) {
  if (!platformID) return null;
  try {
    const packages = await prisma.package.findMany({
      where: {
        platformID,
      },
    });
    return packages;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getPackagesByID(ID) {
  if (!ID) return null;
  try {
    const package = await prisma.package.findUnique({
      where: {
        id: ID,
      },
    });
    return package;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getPlatformIDfromPackage(adminID) {
  if (!adminID) return null;
  try {
    const adminID = await prisma.package.findUnique({
      where: {
        adminID: adminID,
      },
    });
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getStations(platformID) {
  if (!platformID) return null;
  try {
    const stations = await prisma.station.findMany({
      where: {
        platformID,
      },
    });
    return stations;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getAllStations() {
  try {
    const stations = await prisma.station.findMany({
      select: {
        name: true,
        mikrotikHost: true,
      },
    });
    return stations;
  } catch (error) {
    console.log("An error occurred", error);
    return false;
  }
}

async function getStation(stationID) {
  try {
    const station = await prisma.station.findUnique({
      where: {
        id: stationID,
      },
    });
    return station;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function createStation(data) {
  if (!data) return null;
  try {
    const station = await prisma.station.create({
      data: {
        ...data,
      },
    });
    return station;
  } catch (error) {
    console.log("An error occured", error);
    return [];
  }
}

async function updateStation(id, data) {
  if (!id || !data) return null;
  try {
    const station = await prisma.station.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return station;
  } catch (error) {
    console.log("An error occured", error);
    return [];
  }
}

async function deleteStation(id) {
  if (!id) return null;
  try {
    const station = await prisma.station.delete({
      where: { id },
    });
    return station;
  } catch (error) {
    console.log("An error occured", error);
    return false;
  }
}

async function getDailyRevenue(platformID) {
  if (!platformID) return null;

  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const payments = await prisma.mpesa.findMany({
      where: {
        platformID,
        status: "COMPLETE",
        createdAt: {
          gte: midnight,
        },
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return { payments, totalRevenue };
  } catch (error) {
    console.error("Error getting daily revenue:", error);
    throw error;
  }
}


async function getYesterdayRevenue(platformID) {
  if (!platformID) return null;

  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const yestermidnight = new Date(midnight) - (60 * 60 * 60 * 24);
    const formatedyestermidnight = new Date(yestermidnight)
    formatedyestermidnight.setHours(0, 0, 0, 0);

    const payments = await prisma.mpesa.findMany({
      where: {
        platformID,
        status: "COMPLETE",
        createdAt: {
          gte: formatedyestermidnight,
          lte: midnight
        },
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return { payments, totalRevenue };
  } catch (error) {
    console.error("Error getting daily revenue:", error);
    throw error;
  }
}


async function createFunds(data) {
  if (!data) return null;
  try {
    const addfunds = await prisma.funds.create({
      data: {
        ...data,
      },
    })
    return addfunds;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getFunds(platformID) {
  if (!platformID) return null;
  try {
    const funds = await prisma.funds.findUnique({
      where: {
        platformID
      }
    })
    return funds;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function deleteFunds(platformID) {
  if (!platformID) return null;
  try {
    const delfunds = await prisma.funds.delete({
      where: {
        platformID
      }
    })
    return true;
  } catch (error) {
    console.error("An error occured:", error);
    return false;
  }
}

async function updateFunds(platformID, data) {
  if (!platformID) return null;
  try {
    const updfunds = await prisma.funds.update({
      where: {
        platformID
      },
      data: {
        ...data,
      },
    })
    return updfunds;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function createDDNS(data) {
  if (!data) return null;
  try {
    const created = await prisma.ddns.create({
      data
    })
    return created;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function updateDDNS(id, data) {
  if (!data || !id) return null;
  try {
    const upd = await prisma.ddns.update({
      where: {
        id
      },
      data
    })
    return upd;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getDDNS(platformID) {
  if (!platformID) return null;
  try {
    const ddns = await prisma.ddns.findMany({
      where: {
        platformID
      }
    })
    return ddns;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getDDNSById(id) {
  if (!id) return null;
  try {
    const ddns = await prisma.ddns.findUnique({
      where: {
        id
      }
    })
    return ddns;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getDDNSByUrl(url) {
  if (!url) return null;
  try {
    const ddns = await prisma.ddns.findUnique({
      where: {
        url
      }
    })
    return ddns;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function deleteDDNS(id) {
  if (!id) return null;
  try {
    const del = await prisma.ddns.delete({
      where: {
        id
      }
    })
    return del;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getPendingTransactions({ maxAgeMs }) {
  const cutoff = new Date(Date.now() - maxAgeMs);

  const transactions = await prisma.mpesa.findMany({
    where: {
      status: {
        not: 'COMPLETE'
      },
      createdAt: {
        gte: cutoff
      }
    }
  });

  return transactions.filter(tx => {
    const code = tx.code;
    const isUpperCase = code && code === code.toUpperCase();
    const isFailed = tx.status === 'FAILED';
    return !(isUpperCase && isFailed);
  });
}

async function createPPPoE(data) {
  if (!data) return null;
  try {
    const created = await prisma.ddns.create({
      data
    })
    return created;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function updatePPPoE(id, data) {
  if (!data || !id) return null;
  try {
    const upd = await prisma.pppoe.update({
      where: {
        id
      },
      data
    })
    return upd;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getPPPoE(platformID) {
  if (!platformID) return null;
  try {
    const ddns = await prisma.ddns.findMany({
      where: {
        platformID
      }
    })
    return ddns;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getPPPoEById(id) {
  if (!id) return null;
  try {
    const pppoe = await prisma.pppoe.findUnique({
      where: {
        id
      }
    })
    return pppoe;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function deletePPPoE(id) {
  if (!id) return null;
  try {
    const del = await prisma.pppoe.delete({
      where: {
        id
      }
    })
    return del;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getTemplates() {
  try {
    const template = await prisma.template.findMany()
    return template;
  } catch (error) {
    console.error("An error occured:", error);
    return null;
  }
}

async function getUniqueCode(code, platformID) {
  if (!code) return null;
  try {
    const cod = await prisma.user.findFirst({
      where: { username: code, platformID },
    });

    return cod;
  } catch (error) {
    console.error("Error fetching code:", error);
    throw error;
  }
}

module.exports = {
  getPlatformConfig,
  updatePlatformConfig,
  deletePlatformConfig,
  createPlatformConfig,
  getSuperUser,
  createSuperUser,
  updateSuperUser,
  deleteSuperUser,
  createUser,
  updateUser,
  deleteUser,
  addMpesaCode,
  updateMpesaCode,
  deleteMpesaCode,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  createPackage,
  updatePackage,
  getPackage,
  getPackages,
  deletePackage,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getPlatform,
  getUserByToken,
  getUserByPhone,
  validateOperation,
  getPlatformByIP,
  getPlatformByUrl,
  getCodesByMpesa,
  getCodesByPhone,
  getPlatforms,
  getActivePlatformUsers,
  getPlatformByURLData,
  getAllPlatforms,
  getAdminByEmail,
  getMpesaPayments,
  getAdminsByID,
  getUserByPlatform,
  getPackagesByPlatformID,
  getAdminByToken,
  getPlatformIDfromPackage,
  deleteMpesaPayment,
  getStation,
  updateStation,
  deleteStation,
  createStation,
  getStations,
  getSuperUserByToken,
  getUsersByCodes,
  getDailyRevenue,
  getUsersByActiveCodes,
  getAdmins,
  getMikrotikPlatformConfig,
  getAllStations,
  getPackagesByID,
  createFunds,
  getFunds,
  updateFunds,
  deleteFunds,
  getMpesaCode,
  getPackagesByAmount,
  getSuperAdminsByPlatform,
  createDDNS,
  updateDDNS,
  getDDNS,
  getDDNSById,
  deleteDDNS,
  getDDNSByUrl,
  getUserByCode,
  getMpesaByCode,
  getPlatformByID,
  getPendingTransactions,
  createPPPoE,
  updatePPPoE,
  getPPPoE,
  getPPPoEById,
  deletePPPoE,
  getTemplates,
  getYesterdayRevenue,
  getUniqueCode,
  deleteAdminsByPlatformId,
  deleteUsersByplatformID,
  deletePackagesByplatformID,
  deleteStationsByplatformID,
  deleteMpesaByplatformID,
  deletDDNSByplatformID,
  deletePPPoEByplatformID,
  createTemplate,
  deleteTemplate,
  editTemplate
};
