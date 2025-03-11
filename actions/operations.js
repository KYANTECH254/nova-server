const prisma = require("../prisma");
const now = new Date();
const offsetDate = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

async function validateOperation(adminID, platformID) {
  if (platformID || !adminID) return null
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID }
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
  if (!platformID) return null
  try {
    const config = await prisma.platformSetting.findUnique({
      where: { platformID }
    });

    if (!config) {
      return null;
    }

    return config;
  } catch (error) {
    console.error('Error fetching platform configuration:', error);
    throw error;
  }
}

async function getPlatformByIP(ip) {
  if (!ip) return null
  try {
    const platform = await prisma.platformSetting.findFirst({
      where: { platformIP: ip }
    });

    if (!platform) {
      return null;
    }

    return platform;
  } catch (error) {
    console.error('Error fetching platform by IP:', error);
    throw error;
  }
}

async function updatePlatformConfig(platformID, data) {
  if (!platformID || !data) return;
  try {
    const config = await prisma.platformSetting.update({
      where: { platformID },
      data: {
        ...data,
        updatedAt: offsetDate
      }
    });

    return config;
  } catch (error) {
    console.error('Error updating platform configuration:', error);
    throw error;
  }
}

async function deletePlatformConfig(platformID) {
  if (!platformID) return null
  try {
    await prisma.platformSetting.delete({
      where: { platformID }
    });
  } catch (error) {
    console.error('Error deleting platform configuration:', error);
    throw error;
  }
}

async function createPlatformConfig(platformID, data) {
  if (!platformID || !data) return null
  try {
    const config = await prisma.platformSetting.create({
      data: {
        platformID,
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }
    });

    return config;
  } catch (error) {
    console.error('Error creating platform configuration:', error);
    throw error;
  }
}

async function getSuperUser() {
  try {
    const superUser = await prisma.superUser.findFirst();
    return superUser;
  } catch (error) {
    console.error('Error fetching super user:', error);
    throw error;
  }
}

async function createSuperUser(data) {
  if (!data) return null
  try {
    const superUser = await prisma.superUser.create({
      data: {
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }
    });
    return superUser;
  } catch (error) {
    console.error('Error creating super user:', error);
    throw error;
  }
}

async function updateSuperUser(data) {
  if (!data) return null
  try {
    const superUser = await prisma.superUser.update({
      where: { id: data.id },
      data: {
        ...data,
        updatedAt: offsetDate
      }
    });
    return superUser;
  } catch (error) {
    console.error('Error updating super user:', error);
    throw error;
  }
}

async function deleteSuperUser(id) {
  if (!id) return null
  try {
    const superUser = await prisma.superUser.delete({
      where: { id }
    });
    return superUser;
  } catch (error) {
    console.error('Error deleting super user:', error);
    throw error;
  }
}

