const { get } = require("../mikrotik/routes/mikrotikRoutes");
const prisma = require("../prisma");
const now = new Date();
const offsetDate = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

async function validateOperation(adminID, platformID) {
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

async function getSuperUser(data) {
  try {
    const superUser = await prisma.superUser.findUnique({
      where: { email: data.email }
    });
    return superUser;
  } catch (error) {
    console.error('Error fetching super user:', error);
    throw error;
  }
}

async function createSuperUser(data) {
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
  try {
    const package = await prisma.package.findUnique({
      where: { packageID:id }
    });
    return package;
  } catch (error) {
    console.error('Error getting package:', error);
    throw error;
  }
}

async function getPackages(platformID) {
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
  return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") 
      .replace(/\s+/g, "-"); 
}

async function createPlatform(data) {
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
  try {
    const platform = await prisma.platform.findUnique({
      where: { platformID }
    });
    return platform;
  } catch (error) {
    console.error('Error getting platform:', error);
    throw error;
  }
}

async function getPlatformByUrl(url) {
  try {
    const platform = await prisma.platform.findUnique({
      where: { url }
    });
    return platform;
  } catch (error) {
    console.error('Error getting platform:', error);
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
  getPlatformByUrl
};