async function createUser(data) {
  if (!data) return null
  try {
    const user = await prisma.user.create({
      data: {
        ...data,
        package: data.packageID
          ? { connect: { id: data.packageID } }
          : { create: data.package },
        createdAt: offsetDate,
        updatedAt: offsetDate
      }
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function updateUser(id, data) {
  if (!id || !data) return null
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: offsetDate
      }
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function deleteUser(id) {
  if (!id) return null
  try {
    const user = await prisma.user.delete({
      where: { id }
    });
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

async function getUserByPhone(phone) {
  if (!phone) return null
  try {
    const users = await prisma.user.findMany({
      where: { phone }
    });
    return users;
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    throw error;
  }
}

async function getUserByToken(token) {
  if (!token) return null
  try {
    const user = await prisma.user.findUnique({
      where: { token }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user by token:', error);
    throw error;
  }
}

async function addMpesaCode(data) {
  if (!data) return null
  try {
    const mpesaCode = await prisma.mpesa.create({
      data: {
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }

    });
    return mpesaCode;
  } catch (error) {
    console.error('Error adding mpesa code:', error);
    throw error;
  }
}

async function updateMpesaCode(code, data) {
  if (!code || !data) return null
  try {
    const mpesaCode = await prisma.mpesa.update({
      where: { code },
      data: {
        ...data,
        updatedAt: offsetDate
      }
    });
    return mpesaCode;
  } catch (error) {
    console.error('Error updating mpesa code:', error);
    throw error;
  }
}

async function deleteMpesaCode(code) {
  if (!code) return null
  try {
    const mpesaCode = await prisma.mpesa.delete({
      where: { code }
    });
    return mpesaCode;
  } catch (error) {
    console.error('Error deleting mpesa code:', error);
    throw error;
  }
}

async function createAdmin(data) {
  if (!data) return null
  try {
    const admin = await prisma.admin.create({
      data: {
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }
    });
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

async function updateAdmin(id, data) {
  if (!id || !data) return null
  try {
    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }

    });
    return admin;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
}

async function deleteAdmin(id) {
  if (!id) return null
  try {
    const admin = await prisma.admin.delete({
      where: { id }
    });
    return admin;
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
}

async function createPackage(data) {
  if (!data) return null
  try {
    const package = await prisma.package.create({
      data: {
        ...data,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }

    });
    return package;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
}

async function updatePackage(id, data) {
  if (!id || !data) return null
  try {
    const package = await prisma.package.update({
      where: { id },
      data: {
        ...data,
        updatedAt: offsetDate
      }
    });
    return package;
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
}

async function getPackage(id) {
  if (!id) return null
  try {
    const package = await prisma.package.findUnique({
      where: { packageID: id }
    });
    return package;
  } catch (error) {
    console.error('Error getting package:', error);
    throw error;
  }
}

async function getPackages(platformID) {
  if (!platformID) return null
  try {
    const packages = await prisma.package.findMany({
      where: { platformID }
    });
    return packages;
  } catch (error) {
    console.error('Error getting packages:', error);
    throw error;
  }
}

async function deletePackage(id) {
  if (!id) return null
  try {
    const package = await prisma.package.delete({
      where: { id }
    });
    return package;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
}

function generateSlug(name) {
  if (!name) return null
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function createPlatform(data) {
  if (!data) return null
  try {
    const slug = generateSlug(data.name);
    const platform = await prisma.platform.create({
      data: {
        ...data,
        url: slug,
        createdAt: offsetDate,
        updatedAt: offsetDate
      }
    });

    return platform;
  } catch (error) {
    console.error("Error creating platform:", error);
    throw error;
  }
}

async function updatePlatform(id, data) {
  if (!data || !id) return null
  try {
    const platform = await prisma.platform.update({
      where: { id },
      data: {
        ...data,
        updatedAt: offsetDate,
      }
    });
    return platform;
  } catch (error) {
    console.error('Error updating platform:', error);
    throw error;
  }
}

async function deletePlatform(id) {
  if (!id) return null
  try {
    const platform = await prisma.platform.delete({
      where: { id }
    });
    return platform;
  } catch (error) {
    console.error('Error deleting platform:', error);
    throw error;
  }
}

async function getPlatform(platformID) {
  if (!platformID) return null
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID }
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

    platform.phone = admin.phone;
    return platform;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getAdmin(adminID) {
  if (!adminID) return null
  try {
    const admin = await prisma.admin.findUnique({
      where: { adminID }
    });
    return admin;
  } catch (error) {
    console.error('Error getting admin:', error);
    throw error;
  }
}

async function getPlatformByUrl(url) {
  if (!url) return null
  try {
    const platform = await prisma.platform.findUnique({
      where: { url }
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
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getCodesByPhone(phone) {
  if (!phone) return null;
  try {
    const codes = await prisma.user.findMany({
      where: { phone, status: "active" }
    })

    return codes;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getCodesByMpesa(code) {
  if (!code) return null;
  try {
    const codes = await prisma.user.findMany({
      where: { code, status: "active" }
    })

    return codes;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getPlatforms() {
  try {
    const platforms = await prisma.platform.findMany({
      select: { platformID: true }
    });
    return platforms;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getActivePlatformUsers(platformID) {
  if (!platformID) return null;
  try {
    const users = await prisma.user.findMany({
      where: { status: "active", platformID: platform.platformID },
      select: { id: true, username: true }
    });

    return users;
  } catch (error) {
    console.error('Error getting users:', error);
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
  getActivePlatformUsers
};
